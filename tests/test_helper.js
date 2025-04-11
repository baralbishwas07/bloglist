const Blog = require('../models/blog')
const User = require('../models/user')
const app = require('../app')
const supertest = require('supertest')

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

const initialUsers = [
  {
    username: 'user1',
    name: 'name1',
    password: 'password1'
  },
  {
    username: 'user2',
    name: 'name2',
    password: 'password2'
  }
]

const loginResponse = async (newUser) => {

  await api
    .post('/api/users')
    .send(newUser)

  return await api
    .post('/api/login')
    .send({
      username: newUser.username,
      password: newUser.password
    })
}

const nonExistingId = async () => {
  const blog = new Blog({
    title: 'Is web development dead?',
    author: 'Mr. yesbody',
    url: 'https://google.com/web-dev',
    likes: 34,
  })

  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(user => user.toJSON())
}
module.exports = {
  initialBlogs,
  initialUsers,
  loginResponse,
  nonExistingId,
  blogsInDb,
  usersInDb
}