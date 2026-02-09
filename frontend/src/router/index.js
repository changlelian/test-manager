import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'
import Dashboard from '../views/Dashboard.vue'
import TestCaseList from '../views/testcases/TestCaseList.vue'
import TestCaseForm from '../views/testcases/TestCaseForm.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue') // Lazy load
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard
      },
      {
        path: 'testcases',
        name: 'TestCaseList',
        component: TestCaseList
      },
      {
        path: 'projects/:projectId/testcases',
        name: 'ProjectTestCaseList',
        component: TestCaseList,
        props: true
      },
      {
        path: 'projects/:projectId/assignment',
        name: 'TaskAssignment',
        component: () => import('../views/testcases/TaskAssignment.vue'),
        props: true
      },
      {
        path: 'testcases/create',
        name: 'TestCaseCreate',
        component: TestCaseForm
      },
      {
        path: 'testcases/:id/edit',
        name: 'TestCaseEdit',
        component: TestCaseForm
      },
      {
        path: 'testcases/:id',
        name: 'TestCaseDetail',
        component: TestCaseForm,
        props: { isView: true }
      },
      // Placeholders for other modules
      {
        path: 'projects',
        name: 'ProjectList',
        component: () => import('../views/projects/ProjectList.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'versions',
        name: 'VersionList',
        component: () => import('../views/projects/VersionList.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'departments',
        name: 'DepartmentList',
        component: () => import('../views/orgs/DepartmentList.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'users',
        name: 'UserList',
        component: () => import('../views/users/UserList.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('../views/admin/Statistics.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'recycle-bin',
        name: 'RecycleBin',
        component: () => import('../views/admin/RecycleBin.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('../views/users/UserProfile.vue')
      },
      {
        path: 'settings/notification',
        name: 'NotificationSettings',
        component: () => import('../views/system/NotificationSettings.vue'),
        meta: { requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('user_role')

  if (to.name !== 'Login' && !token) {
    next({ name: 'Login' })
  } else if (to.meta.requiresAdmin && role !== 'admin') {
    next({ name: 'Dashboard' }) // Redirect non-admins to Dashboard
  } else {
    next()
  }
})

export default router
