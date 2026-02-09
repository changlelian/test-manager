import api from './index'

export const getTestCases = (params) => {
  return api.get('testcases/', { params })
}

export const getTestCase = (id) => {
  return api.get(`testcases/${id}/`)
}

export const createTestCase = (data) => {
  return api.post('testcases/', data)
}

export const updateTestCase = (id, data) => {
  return api.patch(`testcases/${id}/`, data)
}

export const deleteTestCase = (id) => {
  return api.delete(`testcases/${id}/`)
}

export const batchDeleteTestCases = (ids) => {
  return api.post('testcases/batch-delete/', { ids })
}

export const batchUpdateTestCases = (ids, data) => {
  return api.post('testcases/batch-update/', { ids, data })
}

export const getTestCaseLogs = (id) => {
  return api.get(`testcases/${id}/logs/`)
}

export const importTestCases = (data) => {
  return api.post('testcases/import/', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const exportTestCases = (params) => {
  return api.get('testcases/export/', { 
    params,
    responseType: 'blob'
  })
}

export const copyTestCasesFromVersion = (data) => {
  return api.post('testcases/copy-from-version/', data)
}

export const getDashboardStats = () => {
  return api.get('testcases/dashboard-stats/')
}

export const getModuleStatistics = (params) => {
  return api.get('testcases/module-statistics/', { params })
}

export const getAdminStatistics = () => {
  return api.get('testcases/admin-statistics/')
}

export const getVersionModules = (params) => {
  return api.get('testcases/version-modules/', { params })
}

export const getModules = (params) => {
  return api.get('testcases/modules/', { params })
}

export const assignTestCases = (data) => {
  return api.post('testcases/assign-cases/', data)
}

export const uploadAttachment = (data) => {
  return api.post('attachments/', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const deleteAttachment = (id) => {
  return api.delete(`attachments/${id}/`)
}

export const getRecycleBinItems = () => {
  return api.get('recycle-bin/')
}

export const restoreTestCase = (id) => {
  return api.post(`recycle-bin/${id}/restore/`)
}

export const permanentDeleteTestCase = (id) => {
  return api.delete(`recycle-bin/${id}/`)
}

export const getTestCaseComments = (testCaseId) => {
  return api.get('comments/', { params: { test_case: testCaseId } })
}

export const createTestCaseComment = (data) => {
  return api.post('comments/', data)
}

export const updateTestCaseComment = (id, data) => {
  return api.patch(`comments/${id}/`, data)
}

export const deleteTestCaseComment = (id) => {
  return api.delete(`comments/${id}/`)
}
