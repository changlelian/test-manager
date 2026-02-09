import axios from 'axios'

const api = axios.create({
  baseURL: '/api/',
  timeout: 10000,
})

// Request interceptor for adding token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

import { ElMessage } from 'element-plus'

// Response interceptor for handling errors
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_id')
      
      const errorCode = error.response.data?.code
      if (errorCode === 'token_not_valid_single_session') {
        ElMessage.error('您已在别处登录，当前会话已失效')
      } else {
        ElMessage.error('登录已过期，请重新登录')
      }
      
      // Redirect to login page
      // Use router push if available, or window.location
      // window.location.href = '/login'
      // To avoid full reload and keep message visible:
      setTimeout(() => {
          if (window.location.pathname !== '/login') {
             window.location.href = '/login'
          }
      }, 1500)
    }
    return Promise.reject(error)
  }
)

export default api
