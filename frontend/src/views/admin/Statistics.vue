<template>
  <div class="statistics-container">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon class="header-icon"><DataAnalysis /></el-icon> 数据统计</h2>
        <span class="header-subtitle">项目与版本执行情况全景视图</span>
      </div>
      <el-button type="primary" icon="Refresh" circle @click="fetchData" :loading="loading" />
    </div>

    <div v-loading="loading" class="content-wrapper">
      <el-empty v-if="!loading && (!projects || projects.length === 0)" description="暂无项目数据" />
      
      <div v-else class="project-list">
        <div v-for="project in projects" :key="project.id" class="project-card-wrapper">
          <el-card shadow="hover" class="project-card">
            <template #header>
              <div class="project-header">
                <div class="project-info">
                  <el-icon class="project-icon"><FolderOpened /></el-icon>
                  <span class="project-name">{{ project.name }}</span>
                  <el-tag size="small" effect="plain" round>{{ project.versions?.length || 0 }} 个版本</el-tag>
                </div>
              </div>
            </template>

            <div v-if="project.versions && project.versions.length > 0">
              <el-collapse v-model="activeVersions" class="custom-collapse">
                <el-collapse-item 
                  v-for="version in project.versions" 
                  :key="version.id" 
                  :name="`${project.id}-${version.id}`"
                >
                  <template #title>
                    <div class="version-header">
                      <span class="version-name">{{ version.name }}</span>
                      <el-tag :type="getVersionStatusType(version.status)" size="small" effect="light">
                        {{ version.status }}
                      </el-tag>
                      
                      <!-- Mini Progress in Header -->
                      <div class="header-progress" v-if="version.stats.assigned > 0">
                         <span class="progress-label">进度:</span>
                         <el-progress 
                           :percentage="calculateExecutionRateVal(version.stats)" 
                           :stroke-width="6" 
                           :show-text="false"
                           :color="getProgressColor"
                           style="width: 100px; margin-left: 8px;"
                         />
                         <span class="progress-text">{{ calculateExecutionRate(version.stats) }}</span>
                      </div>
                    </div>
                  </template>
                  
                  <div class="stats-dashboard">
                    <!-- Key Metrics Cards -->
                    <el-row :gutter="16" class="metrics-row">
                      <el-col :xs="12" :sm="6" :md="4">
                        <div class="stat-card total">
                          <div class="stat-icon-wrapper">
                            <el-icon><Document /></el-icon>
                          </div>
                          <div class="stat-info">
                            <div class="stat-value">{{ version.stats.total }}</div>
                            <div class="stat-label">总用例</div>
                          </div>
                        </div>
                      </el-col>
                      <el-col :xs="12" :sm="6" :md="4">
                        <div class="stat-card assigned">
                          <div class="stat-icon-wrapper">
                            <el-icon><User /></el-icon>
                          </div>
                          <div class="stat-info">
                            <div class="stat-value">{{ version.stats.assigned }}</div>
                            <div class="stat-label">已分配</div>
                          </div>
                        </div>
                      </el-col>
                      <el-col :xs="12" :sm="6" :md="4">
                        <div class="stat-card executed">
                          <div class="stat-icon-wrapper">
                            <el-icon><VideoPlay /></el-icon>
                          </div>
                          <div class="stat-info">
                            <div class="stat-value">{{ version.stats.assigned_executed }}</div>
                            <div class="stat-label">已执行</div>
                          </div>
                        </div>
                      </el-col>
                      <el-col :xs="12" :sm="6" :md="4">
                        <div class="stat-card pass">
                          <div class="stat-icon-wrapper">
                            <el-icon><CircleCheckFilled /></el-icon>
                          </div>
                          <div class="stat-info">
                            <div class="stat-value text-success">{{ getPassCount(version) }}</div>
                            <div class="stat-label">通过数</div>
                          </div>
                        </div>
                      </el-col>
                       <el-col :xs="12" :sm="6" :md="4">
                        <div class="stat-card fail">
                          <div class="stat-icon-wrapper">
                            <el-icon><CircleCloseFilled /></el-icon>
                          </div>
                          <div class="stat-info">
                            <div class="stat-value text-danger">{{ getFailCount(version) }}</div>
                            <div class="stat-label">失败数</div>
                          </div>
                        </div>
                      </el-col>
                       <el-col :xs="12" :sm="6" :md="4">
                        <div class="stat-card pending">
                          <div class="stat-icon-wrapper">
                            <el-icon><Timer /></el-icon>
                          </div>
                          <div class="stat-info">
                            <div class="stat-value text-warning">{{ version.stats.assigned_not_executed }}</div>
                            <div class="stat-label">剩余未执行</div>
                          </div>
                        </div>
                      </el-col>
                    </el-row>

                    <!-- User Stats Table -->
                    <div class="user-stats-section">
                      <div class="section-title">
                        <el-icon><Avatar /></el-icon> 成员执行详情
                      </div>
                      <el-table 
                        :data="version.user_stats" 
                        border 
                        style="width: 100%; border-radius: 8px; overflow: hidden;"
                        :header-cell-style="{background:'#f5f7fa', color:'#606266'}"
                      >
                        <el-table-column prop="username" label="成员" width="150">
                          <template #default="{ row }">
                            <div class="user-cell">
                              <el-avatar :size="24" :style="{backgroundColor: stringToColor(row.username)}">
                                {{ row.username.charAt(0).toUpperCase() }}
                              </el-avatar>
                              <span class="username">{{ row.username }}</span>
                            </div>
                          </template>
                        </el-table-column>
                        
                        <el-table-column label="任务进度" min-width="200">
                          <template #default="{ row }">
                            <div class="progress-cell">
                              <el-progress 
                                :percentage="calculateProgress(row)" 
                                :format="percent => percent + '%'"
                                :status="calculateProgress(row) === 100 ? 'success' : ''"
                              />
                            </div>
                          </template>
                        </el-table-column>

                        <el-table-column prop="total_assigned" label="分配" width="80" align="center" />
                        <el-table-column prop="executed" label="已测" width="80" align="center" />
                        
                        <el-table-column prop="pass" label="Pass" width="80" align="center">
                          <template #default="{ row }">
                            <el-tag v-if="row.pass > 0" type="success" size="small" effect="dark">{{ row.pass }}</el-tag>
                            <span v-else class="text-gray">-</span>
                          </template>
                        </el-table-column>
                        
                        <el-table-column prop="fail" label="Fail" width="80" align="center">
                          <template #default="{ row }">
                            <el-tag v-if="row.fail > 0" type="danger" size="small" effect="dark">{{ row.fail }}</el-tag>
                            <span v-else class="text-gray">-</span>
                          </template>
                        </el-table-column>
                        
                        <el-table-column prop="na" label="N/A" width="80" align="center">
                          <template #default="{ row }">
                            <span v-if="row.na > 0" class="text-info">{{ row.na }}</span>
                            <span v-else class="text-gray">-</span>
                          </template>
                        </el-table-column>

                        <el-table-column prop="pending" label="Pend" width="80" align="center">
                          <template #default="{ row }">
                            <span v-if="row.pending > 0" class="text-warning">{{ row.pending }}</span>
                            <span v-else class="text-gray">-</span>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
            
            <div v-else class="no-versions">
              <el-empty :image-size="60" description="该项目暂无版本数据" />
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  FolderOpened, Refresh, DataAnalysis, 
  Document, User, VideoPlay, 
  CircleCheckFilled, CircleCloseFilled, Timer, Avatar 
} from '@element-plus/icons-vue'
import { getAdminStatistics } from '@/api/testcases'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const projects = ref([])
const activeVersions = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAdminStatistics()
    projects.value = res
    
    // Auto expand active versions
    const active = []
    res.forEach(p => {
      if (p.versions) {
        p.versions.forEach(v => {
          if (v.status === 'active') {
            active.push(`${p.id}-${v.id}`)
          }
        })
      }
    })
    // If no active versions, maybe expand the first one of first project?
    if (active.length === 0 && res.length > 0 && res[0].versions?.length > 0) {
       active.push(`${res[0].id}-${res[0].versions[0].id}`)
    }
    activeVersions.value = active
  } catch (error) {
    console.error(error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

const getVersionStatusType = (status) => {
  const map = {
    active: 'success',
    planned: 'primary',
    released: 'warning',
    archived: 'info'
  }
  return map[status] || 'info'
}

const calculateExecutionRate = (stats) => {
  if (!stats.assigned || stats.assigned === 0) return '0%'
  const rate = (stats.assigned_executed / stats.assigned) * 100
  return `${rate.toFixed(1)}%`
}

const calculateExecutionRateVal = (stats) => {
  if (!stats.assigned || stats.assigned === 0) return 0
  return Number(((stats.assigned_executed / stats.assigned) * 100).toFixed(1))
}

const getProgressColor = (percentage) => {
  if (percentage < 30) return '#f56c6c'
  if (percentage < 70) return '#e6a23c'
  return '#67c23a'
}

const calculateProgress = (userStat) => {
  if (userStat.total_assigned === 0) return 0
  return Math.round((userStat.executed / userStat.total_assigned) * 100)
}

// Helpers to sum up Pass/Fail from user stats because stats object might not have it directly if API didn't aggregate it
// Looking at previous API implementation, 'version.stats' had assigned_executed, but not breakdown of Pass/Fail?
// Wait, let's check backend implementation logic.
// The backend returns:
// project_stats['versions'].append({
//     'id': version.id,
//     'name': version.name,
//     'status': version.status,
//     'stats': {
//         'total': total_cases,
//         'assigned': assigned_cases,
//         'unassigned': unassigned_cases,
//         'assigned_executed': assigned_executed,
//         'assigned_not_executed': assigned_not_executed
//     },
//     'user_stats': user_stats_list
// })
// It seems the backend `stats` dict does NOT contain global Pass/Fail counts. 
// We can compute them from `user_stats` on the frontend.

const getPassCount = (version) => {
  return version.user_stats.reduce((sum, u) => sum + (u.pass || 0), 0)
}

const getFailCount = (version) => {
  return version.user_stats.reduce((sum, u) => sum + (u.fail || 0), 0)
}

// Color generator for avatars
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.statistics-container {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: #409EFF;
}

.header-subtitle {
  color: #909399;
  font-size: 14px;
  margin-top: 4px;
  display: block;
  margin-left: 36px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.project-card {
  border: none;
  border-radius: 8px;
}

.project-header {
  display: flex;
  align-items: center;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-icon {
  font-size: 20px;
  color: #909399;
}

.project-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* Version Header Styling */
.version-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.version-name {
  font-size: 16px;
  font-weight: 500;
}

.header-progress {
  display: flex;
  align-items: center;
  margin-left: auto;
  margin-right: 16px;
  font-size: 12px;
  color: #606266;
}

.progress-label {
  margin-right: 4px;
}

.progress-text {
  margin-left: 8px;
  min-width: 45px;
  text-align: right;
}

/* Stats Cards */
.stats-dashboard {
  padding: 16px 8px;
}

.metrics-row {
  margin-bottom: 24px;
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border-color: #dcdfe6;
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

/* Card Themes */
.stat-card.total .stat-icon-wrapper { background-color: #ecf5ff; color: #409EFF; }
.stat-card.assigned .stat-icon-wrapper { background-color: #f4f4f5; color: #909399; }
.stat-card.executed .stat-icon-wrapper { background-color: #e8f3ff; color: #337ecc; } /* Darker blue */
.stat-card.pass .stat-icon-wrapper { background-color: #f0f9eb; color: #67C23A; }
.stat-card.fail .stat-icon-wrapper { background-color: #fef0f0; color: #F56C6C; }
.stat-card.pending .stat-icon-wrapper { background-color: #fdf6ec; color: #E6A23C; }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* User Stats Section */
.user-stats-section {
  background-color: #fff;
  border-radius: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 500;
}

.text-success { color: #67C23A; }
.text-danger { color: #F56C6C; }
.text-warning { color: #E6A23C; }
.text-info { color: #909399; }
.text-gray { color: #C0C4CC; }

/* Custom Collapse Styling */
:deep(.el-collapse-item__header) {
  font-size: 16px;
  background-color: #fafafa;
  padding-left: 16px;
  border-radius: 4px;
}
:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}
:deep(.el-collapse) {
  border-top: none;
  border-bottom: none;
}
</style>