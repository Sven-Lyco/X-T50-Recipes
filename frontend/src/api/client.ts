import axios from 'axios'

const client = axios.create({ baseURL: '/api', withCredentials: true })

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('loggedIn')
      window.location.replace('/login')
      return new Promise(() => {})
    }
    return Promise.reject(error)
  }
)

export default client
