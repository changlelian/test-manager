<template>
  <div class="test-case-list">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="left">
            <h3>{{ currentVersionName ? currentVersionName + ' ' : '' }}用例列表</h3>
          </div>
          <div class="right">
            <el-button v-if="canAssign && props.projectId" type="warning" icon="User" @click="goToAssignment">
              任务分配
            </el-button>
            <el-button v-if="canEdit" type="primary" icon="Plus" @click="$router.push({ name: 'TestCaseCreate', query: { project: props.projectId, version: filters.version, versionName: currentVersionName } })">
              新建用例
            </el-button>
            
            <template v-if="canEdit">
              <el-dropdown style="margin-left: 10px;" @command="handleImportCommand">
                <el-button icon="Upload">
                  导入用例 <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="excel">Excel 导入</el-dropdown-item>
                    <el-dropdown-item v-if="canImportHistory" command="history" :disabled="!props.projectId">从历史版本导入</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <input 
                type="file" 
                ref="fileInput" 
                style="display: none" 
                accept=".csv, .xlsx" 
                @change="handleImportFile"
              />
            </template>

            <el-dropdown style="margin-left: 10px;" @command="handleExport">
              <el-button icon="Download">
                导出用例 <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="xlsx">导出为 Excel</el-dropdown-item>
                  <el-dropdown-item command="csv">导出为 CSV</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- Column Settings -->
            <el-popover placement="bottom-end" title="显示列设置" :width="200" trigger="click">
              <template #reference>
                 <el-button icon="Setting" circle style="margin-left: 10px;" title="自定义显示列" />
              </template>
              <div class="column-settings-list">
                <el-checkbox v-model="columnSettings.id" label="ID" style="display: block" />
                <el-checkbox v-model="columnSettings.module" label="模块名称" style="display: block" />
                <el-checkbox v-model="columnSettings.test_item" label="测试项" style="display: block" />
                <el-checkbox v-model="columnSettings.title" label="用例标题" style="display: block" />
                <el-checkbox v-model="columnSettings.test_data" label="测试数据" style="display: block" />
                <el-checkbox v-model="columnSettings.expected" label="预期结果" style="display: block" />
                <el-checkbox v-model="columnSettings.priority" label="优先级" style="display: block" />
                <el-checkbox v-model="columnSettings.type" label="类型" style="display: block" />
                <el-checkbox v-model="columnSettings.version_name" label="版本" style="display: block" />
                <el-checkbox v-model="columnSettings.assigned_to_name" label="执行人" style="display: block" />
                <el-checkbox v-model="columnSettings.status" label="状态" style="display: block" />
                <el-checkbox v-model="columnSettings.operation" label="操作" style="display: block" />
              </div>
            </el-popover>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :inline="true" :model="filters" class="filters">
        <el-row :gutter="20" style="width: 100%">
          <el-col :xs="24" :sm="12" :md="6" :lg="5">
            <el-form-item label="标题" style="width: 100%">
              <el-input v-model="filters.title" placeholder="输入标题搜索" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="5">
            <el-form-item label="模块" style="width: 100%">
              <el-select 
                v-model="filters.module" 
                placeholder="选择模块" 
                clearable 
                filterable 
                style="width: 100%"
                @visible-change="handleModuleDropdownVisible"
              >
                <el-option 
                  v-for="mod in modules" 
                  :key="mod" 
                  :label="mod || 'Uncategorized'" 
                  :value="mod" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="5">
            <el-form-item label="优先级" style="width: 100%">
              <el-select v-model="filters.priority" placeholder="选择优先级" clearable style="width: 100%">
                <el-option label="P0 - 紧急" value="P0" />
                <el-option label="P1 - 高" value="P1" />
                <el-option label="P2 - 中" value="P2" />
                <el-option label="P3 - 低" value="P3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="5">
             <el-form-item label="类型" style="width: 100%">
              <el-select v-model="filters.type" placeholder="选择类型" clearable style="width: 100%">
                <el-option label="功能测试" value="functional" />
                <el-option label="性能测试" value="performance" />
                <el-option label="兼容性测试" value="compatibility" />
                <el-option label="易用性测试" value="usability" />
                <el-option label="API测试" value="api" />
                <el-option label="自动化测试" value="automation" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="5">
             <el-form-item label="状态" style="width: 100%">
              <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 100%">
                <el-option label="Pass" value="pass" />
                <el-option label="Fail" value="fail" />
                <el-option label="N/A" value="na" />
                <el-option label="PEND" value="pending" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-form-item label="执行人" style="width: 100%">
              <el-checkbox v-model="filters.myTasks" @change="handleSearch" label="只看我的" border />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="4" style="text-align: right">
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
              <el-button icon="Refresh" @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 批量操作 -->
      <transition name="el-fade-in">
        <div class="batch-ops" v-if="selectedIds.length > 0 && canEdit">
          <div class="batch-left">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
            <span>已选择 {{ selectedIds.length }} 项</span>
          </div>
          <div class="batch-right">
            <el-button v-if="canDelete" type="danger" plain icon="Delete" @click="handleBatchDelete">批量删除</el-button>
            <el-dropdown @command="handleBatchUpdate" trigger="click">
              <el-button type="primary" plain>
                批量更新 <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="priority:P0">设为 P0 - 紧急</el-dropdown-item>
                  <el-dropdown-item command="priority:P1">设为 P1 - 高</el-dropdown-item>
                  <el-dropdown-item command="priority:P2">设为 P2 - 中</el-dropdown-item>
                  <el-dropdown-item command="priority:P3">设为 P3 - 低</el-dropdown-item>
                  <el-dropdown-item divided command="status:pass">设为 Pass</el-dropdown-item>
                  <el-dropdown-item command="status:fail">设为 Fail</el-dropdown-item>
                  <el-dropdown-item command="status:na">设为 N/A</el-dropdown-item>
                  <el-dropdown-item command="status:pending">设为 PEND</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </transition>

      <!-- 表格 -->
      <el-table
        :data="testCases"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column v-if="canEdit" type="selection" width="55" align="center" />
        <el-table-column v-if="columnSettings.id" prop="id" label="ID" width="80" align="center" sortable="custom" />
        <el-table-column v-if="columnSettings.module" prop="module" label="模块名称" width="120" show-overflow-tooltip sortable="custom" />
        <el-table-column v-if="columnSettings.test_item" prop="test_item" label="测试项" width="150" show-overflow-tooltip sortable="custom" />
        <el-table-column v-if="columnSettings.title" prop="title" label="用例标题" min-width="200" show-overflow-tooltip sortable="custom" />
        <el-table-column v-if="columnSettings.test_data" prop="test_data" label="测试数据" min-width="150" show-overflow-tooltip sortable="custom">
          <template #default="{ row }">
            <div style="white-space: pre-wrap;">{{ row.test_data }}</div>
          </template>
        </el-table-column>
        <el-table-column v-if="columnSettings.expected" prop="expected" label="预期结果" min-width="200" sortable="custom">
          <template #default="{ row }">
            <div style="white-space: pre-wrap;">{{ row.expected }}</div>
          </template>
        </el-table-column>
        <el-table-column v-if="columnSettings.priority" prop="priority" label="优先级" width="100" align="center" sortable="custom">
          <template #default="scope">
            <el-tag :type="getPriorityType(scope.row.priority)">{{ getPriorityLabel(scope.row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columnSettings.type" prop="type" label="类型" width="100" align="center" sortable="custom">
           <template #default="scope">
            {{ getTypeLabel(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column v-if="columnSettings.version_name" prop="version_name" label="版本" width="100" show-overflow-tooltip sortable="custom">
          <template #default="{ row }">
            <el-tag v-if="row.version_name" type="info" size="small">{{ row.version_name }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnSettings.assigned_to_name" prop="assigned_to_name" label="执行人" width="100" show-overflow-tooltip sortable="custom">
          <template #default="{ row }">
            <el-tag v-if="row.assigned_to_name" type="warning" size="small">{{ row.assigned_to_name }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnSettings.status" prop="status" label="状态" width="130" align="center" sortable="custom">
           <template #default="{ row }">
             <el-select 
               v-if="(canEdit || row.assigned_to === currentUserId) && editingStatusRowId === row.id"
               v-model="row.status" 
               size="small" 
               @change="handleStatusChange(row)"
               @visible-change="(visible) => handleStatusVisibleChange(visible, row)"
               :class="`status-select status-${row.status}`"
               ref="statusSelectRef"
               automatic-dropdown
             >
                <el-option label="Pass" value="pass" />
                <el-option label="Fail" value="fail" />
                <el-option label="N/A" value="na" />
                <el-option label="PEND" value="pending" />
             </el-select>
            <div v-else @click="enableStatusEdit(row)" style="cursor: pointer">
              <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="columnSettings.operation" label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-tooltip content="查看" placement="top">
              <el-button link type="primary" :icon="View" @click="$router.push({ name: 'TestCaseDetail', params: { id: scope.row.id }, query: { versionName: currentVersionName } })"></el-button>
            </el-tooltip>
            <el-tooltip v-if="canEdit || scope.row.assigned_to === currentUserId" content="编辑" placement="top">
              <el-button link type="primary" :icon="Edit" @click="$router.push({ name: 'TestCaseEdit', params: { id: scope.row.id }, query: { versionName: currentVersionName } })"></el-button>
            </el-tooltip>
            <el-tooltip v-if="canDelete" content="删除" placement="top">
              <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100, 1000, 2000]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="fetchTestCases"
        />
      </div>
      <!-- 历史版本导入弹窗 -->
      <el-dialog
        v-model="importHistoryVisible"
        title="从历史版本导入"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form :model="importHistoryForm" label-width="100px">
          <el-form-item label="来源版本" required>
            <el-select v-model="importHistoryForm.sourceVersion" placeholder="请选择来源版本" style="width: 100%" @change="handleSourceVersionChange">
              <el-option
                v-for="version in historyVersions"
                :key="version.id"
                :label="version.name"
                :value="version.id"
              />
            </el-select>
          </el-form-item>
          
          <template v-if="importHistoryForm.sourceVersion">
            <el-form-item label="导入方式" required>
              <el-radio-group v-model="importHistoryForm.importType">
                <el-radio label="all">导入所有</el-radio>
                <el-radio label="module">按模块导入</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="按优先级" required>
               <el-checkbox-group v-model="importHistoryForm.priorities">
                <el-checkbox label="P0">P0</el-checkbox>
                <el-checkbox label="P1">P1</el-checkbox>
                <el-checkbox label="P2">P2</el-checkbox>
                <el-checkbox label="P3">P3</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item 
              v-if="importHistoryForm.importType === 'module'" 
              label="选择模块" 
              required
            >
              <el-select 
                v-model="importHistoryForm.selectedModules" 
                multiple 
                collapse-tags 
                placeholder="请选择模块" 
                style="width: 100%"
              >
                <el-option 
                  v-for="mod in sourceVersionModules" 
                  :key="mod" 
                  :label="mod || 'Uncategorized'" 
                  :value="mod" 
                />
              </el-select>
            </el-form-item>
          </template>

          <div class="dialog-tip" style="color: #909399; font-size: 12px; margin-left: 100px;">
            注：将从选定版本复制测试用例到当前版本，状态重置为 PEND。
          </div>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="importHistoryVisible = false">取消</el-button>
            <el-button type="primary" @click="handleImportHistory" :loading="importLoading">
              确定导入
            </el-button>
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Delete, InfoFilled, ArrowDown, Upload, Download, User, View, Edit, Setting } from '@element-plus/icons-vue'
import { getTestCases, deleteTestCase, batchDeleteTestCases, batchUpdateTestCases, importTestCases, exportTestCases, copyTestCasesFromVersion, updateTestCase, getModules, getVersionModules } from '@/api/testcases'
import { getVersions } from '@/api/projects'

const route = useRoute()
const router = useRouter()
const currentVersionName = computed(() => route.query.versionName || '')
const loading = ref(false)
const testCases = ref([])
const modules = ref([])

// Column settings
const defaultColumns = {
  id: true,
  module: true,
  test_item: true,
  title: true,
  test_data: true,
  expected: true,
  priority: true,
  type: true,
  version_name: true,
  assigned_to_name: true,
  status: true,
  operation: true
}

const columnSettings = ref({ ...defaultColumns })

// Load settings from localStorage
const loadColumnSettings = () => {
  const saved = localStorage.getItem('testCaseListColumns')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      // Merge with default to ensure new columns are handled if added later
      columnSettings.value = { ...defaultColumns, ...parsed }
    } catch (e) {
      console.error('Failed to load column settings', e)
    }
  }
}

watch(columnSettings, (newVal) => {
  localStorage.setItem('testCaseListColumns', JSON.stringify(newVal))
}, { deep: true })

onMounted(() => {
  loadColumnSettings()
  // ... existing onMounted logic is likely not here but fetchTestCases is called elsewhere or below
})

// Check user role for permissions
const userRole = localStorage.getItem('user_role') || ''
const currentUserId = parseInt(localStorage.getItem('user_id') || '0')
const canEdit = computed(() => ['admin', 'tester'].includes(userRole))
const canDelete = computed(() => ['admin', 'tester'].includes(userRole))
// Update: Allow testers to view the assignment page (to see stats), but actual assignment is restricted in the view
const canAssign = computed(() => ['admin', 'tester'].includes(userRole))
const canImportHistory = computed(() => userRole === 'admin')

// Props definition to receive projectId from router
const props = defineProps({
  projectId: {
    type: String,
    default: ''
  }
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const filters = reactive({
  title: '',
  module: '',
  priority: '',
  type: '',
  status: '',
  project: '', // Add project filter
  version: '',
  myTasks: false,
  ordering: ''
})

const selectedIds = ref([])
const editingStatusRowId = ref(null)

const enableStatusEdit = (row) => {
  if (canEdit.value || row.assigned_to === currentUserId) {
    editingStatusRowId.value = row.id
  }
}

const handleStatusVisibleChange = (visible, row) => {
  if (!visible) {
    editingStatusRowId.value = null
  }
}

const goToAssignment = () => {
  router.push({
    name: 'TaskAssignment',
    params: { projectId: props.projectId },
    query: { 
      version: filters.version,
      versionName: currentVersionName.value
    }
  })
}

const fileInput = ref(null)

// History import state
const importHistoryVisible = ref(false)
const importLoading = ref(false)
const historyVersions = ref([])
const sourceVersionModules = ref([])
const importHistoryForm = reactive({
  sourceVersion: '',
  importType: 'all',
  selectedModules: [],
  priorities: ['P0', 'P1', 'P2', 'P3'] // Default select all
})

const handleImportCommand = (command) => {
  if (command === 'excel') {
    fileInput.value.click()
  } else if (command === 'history') {
    openHistoryImport()
  }
}

const handleSourceVersionChange = async (val) => {
  importHistoryForm.selectedModules = []
  if (!val) {
    sourceVersionModules.value = []
    return
  }
  try {
    const res = await getVersionModules({ version_id: val })
    sourceVersionModules.value = res
  } catch (error) {
    console.error(error)
    ElMessage.error('获取模块列表失败')
  }
}

const openHistoryImport = async () => {
  if (!props.projectId) return
  
  importHistoryForm.sourceVersion = ''
  importHistoryForm.importType = 'all'
  importHistoryForm.selectedModules = []
  importHistoryForm.priorities = ['P0', 'P1', 'P2', 'P3']
  sourceVersionModules.value = []
  
  importHistoryVisible.value = true
  
  try {
    const res = await getVersions({ project: props.projectId })
    // Filter out current version if selected
    const currentVersionId = filters.version
    if (currentVersionId) {
      historyVersions.value = res.results.filter(v => v.id != currentVersionId)
    } else {
      historyVersions.value = res.results
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取版本列表失败')
  }
}

const handleImportHistory = async () => {
  if (!importHistoryForm.sourceVersion) {
    ElMessage.warning('请选择来源版本')
    return
  }
  
  if (!filters.version) {
    ElMessage.warning('当前未选择目标版本，无法导入')
    return
  }

  if (importHistoryForm.importType === 'module' && importHistoryForm.selectedModules.length === 0) {
    ElMessage.warning('请选择要导入的模块')
    return
  }

  if (importHistoryForm.priorities.length === 0) {
    ElMessage.warning('请至少选择一个优先级')
    return
  }

  importLoading.value = true
  try {
    const res = await copyTestCasesFromVersion({
      source_version: importHistoryForm.sourceVersion,
      target_version: filters.version,
      import_type: importHistoryForm.importType,
      modules: importHistoryForm.selectedModules,
      priorities: importHistoryForm.priorities
    })
    ElMessage.success(res.message || '导入成功')
    importHistoryVisible.value = false
    fetchTestCases()
  } catch (error) {
    console.error(error)
    ElMessage.error(error.response?.data?.error || '导入失败')
  } finally {
    importLoading.value = false
  }
}

const handleSortChange = ({ prop, order }) => {
  if (!order) {
    filters.ordering = ''
  } else {
    // Map frontend props to backend ordering fields if necessary
    let field = prop
    if (prop === 'version_name') field = 'version__name'
    if (prop === 'assigned_to_name') field = 'assigned_to__username'
    
    filters.ordering = order === 'ascending' ? field : `-${field}`
  }
  fetchTestCases()
}

const handleSizeChange = () => {
  pagination.page = 1
  fetchTestCases()
}

const handleSearch = () => {
  pagination.page = 1
  fetchTestCases()
}

const fetchTestCases = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      title: filters.title || undefined,
      module: filters.module || undefined,
      priority: filters.priority || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
      project: filters.project || undefined,
      version: filters.version || undefined,
      assigned_to: filters.myTasks ? localStorage.getItem('user_id') : undefined,
      ordering: filters.ordering || undefined
    }
    const res = await getTestCases(params)
    testCases.value = res.results
    pagination.total = res.count
  } catch (error) {
    // If page is out of range (e.g. 404), reset to page 1
    if (error.response && error.response.status === 404 && pagination.page > 1) {
      pagination.page = 1
      fetchTestCases()
      return
    }
    console.error(error)
    ElMessage.error('获取用例列表失败')
  } finally {
    // Only turn off loading if we didn't retry (which would have turned it back on)
    // But since retry is async, we can't easily know. 
    // Simplest is to just let it turn off, then retry turns it on.
    loading.value = false
  }
}

const fetchModules = async () => {
  if (!filters.project) return
  
  try {
    const res = await getModules({
      project: filters.project,
      version: filters.version
    })
    modules.value = res
  } catch (error) {
    console.error('Failed to fetch modules', error)
  }
}

const handleModuleDropdownVisible = (visible) => {
  if (visible) {
    fetchModules()
  }
}

// 合并监听 projectId 和 version 变化，避免竞态条件
watch(
  [() => props.projectId, () => route.query.version],
  ([newProjectId, newVersion]) => {
    filters.project = newProjectId || ''
    filters.version = newVersion || ''
  // Ensure filters are updated even if immediate is false or if the watcher doesn't trigger initially
  if (props.projectId) filters.project = props.projectId
  if (route.query.version) filters.version = route.query.version
  
  // Reset pagination when context changes
  pagination.page = 1
  
  fetchTestCases()
  fetchModules()
}, { immediate: true })

const resetFilters = () => {
  filters.title = ''
  filters.module = ''
  filters.priority = ''
  filters.type = ''
  filters.status = ''
  filters.myTasks = false
  
  pagination.page = 1
  
  // Keep project filter if it's set by route
  if (!props.projectId) {
    filters.project = ''
  }
  // Keep version filter if it's set by route
  if (route.query.version) {
    filters.version = route.query.version
  } else {
    filters.version = ''
  }
  fetchTestCases()
}

const handleStatusChange = async (row) => {
  try {
    await updateTestCase(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
    editingStatusRowId.value = null // Exit edit mode
  } catch (error) {
    console.error(error)
    if (error.response && error.response.status === 403) {
      const detail = error.response.data && error.response.data.detail
      ElMessage.error(detail || '无权变更他人需要执行的测试用例')
    } else {
      ElMessage.error('状态更新失败')
    }
    // Revert change locally if failed? 
    // Ideally we should reload data, but for UX let's keep it simple.
    // If we want strict consistency, we fetchTestCases()
    fetchTestCases()
  }
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该测试用例吗？此操作不可恢复。',
    '警告',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteTestCase(row.id)
      ElMessage.success('删除成功')
      fetchTestCases()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const handleBatchDelete = () => {
   ElMessageBox.confirm(
    `确定要删除选中的 ${selectedIds.value.length} 个测试用例吗？`,
    '警告',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await batchDeleteTestCases(selectedIds.value)
      ElMessage.success('批量删除成功')
      fetchTestCases()
      selectedIds.value = []
    } catch (error) {
      ElMessage.error('批量删除失败')
    }
  })
}

const handleBatchUpdate = async (command) => {
  const [field, value] = command.split(':')
  const data = { [field]: value }
  
  try {
    await batchUpdateTestCases(selectedIds.value, data)
    ElMessage.success('批量更新成功')
    fetchTestCases()
  } catch (error) {
     ElMessage.error('批量更新失败')
  }
}

const triggerImport = () => {
    fileInput.value.click()
}

const handleImportFile = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Clear input so same file can be selected again
    event.target.value = ''

    if (!props.projectId) {
        ElMessage.error('请先选择项目')
        return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('project_id', props.projectId)
    if (filters.version) {
        formData.append('version_id', filters.version)
    } else if (route.query.version) {
        formData.append('version_id', route.query.version)
    }

    loading.value = true
    try {
        const res = await importTestCases(formData)
        if (res.errors && res.errors.length > 0) {
            ElMessage.warning(`导入完成: ${res.imported} 成功. 有错误: ${res.errors.join('; ')}`)
        } else {
            ElMessage.success(`导入成功: ${res.imported} 条用例`)
        }
        fetchTestCases()
    } catch (error) {
        console.error(error)
        ElMessage.error('导入失败: ' + (error.response?.data?.error || error.message))
    } finally {
        loading.value = false
    }
}

const handleExport = async (format) => {
    const params = {
      export_format: format
    }
    
    if (selectedIds.value && selectedIds.value.length > 0) {
        params.ids = selectedIds.value.join(',')
    } else {
        params.title = filters.title || undefined
        params.module = filters.module || undefined
        params.priority = filters.priority || undefined
        params.type = filters.type || undefined
        params.status = filters.status || undefined
        params.project = filters.project || undefined
        params.version = filters.version || undefined
        
        if (props.projectId) params.project = props.projectId
        if (route.query.version && !params.version) params.version = route.query.version
    }
    
    try {
        const res = await exportTestCases(params)
        const url = window.URL.createObjectURL(new Blob([res]))
        const link = document.createElement('a')
        link.href = url
        const ext = format === 'csv' ? 'csv' : 'xlsx'
        link.setAttribute('download', `testcases.${ext}`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error(error)
        ElMessage.error('导出失败')
    }
}

const getPriorityType = (priority) => {
  const map = { P0: 'danger', P1: 'warning', P2: 'primary', P3: 'info' }
  return map[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  const map = { P0: 'P0 紧急', P1: 'P1 高', P2: 'P2 中', P3: 'P3 低' }
  return map[priority] || priority
}

const getStatusType = (status) => {
   const map = { 
     pass: 'success', 
     na: 'info', 
     fail: 'danger',
     pending: 'warning',
     // Legacy support
     active: 'success',
     draft: 'info',
     reviewed: 'warning',
     archived: 'info'
   }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
   const map = { 
     pass: 'Pass', 
     na: 'N/A', 
     fail: 'Fail',
     pending: 'PEND',
     // Legacy support
     active: '激活',
     draft: '草稿',
     reviewed: '已评审',
     archived: '归档'
   }
  return map[status] || status
}

const getTypeLabel = (type) => {
   const map = { 
     functional: '功能测试', 
     api: 'API测试', 
     ui: 'UI测试',
     performance: '性能测试',
     compatibility: '兼容性测试',
     usability: '易用性测试',
     automation: '自动化测试'
   }
  return map[type] || type
}
</script>

<style scoped>
.test-case-list {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filters {
  margin-bottom: 20px;
}
.batch-ops {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.batch-left {
  display: flex;
  align-items: center;
  color: #67c23a;
}
.info-icon {
  margin-right: 5px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
/* Status colors for Select */
:deep(.status-pass .el-input__inner) {
  color: #67C23A;
  font-weight: bold;
}
:deep(.status-fail .el-input__inner) {
  color: #F56C6C;
  font-weight: bold;
}
:deep(.status-na .el-input__inner) {
  color: #909399;
}
:deep(.status-pending .el-input__inner) {
  color: #E6A23C;
  font-weight: bold;
}
</style>