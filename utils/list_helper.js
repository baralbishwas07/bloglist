const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item.likes
  }

  return blogs.length === 0
    ? 0
    : blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  if(blogs.length === 0) {
    return null
  }
  const mostLikes = Math.max(...blogs.map(blog => blog.likes))
  const favorite = blogs.filter(blog => blog.likes === mostLikes)[0]

  return {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes
  }

}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}