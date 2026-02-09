<template>
  <div class="user-list">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="left">
            <h3>人员管理</h3>
          </div>
          <div class="right">
            <el-button type="primary" icon="Plus" @click="handleCreate">
              新建人员
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :inline="true" :model="filters" class="filters">
        <el-form-item label="用户名">
          <el-input v-model="filters.username" placeholder="输入用户名" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filters.role" placeholder="选择角色" clearable style="width: 150px">
            <el-option label="管理员" value="admin" />
            <el-option label="测试成员" value="tester" />
            <el-option label="普通成员" value="member" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="fetchUsers">查询</el-button>
          <el-button icon="Refresh" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        :data="users"
        style="width: 100%"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="department" label="部门" width="120">
          <template #default="scope">
             {{ getDepartmentName(scope.row.department) }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getRoleType(scope.row.role)">
              {{ getRoleLabel(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'danger'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="date_joined" label="加入时间" width="180" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.date_joined) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="warning" @click="handleResetPwd(scope.row)">重置密码</el-button>
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
      :title="dialogType === 'create' ? '新建人员' : '编辑人员'"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="dialogType === 'edit'" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'create'">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-select v-model="form.department" placeholder="请选择部门" style="width: 100%">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="测试成员" value="tester" />
            <el-option label="普通成员" value="member" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="is_active">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
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

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPwdDialogVisible"
      title="重置密码"
      width="400px"
    >
      <el-form ref="resetPwdFormRef" :model="resetPwdForm" :rules="resetPwdRules" label-width="80px">
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="resetPwdForm.new_password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPwdDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitResetPassword" :loading="resetting">
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
import { getUsers, createUser, updateUser, deleteUser, resetPassword } from '@/api/users'
import { getDepartments } from '@/api/departments'

const loading = ref(false)
const users = ref([])
const departments = ref([])
const dialogVisible = ref(false)
const dialogType = ref('create')
const submitting = ref(false)
const formRef = ref(null)

const resetPwdDialogVisible = ref(false)
const resetting = ref(false)
const resetPwdFormRef = ref(null)
const resetPwdForm = reactive({
    userId: null,
    new_password: ''
})
const resetPwdRules = {
    new_password: [{ required: true, message: '请输入新密码', trigger: 'blur' }]
}

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const filters = reactive({
  username: '',
  role: ''
})

const form = reactive({
  id: null,
  username: '',
  password: '',
  email: '',
  department: null,
  role: 'member',
  is_active: true
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const fetchAuxData = async () => {
  try {
    const res = await getDepartments({ page_size: 1000 })
    departments.value = res.results || []
  } catch (error) {
    console.error('Failed to fetch departments', error)
  }
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      username: filters.username || undefined,
      role: filters.role || undefined
    }
    const res = await getUsers(params)
    users.value = res.results
    pagination.total = res.count
  } catch (error) {
    console.error(error)
    ElMessage.error('获取人员列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.username = ''
  filters.role = ''
  fetchUsers()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchUsers()
}

const handlePageChange = (val) => {
  pagination.page = val
  fetchUsers()
}

const getDepartmentName = (id) => {
  const dept = departments.value.find(d => d.id === id)
  return dept ? dept.name : id
}

const getRoleLabel = (role) => {
  const map = {
    admin: '管理员',
    tester: '测试成员',
    member: '普通成员'
  }
  return map[role] || role
}

const getRoleType = (role) => {
  const map = {
    admin: 'danger',
    tester: 'warning',
    member: 'info'
  }
  return map[role] || ''
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

const handleCreate = () => {
  dialogType.value = 'create'
  form.id = null
  form.username = ''
  form.password = ''
  form.email = ''
  form.department = null
  form.role = 'member'
  form.is_active = true
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.id = row.id
  form.username = row.username
  // password intentionally left out
  form.email = row.email
  form.department = row.department
  form.role = row.role
  form.is_active = row.is_active
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该人员吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      fetchUsers()
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
          await createUser(form)
          ElMessage.success('创建成功')
        } else {
          // Filter out password if empty/undefined for update
          const { password, ...updateData } = form
          await updateUser(form.id, updateData)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        fetchUsers()
      } catch (error) {
        console.error(error)
        ElMessage.error(dialogType.value === 'create' ? '创建失败' : '更新失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleResetPwd = (row) => {
    resetPwdForm.userId = row.id
    resetPwdForm.new_password = ''
    resetPwdDialogVisible.value = true
}

const submitResetPassword = async () => {
    if (!resetPwdFormRef.value) return
    await resetPwdFormRef.value.validate(async (valid) => {
        if (valid) {
            resetting.value = true
            try {
                await resetPassword(resetPwdForm.userId, { new_password: resetPwdForm.new_password })
                ElMessage.success('密码重置成功')
                resetPwdDialogVisible.value = false
            } catch (error) {
                console.error(error)
                ElMessage.error('密码重置失败')
            } finally {
                resetting.value = false
            }
        }
    })
}

onMounted(() => {
  fetchAuxData()
  fetchUsers()
})
</script>

<style scoped>
.user-list {
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
