<template>
  <div class="project-list">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="left">
            <h3>项目管理</h3>
          </div>
          <div class="right">
            <el-button type="primary" icon="Plus" @click="handleCreate">
              新建项目
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :inline="true" :model="filters" class="filters">
        <el-form-item label="名称">
          <el-input v-model="filters.name" placeholder="输入名称搜索" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 150px">
            <el-option label="进行中" value="active" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="fetchProjects">查询</el-button>
          <el-button icon="Refresh" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        :data="projects"
        style="width: 100%"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" align="center" sortable />
        <el-table-column prop="name" label="项目名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="owner" label="负责人" width="120">
          <template #default="scope">
             {{ getUserName(scope.row.owner) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
              {{ scope.row.status === 'active' ? '进行中' : '已归档' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
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
      :title="dialogType === 'create' ? '新建项目' : '编辑项目'"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" placeholder="请输入项目描述" />
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-select v-model="form.owner" placeholder="请选择负责人" style="width: 100%" filterable>
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="项目成员" prop="members">
          <el-select v-model="form.members" placeholder="请选择项目成员" style="width: 100%" multiple filterable>
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
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
import { getProjects, createProject, updateProject, deleteProject } from '@/api/projects'
import { getDepartments } from '@/api/departments'
import { getUsers } from '@/api/users'

const loading = ref(false)
const projects = ref([])
const departments = ref([])
const users = ref([])
const dialogVisible = ref(false)
const dialogType = ref('create') // 'create' or 'edit'
const submitting = ref(false)
const formRef = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const filters = reactive({
  name: '',
  status: ''
})

const form = reactive({
  id: null,
  name: '',
  description: '',
  owner: null,
  members: [],
  status: 'active'
})

const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  owner: [{ required: true, message: '请选择负责人', trigger: 'change' }]
}

// 获取辅助数据（部门和用户）
const fetchAuxData = async () => {
  try {
    const [deptRes, userRes] = await Promise.all([
      getDepartments({ page_size: 1000 }),
      getUsers({ page_size: 1000 })
    ])
    departments.value = deptRes.results || []
    users.value = userRes.results || []
  } catch (error) {
    console.error('Failed to fetch aux data', error)
  }
}

// 获取项目列表
const fetchProjects = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      name: filters.name || undefined,
      status: filters.status || undefined
    }
    const res = await getProjects(params)
    projects.value = res.results
    pagination.total = res.count
  } catch (error) {
    console.error(error)
    ElMessage.error('获取项目列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.name = ''
  filters.status = ''
  fetchProjects()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchProjects()
}

const handlePageChange = (val) => {
  pagination.page = val
  fetchProjects()
}

// 辅助函数：ID转名称
const getDepartmentName = (id) => {
  const dept = departments.value.find(d => d.id === id)
  return dept ? dept.name : id
}

const getUserName = (id) => {
  const user = users.value.find(u => u.id === id)
  return user ? user.username : id
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

// 表单操作
const handleCreate = () => {
  dialogType.value = 'create'
  form.id = null
  form.name = ''
  form.description = ''
  form.owner = null
  form.members = []
  form.status = 'active'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.id = row.id
  form.name = row.name
  form.description = row.description
  form.owner = row.owner
  form.members = row.members || []
  form.status = row.status
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该项目吗？此操作不可恢复。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteProject(row.id)
      ElMessage.success('删除成功')
      fetchProjects()
      window.dispatchEvent(new Event('project-updated'))
    } catch (error) {
      console.error(error)
      ElMessage.error('删除失败')
    }
  })
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (dialogType.value === 'create') {
          await createProject(form)
          ElMessage.success('创建成功')
        } else {
          await updateProject(form.id, form)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        fetchProjects()
        window.dispatchEvent(new Event('project-updated'))
      } catch (error) {
        console.error(error)
        ElMessage.error(dialogType.value === 'create' ? '创建失败' : '更新失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchAuxData()
  fetchProjects()
})
</script>

<style scoped>
.project-list {
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
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
