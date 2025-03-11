const { test, beforeEach, after, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const User = require('../models/user')

const api = supertest(app)

describe('when there are some users initially', () => {
  beforeEach( async () => {
    await User.deleteMany({})
    const userObject = helper.initialUsers.map(user => new User(user))
    const promiseArray = userObject.map(user => user.save())
    await Promise.all(promiseArray)
  })

  test('returns the users in json format', async () => {
    await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  describe('adding new users', () => {
    test('valid users can be added', async () => {
      const newUser = {
        username: 'demouser',
        name: 'demoname',
        password: 'demopassword'
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const userAtEnd = await helper.usersInDb()
      const usernames = userAtEnd.map(user => user.username)

      assert.strictEqual(userAtEnd.length, helper.initialUsers.length + 1)
      assert(usernames.includes('demouser'))
    })

    test('if username is not atleast of length 3, user cannot be added', async () => {
      const invalidUser = {
        username: 'no',
        name: 'invalidname',
        password: 'invalidpass'
      }

      const response = await api
        .post('/api/users')
        .send(invalidUser)
        .expect(400)

      assert.strictEqual(response.body.error, 'User validation failed: username: Path `username` (`no`) is shorter than the minimum allowed length (3).')
      const usersAtEnd = await helper.usersInDb()
      assert.strictEqual(usersAtEnd.length, helper.initialUsers.length)
    })

    test('if password is not atleast of length 3, user cannot be added', async () => {
      const invalidUser = {
        username: 'invaliduser',
        name: 'invalidname',
        password: 'no'
      }

      const response = await api
        .post('/api/users')
        .send(invalidUser)
        .expect(400)

      assert.strictEqual(response.body.error, 'password must be given and must be at least 3 characters long')
      const usersAtEnd = await helper.usersInDb()
      assert.strictEqual(usersAtEnd.length, helper.initialUsers.length)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})


