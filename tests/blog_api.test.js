const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')

const api = supertest(app)

describe('when there are some blogs initially', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    const blogObject = helper.initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObject.map(blog => blog.save())
    await Promise.all(promiseArray)
  })

  test('returns the blog in json format', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('returns the correct amount of blog posts', async () => {
    const response = await api.get('/api/blogs')

    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })

  describe('viewing a specific blog', () => {

    test('unique identifier property is named id not as default _id', async () => {
      const response = await api.get('/api/blogs')
      const blog = response.body[0]
      // eslint-disable-next-line no-prototype-builtins
      assert.strictEqual(blog.hasOwnProperty('id'), true)
      // eslint-disable-next-line no-prototype-builtins
      assert.strictEqual(blog.hasOwnProperty('_id'), false)
    })
  })

  describe('addition of new blog', () => {
    test('a valid blog can be added', async () => {
      const newUser = {
        username: 'testuser',
        name: 'Test User',
        password: 'testpassword'
      }

      const { body } = await helper.loginResponse(newUser)
      const token = body.token

      const newBlog = {
        title: 'React Hooks',
        author: 'Jackie Chan',
        url: 'https://reacthooks.com/',
        likes: 9,
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      const titles = blogsAtEnd.map(r => r.title)

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

      assert(titles.includes('React Hooks'))
    })

    test('if likes is missing it will default to 0', async () => {
      const newUser = {
        username: 'no Likes',
        name: 'Likeless',
        password: 'nolikepass'
      }

      const { body } = await helper.loginResponse(newUser)
      const token = body.token

      const blogWithoutLike = {
        title: 'Artificial Intelligence',
        author: 'Elon Musk',
        url: 'https://x.com/ai-elonmusk',
      }

      const response = await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(blogWithoutLike)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blog = response.body

      assert.strictEqual(blog.likes, 0)
    })

    test('blogs without title responds with 400', async () => {
      const newUser = {
        username: 'titleLess',
        name: 'no Title',
        password: 'noTitlePass'
      }

      const { body } = await helper.loginResponse(newUser)
      const token = body.token

      const blogWithoutTitle = {
        author: 'Albert Einstein',
        url: 'https://google.com/relativity',
        likes: 999,
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(blogWithoutTitle)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })

    test('blogs without url respond with 400', async () => {
      const newUser = {
        username: 'urlLess',
        name: 'no Url',
        password: 'noUrlPass'
      }

      const { body } = await helper.loginResponse(newUser)
      const token = body.token

      const blogWithoutUrl = {
        title: 'Theory of Relativity',
        author: 'Albert Einstein',
        likes: 999,
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(blogWithoutUrl)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })

    test('blogs without title and url respond with 400', async () => {
      const newUser = {
        username: 'titleUrlLess',
        name: 'no TitleUrl',
        password: 'noTitleUrlPass'
      }

      const { body } = await helper.loginResponse(newUser)
      const token = body.token

      const blogWithoutTitleAndUrl = {
        author: 'Albert Einstein',
        likes: 999,
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(blogWithoutTitleAndUrl)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
  })

  describe('deleting a specific blog', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const newUser = {
        username: 'deleteTester',
        name: 'Test Delete',
        password: 'deletePass'
      }

      const { body } = await helper.loginResponse(newUser)
      const token = body.token

      const newBlog = {
        title: 'Blog to be deleted',
        author: 'Mr. Erase',
        url: 'https://delete.com',
        likes: 1,
      }

      const postRes = await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)

      const blogToDelete = postRes.body

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      const titles = blogsAtEnd.map(b => b.title)
      assert(!titles.includes(blogToDelete.title))
    })
  })

  describe('updating a specific blog', () => {
    test('succeed with valid data', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToUpdate = blogsAtStart[0]
      const newBlog = {
        title: 'Go To Statement Considered Harmful',
        author: 'Edsger W. Dijkstra',
        url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
        likes: 11,
      }

      const updatedBlog = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(updatedBlog.body.likes, 11)
    })

    test('if id is invalid returns 400', async () => {
      const invalidId = '12345'

      await api
        .put(`/api/blogs/${invalidId}`)
        .expect(400)
    })

    test('if non existing id returns 400', async () => {
      const nonExistingId = await helper.nonExistingId()

      await api
        .put(`/api/blogs/${nonExistingId}`)
        .expect(400)
    })
  })
})



after(async () => {
  await mongoose.connection.close()
})