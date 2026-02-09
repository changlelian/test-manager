<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo" :class="{ 'collapsed': isCollapse }">
        <el-icon class="logo-icon"><Platform /></el-icon>
        <span v-show="!isCollapse">测试管理平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        router
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>

        <el-menu-item index="/statistics" v-if="isAdmin">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据统计</span>
        </el-menu-item>

        <el-menu-item index="/recycle-bin" v-if="isAdmin">
          <el-icon><Delete /></el-icon>
          <span>回收站</span>
        </el-menu-item>

        <el-menu-item index="/projects" v-if="isAdmin">
          <el-icon><Folder /></el-icon>
          <span>项目管理</span>
        </el-menu-item>

        <el-menu-item index="/versions" v-if="isAdmin">
          <el-icon><Platform /></el-icon>
          <span>版本管理</span>
        </el-menu-item>

        <el-sub-menu index="/testcases">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>用例管理</span>
          </template>
          <el-sub-menu 
            v-for="project in projects" 
            :key="project.id" 
            :index="`/projects/${project.id}`"
          >
            <template #title>
              <el-icon><Folder /></el-icon>
              <span>{{ project.name }}</span>
            </template>
            <el-menu-item 
              v-for="version in (project.versions || [])" 
              :key="version.id"
              :index="`/projects/${project.id}/testcases?version=${version.id}&versionName=${version.name}`"
            >
              <span>{{ version.name }}</span>
            </el-menu-item>
          </el-sub-menu>
        </el-sub-menu>

        <el-menu-item index="/departments" v-if="isAdmin">
          <el-icon><OfficeBuilding /></el-icon>
          <span>部门管理</span>
        </el-menu-item>

        <el-menu-item index="/users" v-if="isAdmin">
          <el-icon><User /></el-icon>
          <span>人员管理</span>
        </el-menu-item>

        <el-sub-menu index="/settings" v-if="isAdmin">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/settings/notification">
            <el-icon><Bell /></el-icon>
            <span>通知设置</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header>
        <div class="header-left">
          <el-icon 
            class="collapse-btn" 
            @click="toggleCollapse"
          >
            <component :is="isCollapse ? Expand : Fold" />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
              {{ item.text }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ username }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main>
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Odometer, Folder, Document, OfficeBuilding, User, ArrowDown, Platform, UserFilled, DataAnalysis, Fold, Expand, Delete, Setting, Bell } from '@element-plus/icons-vue'
import { getProjects } from '@/api/projects'

const route = useRoute()
const router = useRouter()
const projects = ref([])
const username = ref(localStorage.getItem('username') || '用户')
const isCollapse = ref(false)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const isAdmin = computed(() => {
  const role = localStorage.getItem('user_role')
  return role === 'admin'
})

const fetchProjects = async () => {
  try {
    // 获取所有项目用于显示在侧边栏
    const res = await getProjects({ page_size: 100 })
    projects.value = res.results || []
  } catch (error) {
    console.error('Failed to fetch projects for sidebar', error)
  }
}

// 监听路由变化，如果是在项目管理页面进行了操作，可能需要刷新侧边栏
watch(() => route.path, (newPath) => {
  if (newPath === '/projects' || newPath.startsWith('/projects')) {
    fetchProjects()
  }
})

onMounted(() => {
  fetchProjects()
  window.addEventListener('project-updated', fetchProjects)
})

onUnmounted(() => {
  window.removeEventListener('project-updated', fetchProjects)
})

const activeMenu = computed(() => {
  // Highlights the menu item even when in sub-routes
  if (route.path.startsWith('/testcases') && !route.params.projectId) return '/testcases'
  return route.path
})

const breadcrumbs = computed(() => {
  const items = []
  
  if (route.name === 'ProjectTestCaseList' || (route.path.startsWith('/projects/') && route.path.includes('/testcases'))) {
    items.push({ text: '用例管理' })
    
    const projectId = route.params.projectId
    if (projectId) {
        // Try to find project in loaded list
        let project = projects.value.find(p => p.id == projectId)
        
        if (project) {
          items.push({ text: project.name })
          
          const versionId = route.query.version
          if (versionId && project.versions) {
            const version = project.versions.find(v => v.id == versionId)
            if (version) {
              items.push({ text: version.name })
            }
          }
        }
    }
  } else {
     const name = routeNameMap[route.name]
     if (name) {
         items.push({ text: name })
     } else if (route.name && route.name !== 'Dashboard') {
         // Fallback for unknown routes, exclude Dashboard since it's Home
         items.push({ text: route.name })
     }
  }
  
  return items
})

const currentRouteName = computed(() => route.name)


const routeNameMap = {
  'Dashboard': '仪表盘',
  'Statistics': '数据统计',
  'TestCaseList': '用例列表',
  'TaskAssignment': '任务分配与执行',
  'ProjectTestCaseList': '用例列表', // Add mapping just in case breadcrumb logic falls through
  'TestCaseCreate': '创建用例',
  'TestCaseEdit': '编辑用例',
  'ProjectList': '项目管理',
  'VersionList': '版本管理',
  'DepartmentList': '部门列表',
  'UserList': '人员列表',
  'UserProfile': '个人中心',
  'NotificationSettings': '通知设置',
  'RecycleBin': '回收站'
}

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_id')
    localStorage.removeItem('username')
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.aside {
  background-color: #304156;
  color: #fff;
  transition: width 0.3s;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  z-index: 10;
  display: flex;
  flex-direction: column;
}
.aside :deep(.el-menu-vertical:not(.el-menu--collapse)) {
  width: 220px;
}
.logo {
  height: 60px;
  line-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  background-color: #2b2f3a;
  overflow: hidden;
  white-space: nowrap;
  transition: all 0.3s;
}
.logo-icon {
  margin-right: 10px;
  font-size: 24px;
}
.logo.collapsed .logo-icon {
  margin-right: 0;
}
.el-menu {
  border-right: none;
  flex: 1;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  margin-right: 15px;
  color: #606266;
  transition: color 0.3s;
}
.collapse-btn:hover {
  color: #409EFF;
}
.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 9;
}
.header-right {
  display: flex;
  align-items: center;
}
.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
}
.username {
  margin-left: 8px;
  font-weight: 500;
}
.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

/* Transition animation */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
