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
      const newBlog = {
        title: 'React Hooks',
        author: 'Jackie Chan',
        url: 'https://reacthooks.com/',
        likes: 9,
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      const titles = blogsAtEnd.map(r => r.title)

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

      assert(titles.includes('React Hooks'))
    })

    test('if likes is missing it will default to 0', async () => {
      const blogWithoutLike = {
        title: 'Artificial Intelligence',
        author: 'Elon Musk',
        url: 'https://x.com/ai-elonmusk',
      }

      const response = await api
        .post('/api/blogs')
        .send(blogWithoutLike)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blog = response.body

      assert.strictEqual(blog.likes, 0)
    })

    test('blogs without title responds with 400', async () => {
      const blogWithoutTitle = {
        author: 'Albert Einstein',
        url: 'https://google.com/relativity',
        likes: 999,
      }

      await api
        .post('/api/blogs')
        .send(blogWithoutTitle)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })

    test('blogs without url respond with 400', async () => {
      const blogWithoutUrl = {
        title: 'Theory of Relativity',
        author: 'Albert Einstein',
        likes: 999,
      }

      await api
        .post('/api/blogs')
        .send(blogWithoutUrl)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })

    test('blogs without title and url respond with 400', async () => {
      const blogWithoutTitleAndUrl = {
        author: 'Albert Einstein',
        likes: 999,
      }

      await api
        .post('/api/blogs')
        .send(blogWithoutTitleAndUrl)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
  })

  describe('deleting a specific blog', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)

      const titles = blogsAtEnd.map(b => b.title)
      assert(!titles.includes(blogToDelete.title))
    })
  })
})



after(async () => {
  await mongoose.connection.close()
})