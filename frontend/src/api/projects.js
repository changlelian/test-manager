import api from './index'

export const getProjects = (params) => {
  return api.get('projects/', { params })
}

export const getProject = (id) => {
  return api.get(`projects/${id}/`)
}

export const createProject = (data) => {
  return api.post('projects/', data)
}

export const updateProject = (id, data) => {
  return api.patch(`projects/${id}/`, data)
}

export const deleteProject = (id) => {
  return api.delete(`projects/${id}/`)
}

// Versions
export const getVersions = (params) => {
  return api.get('versions/', { params })
}

export const createVersion = (data) => {
  return api.post('versions/', data)
}

export const updateVersion = (id, data) => {
  return api.patch(`versions/${id}/`, data)
}

export const deleteVersion = (id) => {
  return api.delete(`versions/${id}/`)
}
