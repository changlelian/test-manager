<template>
  <div class="dashboard">
    <h2>仪表盘</h2>
    
    <!-- User Stats -->
    <el-row :gutter="20" class="mb-4">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>今日我 新增用例</span>
              <el-tag type="primary">Created</el-tag>
            </div>
          </template>
          <div class="stat-value">{{ userStats.created || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>今日我 优化用例</span>
              <el-tag type="warning">Edited</el-tag>
            </div>
          </template>
          <div class="stat-value">{{ userStats.edited || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>今日我 执行用例</span>
              <el-tag type="success">Executed</el-tag>
            </div>
          </template>
          <div class="stat-value">{{ userStats.executed || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-4">
      <!-- Projects Table -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="h-full">
          <template #header>
            <div class="card-header">
              <span>参与的项目</span>
              <el-icon><Folder /></el-icon>
            </div>
          </template>
          <el-table :data="projects" style="width: 100%" height="300">
            <el-table-column prop="name" label="项目名称" show-overflow-tooltip />
            <el-table-column prop="role" label="角色" width="100">
              <template #default="{ row }">
                <el-tag :type="row.role === 'Owner' ? 'danger' : 'info'" size="small">{{ row.role }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- Version Stats Pie Chart -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="h-full">
          <template #header>
            <div class="card-header">
              <span>当前版本用例分布</span>
              <el-icon><PieChart /></el-icon>
            </div>
          </template>
          <div ref="chartRef" style="height: 300px; width: 100%;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Recent Logs -->
    <el-row>
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近操作日志</span>
              <el-icon><Timer /></el-icon>
            </div>
          </template>
          <div class="log-container">
            <el-timeline>
              <el-timeline-item
                v-for="(log, index) in logs"
                :key="index"
                :timestamp="formatDate(log.created_at)"
                :type="getLogType(log.action)"
                placement="top"
              >
                <el-card shadow="never" class="log-card">
                  <div class="log-header">
                    <span class="operator">{{ log.operator }}</span>
                    <el-tag size="small" :type="getLogType(log.action)" effect="plain">{{ log.action }}</el-tag>
                    <span v-if="log.test_case_id" class="case-link" @click="$router.push(`/testcases/${log.test_case_id}`)">
                      #{{ log.test_case_id }} {{ log.test_case }}
                    </span>
                  </div>
                  <div class="log-content">{{ log.content }}</div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getDashboardStats } from '@/api/testcases'
import * as echarts from 'echarts'
import { Folder, PieChart, Timer } from '@element-plus/icons-vue'

const projects = ref([])
const logs = ref([])
const userStats = ref({})
const chartRef = ref(null)
let chartInstance = null

const fetchData = async () => {
  try {
    const res = await getDashboardStats()
    projects.value = res.projects || []
    logs.value = res.logs || []
    userStats.value = res.user_stats || {}
    
    initChart(res.version_stats || [])
  } catch (error) {
    console.error('Failed to fetch dashboard stats', error)
    if (error.response && error.response.status === 401) {
       // Token might be invalid/expired, let interceptor handle or force login
       // But router guard should have caught this if token was missing.
       // If token is present but invalid, api interceptor usually handles it.
    }
  }
}

const initChart = (data) => {
  if (!chartRef.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: 'Test Cases',
        type: 'pie',
        radius: '50%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  chartInstance.setOption(option)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString()
}

const getLogType = (action) => {
  if (action.includes('Create') || action.includes('Import')) return 'success'
  if (action.includes('Update') || action.includes('Edit')) return 'warning'
  if (action.includes('Delete')) return 'danger'
  if (['Login'].includes(action)) return 'info'
  return 'info'
}

// Handle resize
const handleResize = () => {
  chartInstance && chartInstance.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance && chartInstance.dispose()
})
</script>

<style scoped>
.dashboard {
  /* padding: 20px; */
}
.mb-4 {
  margin-bottom: 20px;
}
.stat-card {
  height: 100%;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  color: #409EFF;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.h-full {
  height: 100%;
}
.log-container {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}
.log-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}
.operator {
  font-weight: bold;
}
.case-link {
  color: #409EFF;
  cursor: pointer;
}
.case-link:hover {
  text-decoration: underline;
}
.log-content {
  font-size: 13px;
  color: #666;
  white-space: pre-wrap;
}
</style>