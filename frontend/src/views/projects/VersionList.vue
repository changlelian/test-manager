<template>
  <div class="version-list">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="left">
            <h3>版本管理</h3>
          </div>
          <div class="right">
            <el-button type="primary" icon="Plus" @click="handleCreate">
              新建版本
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :inline="true" :model="filters" class="filters">
        <el-form-item label="项目">
           <el-select v-model="filters.project" placeholder="选择项目" clearable style="width: 200px" filterable>
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="版本名">
          <el-input v-model="filters.name" placeholder="输入版本名搜索" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="fetchVersions">查询</el-button>
          <el-button icon="Refresh" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        :data="versions"
        style="width: 100%"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" align="center" sortable />
        <el-table-column prop="project_name" label="所属项目" min-width="150" show-overflow-tooltip />
        <el-table-column prop="name" label="版本名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120" align="center" />
        <el-table-column prop="release_date" label="发布日期" width="120" align="center" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建版本' : '编辑版本'"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="所属项目" prop="project">
          <el-select v-model="form.project" placeholder="请选择项目" style="width: 100%" filterable :disabled="dialogType === 'edit'">
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="版本名" prop="name">
          <el-input v-model="form.name" placeholder="请输入版本名称 (如 v1.0.0)" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" placeholder="请输入版本描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="计划中" value="planned" />
            <el-option label="进行中" value="active" />
            <el-option label="已发布" value="released" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker
            v-model="form.start_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="发布日期" prop="release_date">
          <el-date-picker
            v-model="form.release_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { getVersions, createVersion, updateVersion, deleteVersion, getProjects } from '@/api/projects'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('create')
const versions = ref([])
const projects = ref([])
const formRef = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const filters = reactive({
  project: '',
  name: ''
})

const form = reactive({
  id: '',
  project: '',
  name: '',
  description: '',
  status: 'planned',
  start_date: '',
  release_date: ''
})

const rules = {
  project: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
  name: [{ required: true, message: '请输入版本名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const fetchProjects = async () => {
  try {
    const res = await getProjects({ page_size: 100 })
    projects.value = res.results || []
  } catch (error) {
    console.error(error)
  }
}

const fetchVersions = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      project: filters.project || undefined,
      name: filters.name || undefined
    }
    const res = await getVersions(params)
    versions.value = res.results
    pagination.total = res.count
  } catch (error) {
    console.error(error)
    ElMessage.error('获取版本列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.project = ''
  filters.name = ''
  fetchVersions()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchVersions()
}

const handlePageChange = (val) => {
  pagination.page = val
  fetchVersions()
}

const handleCreate = () => {
  dialogType.value = 'create'
  form.id = ''
  form.project = ''
  form.name = ''
  form.description = ''
  form.status = 'planned'
  form.start_date = ''
  form.release_date = ''
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.id = row.id
  form.project = row.project
  form.name = row.name
  form.description = row.description
  form.status = row.status
  form.start_date = row.start_date
  form.release_date = row.release_date
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该版本吗？',
    '警告',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteVersion(row.id)
      ElMessage.success('删除成功')
      fetchVersions()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (dialogType.value === 'create') {
          await createVersion(form)
          ElMessage.success('创建成功')
        } else {
          await updateVersion(form.id, form)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        fetchVersions()
        window.dispatchEvent(new Event('project-updated'))
      } catch (error) {
        ElMessage.error(dialogType.value === 'create' ? '创建失败' : '更新失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const getStatusType = (status) => {
  const map = { planned: 'info', active: 'primary', released: 'success', archived: 'warning' }
  return map[status] || ''
}

const getStatusLabel = (status) => {
  const map = { planned: '计划中', active: '进行中', released: '已发布', archived: '已归档' }
  return map[status] || status
}

onMounted(() => {
  fetchProjects()
  fetchVersions()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filters {
  margin-top: 20px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>