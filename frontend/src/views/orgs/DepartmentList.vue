<template>
  <div class="department-list">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="left">
            <h3>部门管理</h3>
          </div>
          <div class="right">
            <el-button type="primary" icon="Plus" @click="handleCreate">
              新建部门
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :inline="true" :model="filters" class="filters">
        <el-form-item label="名称">
          <el-input v-model="filters.name" placeholder="输入名称搜索" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="fetchDepartments">查询</el-button>
          <el-button icon="Refresh" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        :data="departments"
        style="width: 100%"
        v-loading="loading"
        border
        stripe
        row-key="id"
        default-expand-all
      >
        <el-table-column prop="name" label="部门名称" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="parent" label="上级部门" width="150">
           <template #default="scope">
             {{ getDepartmentName(scope.row.parent) }}
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
      :title="dialogType === 'create' ? '新建部门' : '编辑部门'"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="上级部门" prop="parent">
          <el-select v-model="form.parent" placeholder="请选择上级部门" style="width: 100%" clearable>
             <el-option
              v-for="dept in availableParents"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" placeholder="请输入部门描述" />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/api/departments'

const loading = ref(false)
const departments = ref([])
const dialogVisible = ref(false)
const dialogType = ref('create')
const submitting = ref(false)
const formRef = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const filters = reactive({
  name: ''
})

const form = reactive({
  id: null,
  name: '',
  parent: null,
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }]
}

// 可选的父级部门（排除自己）
const availableParents = computed(() => {
  if (dialogType.value === 'create') return departments.value
  return departments.value.filter(d => d.id !== form.id)
})

const fetchDepartments = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      name: filters.name || undefined
    }
    const res = await getDepartments(params)
    departments.value = res.results
    pagination.total = res.count
  } catch (error) {
    console.error(error)
    ElMessage.error('获取部门列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.name = ''
  fetchDepartments()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchDepartments()
}

const handlePageChange = (val) => {
  pagination.page = val
  fetchDepartments()
}

const getDepartmentName = (id) => {
  if (!id) return '-'
  const dept = departments.value.find(d => d.id === id)
  return dept ? dept.name : id
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

const handleCreate = () => {
  dialogType.value = 'create'
  form.id = null
  form.name = ''
  form.parent = null
  form.description = ''
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.id = row.id
  form.name = row.name
  form.parent = row.parent
  form.description = row.description
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该部门吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteDepartment(row.id)
      ElMessage.success('删除成功')
      fetchDepartments()
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
        const payload = {
          name: form.name,
          parent: form.parent || null, // Ensure empty string becomes null
          description: form.description
        }

        if (dialogType.value === 'create') {
          await createDepartment(payload)
          ElMessage.success('创建成功')
        } else {
          await updateDepartment(form.id, payload)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        fetchDepartments()
      } catch (error) {
        console.error(error)
        // 尝试提取后端返回的错误信息
        const msg = error.response?.data?.detail || 
                    (error.response?.data?.name ? `部门名称错误: ${error.response.data.name[0]}` : null) ||
                    (dialogType.value === 'create' ? '创建失败' : '更新失败')
        ElMessage.error(msg)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
.department-list {
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
