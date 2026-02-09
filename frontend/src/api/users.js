import api from './index'

export const getUsers = (params) => {
  return api.get('users/', { params })
}

export const getUser = (id) => {
  return api.get(`users/${id}/`)
}

export const createUser = (data) => {
  return api.post('users/', data)
}

export const updateUser = (id, data) => {
  return api.patch(`users/${id}/`, data)
}

export const deleteUser = (id) => {
  return api.delete(`users/${id}/`)
}

export const getCurrentUser = () => {
  return api.get('users/me/')
}

export const changePassword = (data) => {
  return api.post('users/change-password/', data)
}

export const resetPassword = (id, data) => {
  return api.post(`users/${id}/reset-password/`, data)
}
