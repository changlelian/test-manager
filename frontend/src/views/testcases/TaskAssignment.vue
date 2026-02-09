<template>
  <div class="task-assignment">
    <div class="header">
      <div class="left">
        <h2>{{ versionName ? versionName + ' ' : '' }}任务分配与执行统计</h2>
      </div>
      <div class="right">
        <el-button @click="fetchStats">刷新</el-button>
        <el-button v-if="canAssign" type="primary" @click="handleBatchAssign" :disabled="selectedModules.length === 0">
          批量分配
        </el-button>
      </div>
    </div>

    <!-- 总体统计 -->
    <div class="overall-stats" v-if="overallStats">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-card shadow="hover">
            <template #header>用例总数</template>
            <div class="stat-value">{{ overallStats.total }}</div>
          </el-card>
        </el-col>
        <el-col :span="5">
          <el-card shadow="hover">
            <template #header>已分配 / 未分配</template>
            <div class="stat-value">
              <span class="success">{{ overallStats.assigned }}</span> / 
              <span class="warning">{{ overallStats.unassigned }}</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="5">
          <el-card shadow="hover">
            <template #header>通过 (Pass)</template>
            <div class="stat-value success">{{ overallStats.pass }}</div>
          </el-card>
        </el-col>
        <el-col :span="5">
          <el-card shadow="hover">
            <template #header>失败 (Fail)</template>
            <div class="stat-value danger">{{ overallStats.fail }}</div>
          </el-card>
        </el-col>
        <el-col :span="5">
          <el-card shadow="hover">
            <template #header>未执行 (N/A)</template>
            <div class="stat-value info">{{ overallStats.na }}</div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-tabs v-model="activeTab" class="stats-tabs">
      <el-tab-pane label="模块分配情况" name="modules">
        <el-table
          v-loading="loading"
          :data="stats"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="module" label="模块名称" />
          <el-table-column prop="total" label="用例总数" width="100" align="center" />
          <el-table-column prop="assigned" label="已分配" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="success" v-if="row.assigned > 0">{{ row.assigned }}</el-tag>
              <span v-else>0</span>
            </template>
          </el-table-column>
          <el-table-column prop="unassigned" label="未分配" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="warning" v-if="row.unassigned > 0">{{ row.unassigned }}</el-tag>
              <span v-else>0</span>
            </template>
          </el-table-column>
          <el-table-column label="分配给" min-width="150">
            <template #default="{ row }">
              <div class="assignees">
                <el-tag v-for="user in row.assignees" :key="user" size="small" class="mr-1">{{ user }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" v-if="canAssign">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleAssign(row)">
                分配
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="成员执行情况" name="users">
        <el-table :data="userStats" style="width: 100%">
          <el-table-column prop="username" label="测试成员" width="150" />
          <el-table-column prop="total_assigned" label="需执行总数" width="120" align="center" />
          <el-table-column prop="pass" label="Pass" width="100" align="center">
             <template #default="{ row }">
              <span class="success-text">{{ row.pass }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="fail" label="Fail" width="100" align="center">
             <template #default="{ row }">
              <span class="danger-text">{{ row.fail }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="na" label="N/A" width="100" align="center">
             <template #default="{ row }">
              <span class="info-text">{{ row.na }}</span>
            </template>
          </el-table-column>
          <el-table-column label="进度" min-width="200">
            <template #default="{ row }">
              <el-progress :percentage="calculateProgress(row.executed, row.total_assigned)" />
            </template>
          </el-table-column>
          <el-table-column label="优先级统计" min-width="250">
            <template #default="{ row }">
              <div class="priority-stats">
                <template v-for="(stats, prio) in row.priorities" :key="prio">
                  <div class="prio-item" v-if="stats.total > 0" @click="showDetails(row, prio)">
                    <el-tag size="small" effect="plain" class="prio-tag">{{ prio }}</el-tag>
                    <span class="prio-text">
                      <span class="success-text">{{ stats.pass }}</span> / <span class="danger-text">{{ stats.fail }}</span>
                    </span>
                  </div>
                </template>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 分配对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="分配测试任务"
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="选择成员">
          <el-select v-model="form.userId" placeholder="请选择测试人员" style="width: 100%">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <div class="assignment-info" v-if="currentModules.length > 0">
          <p>将分配以下模块的用例：</p>
          <ul>
            <li v-for="m in currentModules" :key="m">{{ m }}</li>
          </ul>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAssign" :loading="assigning">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailsDialogVisible" :title="detailTitle" width="800px">
      <el-table :data="detailCases" v-loading="detailsLoading" height="400">
         <el-table-column prop="id" label="ID" width="80" sortable />
         <el-table-column prop="title" label="标题" show-overflow-tooltip sortable>
            <template #default="{ row }">
               <router-link 
                 :to="{ name: 'TestCaseEdit', params: { id: row.id }, query: { mode: 'view' } }" 
                 target="_blank"
                 style="color: #409eff; text-decoration: none;"
               >
                 {{ row.title }}
               </router-link>
            </template>
         </el-table-column>
         <el-table-column prop="priority" label="优先级" width="100" align="center" sortable>
            <template #default="{ row }">
               <el-tag size="small" effect="plain">{{ row.priority }}</el-tag>
            </template>
         </el-table-column>
         <el-table-column prop="status" label="状态" width="100" align="center" sortable>
            <template #default="{ row }">
               <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
            </template>
         </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getModuleStatistics, assignTestCases, getTestCases } from '@/api/testcases'
import { getProject } from '@/api/projects'
import { ElMessage } from 'element-plus'

const route = useRoute()
const projectId = route.params.projectId
const versionId = computed(() => route.query.version)
const versionName = computed(() => route.query.versionName)

// Check user role for permissions
const userRole = localStorage.getItem('user_role') || ''
const canAssign = computed(() => userRole === 'admin')

const loading = ref(false)
const stats = ref([])
const userStats = ref([])
const overallStats = ref({
  total: 0,
  assigned: 0,
  unassigned: 0,
  executed: 0,
  remaining: 0,
  pass: 0,
  fail: 0,
  na: 0
})
const activeTab = ref('modules')
const users = ref([])
const selectedModules = ref([])

const dialogVisible = ref(false)
const assigning = ref(false)
const form = ref({
  userId: null
})
const currentModules = ref([])

// Details Dialog
const detailsDialogVisible = ref(false)
const detailCases = ref([])
const detailsLoading = ref(false)
const detailTitle = ref('')

onMounted(() => {
  fetchStats()
  fetchUsers()
})

const fetchStats = async () => {
  if (!versionId.value) return
  
  loading.value = true
  try {
    const res = await getModuleStatistics({
      project_id: projectId,
      version_id: versionId.value
    })
    // Backend now returns { overall, modules, users }
    if (res.modules) {
      stats.value = res.modules
      userStats.value = res.users || []
      overallStats.value = res.overall || overallStats.value
    } else {
      // Fallback for old API if cached/lag
      stats.value = res
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

const calculateProgress = (executed, total) => {
  if (!total || total === 0) return 0
  return Math.round((executed / total) * 100)
}

const fetchUsers = async () => {
  try {
    const res = await getProject(projectId)
    users.value = res.members_info || []
  } catch (error) {
    console.error(error)
    ElMessage.error('获取项目成员失败')
  }
}

const handleSelectionChange = (val) => {
  selectedModules.value = val
}

const handleAssign = (row) => {
  currentModules.value = [row.module]
  form.value.userId = null
  dialogVisible.value = true
}

const handleBatchAssign = () => {
  currentModules.value = selectedModules.value.map(item => item.module)
  form.value.userId = null
  dialogVisible.value = true
}

const confirmAssign = async () => {
  if (!form.value.userId) {
    ElMessage.warning('请选择测试人员')
    return
  }

  assigning.value = true
  try {
    await assignTestCases({
      project_id: projectId,
      version_id: versionId.value,
      modules: currentModules.value,
      user_id: form.value.userId
    })
    ElMessage.success('分配成功')
    dialogVisible.value = false
    fetchStats()
  } catch (error) {
    console.error(error)
    ElMessage.error('分配失败')
  } finally {
    assigning.value = false
  }
}

const showDetails = async (userRow, priority) => {
  detailTitle.value = `${userRow.username} - ${priority} 用例详情`
  detailsDialogVisible.value = true
  detailsLoading.value = true
  detailCases.value = []
  
  try {
    const res = await getTestCases({
      project: projectId,
      version: versionId.value,
      assigned_to: userRow.id,
      priority: priority,
      page_size: 1000
    })
    detailCases.value = res.results
  } catch (error) {
    ElMessage.error('获取详情失败')
  } finally {
    detailsLoading.value = false
  }
}

const getStatusType = (status) => {
  const map = {
    pass: 'success',
    fail: 'danger',
    block: 'warning',
    na: 'info',
    pending: 'info'
  }
  return map[(status || '').toLowerCase()] || 'info'
}
</script>

<style scoped>
.task-assignment {
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.subtitle {
  color: #909399;
  font-size: 14px;
  margin-left: 10px;
}
.assignment-info {
  background-color: #f4f4f5;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}
.assignment-info p {
  margin: 0 0 5px 0;
  font-weight: bold;
}
.assignment-info ul {
  margin: 0;
  padding-left: 20px;
}
.overall-stats {
  margin-bottom: 20px;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
}
.success { color: #67C23A; }
.warning { color: #E6A23C; }
.danger { color: #F56C6C; }
.info { color: #909399; }
.success-text { color: #67C23A; font-weight: bold; }
.danger-text { color: #F56C6C; font-weight: bold; }
.info-text { color: #909399; font-weight: bold; }
.assignees {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.mr-1 {
  margin-right: 5px;
}
.priority-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.prio-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}
.prio-item:hover {
  background-color: #ecf5ff;
  border-color: #c6e2ff;
}
.prio-tag {
  margin-right: 5px;
}
.prio-text {
  font-size: 12px;
}
</style>
