<template>
  <div class="recycle-bin">
    <div class="header">
      <h2>测试用例回收站</h2>
      <el-alert
        title="回收站中的测试用例保留30天，之后将永久删除。"
        type="info"
        show-icon
        :closable="false"
        style="max-width: 600px; margin-top: 10px;"
      />
    </div>

    <el-card class="table-card">
      <el-table :data="deletedCases" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="title" label="标题" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="project_name" label="所属项目" width="150" show-overflow-tooltip />
        <el-table-column prop="version_name" label="版本" width="120" show-overflow-tooltip />
        <el-table-column prop="deleted_by_name" label="删除者" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" v-if="row.deleted_by_name">{{ row.deleted_by_name }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="deleted_at" label="删除时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.deleted_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button 
              type="success" 
              link 
              icon="RefreshLeft" 
              @click="handleRestore(row)"
            >
              恢复
            </el-button>
            <el-popconfirm 
              title="确定要永久删除吗？此操作无法撤销。"
              confirm-button-text="永久删除"
              cancel-button-text="取消"
              confirm-button-type="danger"
              @confirm="handlePermanentDelete(row)"
            >
              <template #reference>
                <el-button 
                  type="danger" 
                  link 
                  icon="Delete"
                >
                  永久删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="测试用例详情"
      width="700px"
      destroy-on-close
    >
      <div v-if="currentCase" class="case-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="ID">{{ currentCase.id }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ currentCase.title }}</el-descriptions-item>
          <el-descriptions-item label="项目">{{ currentCase.project_name }}</el-descriptions-item>
          <el-descriptions-item label="版本">{{ currentCase.version_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="模块">{{ currentCase.module || '-' }}</el-descriptions-item>
          <el-descriptions-item label="测试项">{{ currentCase.test_item || '-' }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(currentCase.priority)">{{ currentCase.priority }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="类型">{{ getCaseTypeLabel(currentCase.type) }}</el-descriptions-item>
          <el-descriptions-item label="前置条件">
            <div style="white-space: pre-wrap;">{{ currentCase.preconditions || '无' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="测试步骤">
            <div style="white-space: pre-wrap;">{{ currentCase.steps || '无' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="预期结果">
            <div style="white-space: pre-wrap;">{{ currentCase.expected || '无' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="测试数据">
            <div style="white-space: pre-wrap;">{{ currentCase.test_data || '无' }}</div>
          </el-descriptions-item>
           <el-descriptions-item label="删除信息">
             <el-text type="danger">
               删除者: {{ currentCase.deleted_by_name || '-' }} | 
               删除时间: {{ formatDate(currentCase.deleted_at) }}
             </el-text>
           </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRecycleBinItems, restoreTestCase, permanentDeleteTestCase } from '@/api/testcases'

const deletedCases = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const viewDialogVisible = ref(false)
const currentCase = ref(null)

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

const getPriorityType = (p) => {
  const map = {
    'P0': 'danger',
    'P1': 'warning',
    'P2': 'primary',
    'P3': 'info'
  }
  return map[p] || 'info'
}

const getCaseTypeLabel = (t) => {
  const map = {
    'functional': '功能测试',
    'api': 'API测试',
    'ui': 'UI测试',
    'performance': '性能测试',
    'compatibility': '兼容性测试',
    'usability': '易用性测试',
    'automation': '自动化测试'
  }
  return map[t] || t
}

const handleView = (row) => {
  currentCase.value = row
  viewDialogVisible.value = true
}

const fetchDeletedCases = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize
    }
    const res = await getRecycleBinItems(params)
    deletedCases.value = res.results || res
    pagination.total = res.count || 0
  } catch (error) {
    console.error(error)
    ElMessage.error('获取回收站数据失败')
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchDeletedCases()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchDeletedCases()
}

const handleRestore = async (row) => {
  try {
    await restoreTestCase(row.id)
    ElMessage.success('已恢复')
    fetchDeletedCases()
  } catch (error) {
    console.error(error)
    ElMessage.error('恢复失败')
  }
}

const handlePermanentDelete = async (row) => {
  try {
    await permanentDeleteTestCase(row.id)
    ElMessage.success('已永久删除')
    fetchDeletedCases()
  } catch (error) {
    console.error(error)
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchDeletedCases()
})
</script>

<style scoped>
.recycle-bin {
  padding: 20px;
}
.header {
  margin-bottom: 20px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
