const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')

const api = supertest(app)

const initialBlogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
  }
]

beforeEach(async () => {
  await Blog.deleteMany({})
  const blogObject = initialBlogs.map(blog => new Blog(blog))
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

  assert.strictEqual(response.body.length, 2)
})

test('unique identifier property is named id not as default _id', async () => {
  const response = await api.get('/api/blogs')
  const blog = response.body[0]
  // eslint-disable-next-line no-prototype-builtins
  assert.strictEqual(blog.hasOwnProperty('id'), true)
  // eslint-disable-next-line no-prototype-builtins
  assert.strictEqual(blog.hasOwnProperty('_id'), false)
})

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

  const response = await api.get('/api/blogs')
  const titles = response.body.map(r => r.title)

  assert.strictEqual(response.body.length, initialBlogs.length + 1)

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

after(async () => {
  await mongoose.connection.close()
})