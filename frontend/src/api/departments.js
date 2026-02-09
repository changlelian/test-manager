import api from './index'

export const getDepartments = (params) => {
  return api.get('departments/', { params })
}

export const getDepartment = (id) => {
  return api.get(`departments/${id}/`)
}

export const createDepartment = (data) => {
  return api.post('departments/', data)
}

export const updateDepartment = (id, data) => {
  return api.patch(`departments/${id}/`, data)
}

export const deleteDepartment = (id) => {
  return api.delete(`departments/${id}/`)
}
