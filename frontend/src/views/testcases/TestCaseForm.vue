<template>
  <div class="test-case-form">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h3>{{ isViewMode ? '查看测试用例' : (isEdit ? '编辑测试用例' : '新建测试用例') }}</h3>
          <el-button @click="handleCancel">返回列表</el-button>
        </div>
      </template>

      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px" v-loading="loading" class="form-content" :disabled="isViewMode">
        <div class="form-section">
          <div class="section-title">基础信息</div>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="所属项目" prop="project">
                <el-select v-model="form.project" placeholder="请选择项目" style="width: 100%" @change="form.version = null">
                  <el-option
                    v-for="p in projects"
                    :key="p.id"
                    :label="p.name"
                    :value="p.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="关联版本" prop="version">
                <el-select v-model="form.version" placeholder="请选择版本" style="width: 100%" clearable :disabled="!form.project">
                  <el-option
                    v-for="v in availableVersions"
                    :key="v.id"
                    :label="v.name"
                    :value="v.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
               <el-form-item label="模块名称" prop="module">
                <el-input v-model="form.module" placeholder="例如：用户管理/登录" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
               <el-form-item label="测试项" prop="test_item">
                <el-input v-model="form.test_item" placeholder="例如：用户名测试" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="用例标题" prop="title">
            <el-input v-model="form.title" placeholder="简明扼要地描述测试用例" />
          </el-form-item>

          <el-row :gutter="24">
            <el-col :span="8">
               <el-form-item label="优先级" prop="priority">
                <el-select v-model="form.priority" style="width: 100%">
                  <el-option label="P0 - 紧急" value="P0" />
                  <el-option label="P1 - 高" value="P1" />
                  <el-option label="P2 - 中" value="P2" />
                  <el-option label="P3 - 低" value="P3" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
               <el-form-item label="用例类型" prop="type">
                <el-select v-model="form.type" style="width: 100%">
                  <el-option label="功能测试" value="functional" />
                  <el-option label="性能测试" value="performance" />
                  <el-option label="兼容性测试" value="compatibility" />
                  <el-option label="易用性测试" value="usability" />
                  <el-option label="API测试" value="api" />
                  <el-option label="自动化测试" value="automation" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
               <el-form-item label="用例状态" prop="status">
                <el-select v-model="form.status" style="width: 100%" :disabled="!isEdit">
                  <el-option label="PEND" value="pending" />
                  <el-option label="N/A" value="na" />
                  <el-option label="Pass" value="pass" />
                  <el-option label="Fail" value="fail" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <div class="section-title">详细步骤</div>
          
          <el-form-item label="前置条件" prop="preconditions">
            <el-input 
              v-model="form.preconditions" 
              type="textarea" 
              :rows="3" 
              placeholder="执行此用例前需要满足的条件"
            />
          </el-form-item>

          <el-form-item label="测试步骤" prop="steps">
            <el-input 
              v-model="form.steps" 
              type="textarea" 
              :rows="6" 
              placeholder="1. 第一步操作...&#10;2. 第二步操作..." 
            />
          </el-form-item>

          <el-form-item label="测试数据" prop="test_data">
            <el-input 
              v-model="form.test_data" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入测试数据（可选）" 
            />
          </el-form-item>

          <el-form-item label="预期结果" prop="expected">
            <el-input 
              v-model="form.expected" 
              type="textarea" 
              :rows="3" 
              placeholder="执行步骤后应达到的结果"
            />
          </el-form-item>
        </div>

        <div class="form-actions" v-if="!isViewMode">
          <el-button type="primary" @click="save" :loading="loading" size="large">保存用例</el-button>
          <el-button @click="handleCancel" size="large">取消</el-button>
        </div>
        <div class="form-actions" v-else>
           <el-button type="primary" @click="$router.push({ name: 'TestCaseEdit', params: { id: route.params.id } })" size="large" v-if="!route.query.mode">编辑用例</el-button>
           <el-button @click="handleCancel" size="large">返回列表</el-button>
        </div>
      </el-form>

      <!-- 附件区域 -->
      <div v-if="isEdit || isViewMode" class="attachments-section">
        <el-divider content-position="left">附件管理</el-divider>
        <div class="upload-container" v-if="!isViewMode">
          <el-upload
            class="upload-demo"
            action="#"
            :http-request="handleUpload"
            :show-file-list="false"
          >
            <el-button type="primary" plain icon="Upload">点击上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传图片、文档等文件，大小不超过 10MB
              </div>
            </template>
          </el-upload>
        </div>

        <el-table :data="attachments" style="width: 100%; margin-top: 15px;" border>
          <el-table-column prop="name" label="文件名" min-width="200">
             <template #default="{ row }">
               <div style="display: flex; align-items: center;">
                 <el-icon style="margin-right: 5px;"><Document /></el-icon>
                 {{ row.name }}
               </div>
             </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="120" align="center">
            <template #default="{ row }">
              {{ (row.size / 1024).toFixed(2) }} KB
            </template>
          </el-table-column>
          <el-table-column prop="uploaded_at" label="上传时间" width="180" align="center">
             <template #default="{ row }">
              {{ new Date(row.uploaded_at).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-link :href="row.file_url" target="_blank" type="primary" :underline="false" style="margin-right: 15px;">
                <el-icon><Download /></el-icon> 下载
              </el-link>
              <el-button v-if="!isViewMode" link type="danger" @click="removeAttachment(row)">
                 <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 日志区域 -->
      <div v-if="isEdit || isViewMode" class="form-section" style="margin-top: 24px;">
        <div class="section-title">相关记录</div>
        <el-tabs type="border-card">
          <el-tab-pane label="成员备注">
            <div class="comments-section">
              <div v-if="comments.length === 0" class="no-comments">
                暂无备注
              </div>
              <div v-else class="comment-list">
                <div v-for="comment in comments" :key="comment.id" class="comment-item">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.author_name }}</span>
                    <span class="comment-time">{{ new Date(comment.created_at).toLocaleString() }}</span>
                  </div>
                  <div class="comment-content">
                    <template v-if="editingCommentId === comment.id">
                      <el-input 
                        v-model="editingContent" 
                        type="textarea" 
                        :rows="2"
                      />
                      <div class="comment-edit-actions">
                        <el-button type="primary" size="small" @click="saveEditComment(comment.id)">保存</el-button>
                        <el-button size="small" @click="cancelEditComment">取消</el-button>
                      </div>
                    </template>
                    <template v-else>
                      <pre>{{ comment.content }}</pre>
                    </template>
                  </div>
                  <div class="comment-actions" v-if="comment.can_edit && editingCommentId !== comment.id && !isViewMode">
                     <el-button link type="primary" size="small" @click="startEditComment(comment)">编辑</el-button>
                     <el-button link type="danger" size="small" @click="handleDeleteComment(comment.id)">删除</el-button>
                  </div>
                </div>
              </div>

              <div class="add-comment" v-if="canComment">
                <el-input
                  v-model="newComment"
                  type="textarea"
                  :rows="3"
                  placeholder="发表您的备注..."
                />
                <div style="margin-top: 10px; text-align: right;">
                  <el-button type="primary" @click="submitComment" :loading="commentLoading">发布备注</el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="变更记录">
             <div class="log-container">
               <el-timeline>
                 <el-timeline-item
                   v-for="(log, index) in logs"
                   :key="index"
                   :timestamp="new Date(log.created_at).toLocaleString()"
                   placement="top"
                   :type="log.action === 'Create' ? 'success' : 'primary'"
                 >
                   <el-card class="log-card">
                     <h4>{{ log.operator_name || 'Unknown' }} 执行了 {{ log.action }}</h4>
                     <pre v-if="log.content" class="log-content">{{ log.content }}</pre>
                   </el-card>
                 </el-timeline-item>
                 <el-timeline-item v-if="logs.length === 0" timestamp="暂无日志" placement="top">
                 </el-timeline-item>
               </el-timeline>
             </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTestCase, createTestCase, updateTestCase, uploadAttachment, deleteAttachment, getTestCaseLogs, getTestCaseComments, createTestCaseComment, updateTestCaseComment, deleteTestCaseComment } from '../../api/testcases'
import { getProjects } from '../../api/projects'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Document, Download, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  isView: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const router = useRouter()

const isViewMode = computed(() => props.isView || route.query.mode === 'view')

const formRef = ref(null)
const loading = ref(false)
const projects = ref([])
const attachments = ref([])
const logs = ref([])
const comments = ref([])
const commentLoading = ref(false)
const newComment = ref('')
const editingCommentId = ref(null)
const editingContent = ref('')

const canComment = computed(() => {
  // Assuming all authenticated users can comment if they can see the page
  // But not in view-only mode
  if (isViewMode.value) return false
  return true
})

const form = reactive({
  project: null,
  version: null,
  module: '',
  test_item: '',
  title: '',
  priority: 'P2',
  type: 'functional',
  status: 'pending',
  preconditions: '',
  steps: '',
  test_data: '',
  expected: ''
})

const availableVersions = computed(() => {
  if (!form.project) return []
  const project = projects.value.find(p => p.id === form.project)
  return project ? (project.versions || []) : []
})

const rules = {
  project: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
  version: [{ required: true, message: '请选择关联版本', trigger: 'change' }],
  title: [{ required: true, message: '请输入用例标题', trigger: 'blur' }],
  module: [{ required: true, message: '请输入模块名称', trigger: 'blur' }],
  test_item: [{ required: true, message: '请输入测试项', trigger: 'blur' }],
}

const isEdit = computed(() => !!route.params.id)

const fetchLogs = async () => {
  try {
    const res = await getTestCaseLogs(route.params.id)
    logs.value = res
  } catch (error) {
    console.error('Failed to fetch logs', error)
  }
}

const fetchComments = async () => {
  try {
    const res = await getTestCaseComments(route.params.id)
    comments.value = res
  } catch (error) {
    console.error('Failed to fetch comments', error)
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) return
  
  commentLoading.value = true
  try {
    await createTestCaseComment({
      test_case: route.params.id,
      content: newComment.value
    })
    ElMessage.success('备注发布成功')
    newComment.value = ''
    fetchComments()
  } catch (error) {
    ElMessage.error('发布备注失败')
  } finally {
    commentLoading.value = false
  }
}

const startEditComment = (comment) => {
  editingCommentId.value = comment.id
  editingContent.value = comment.content
}

const cancelEditComment = () => {
  editingCommentId.value = null
  editingContent.value = ''
}

const saveEditComment = async (id) => {
  if (!editingContent.value.trim()) return
  
  try {
    await updateTestCaseComment(id, {
      content: editingContent.value
    })
    ElMessage.success('备注更新成功')
    cancelEditComment()
    fetchComments()
  } catch (error) {
    console.error(error)
    ElMessage.error(error.response?.data?.detail || '更新失败，可能已超过编辑时限')
  }
}

const handleDeleteComment = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条备注吗？', '提示', { type: 'warning' })
    await deleteTestCaseComment(id)
    ElMessage.success('删除成功')
    fetchComments()
  } catch (error) {
    if (error !== 'cancel') {
        ElMessage.error(error.response?.data?.detail || '删除失败')
    }
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const projRes = await getProjects({ page_size: 100 })
    projects.value = projRes.results || []

    // If creating new and project ID is passed in query, set it
    if (!isEdit.value) {
      if (route.query.project) {
        const projId = parseInt(route.query.project)
        if (!isNaN(projId)) {
          form.project = projId
        }
      }
      if (route.query.version) {
        const verId = parseInt(route.query.version)
        if (!isNaN(verId)) {
          form.version = verId
        }
      }
    }

    if (isEdit.value) {
      const res = await getTestCase(route.params.id)
      Object.assign(form, res)
      // 如果 project 是对象，取 id
      if (typeof form.project === 'object' && form.project) {
        form.project = form.project.id
      }
      // 如果 version 是对象，取 id
      if (typeof form.version === 'object' && form.version) {
        form.version = form.version.id
      }
      attachments.value = res.attachments || []
      
      // Fetch logs
      fetchLogs()
      fetchComments()
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (isEdit.value) {
          await updateTestCase(route.params.id, form)
          ElMessage.success('更新成功')
        } else {
          const res = await createTestCase(form)
          ElMessage.success('创建成功')
          router.push({ name: 'TestCaseEdit', params: { id: res.id } })
        }
      } catch (error) {
        ElMessage.error('保存失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleUpload = async (options) => {
  const formData = new FormData()
  formData.append('file', options.file)
  formData.append('name', options.file.name)
  formData.append('size', options.file.size)
  formData.append('test_case', route.params.id)

  try {
    const res = await uploadAttachment(formData)
    attachments.value.unshift(res)
    ElMessage.success('上传成功')
  } catch (error) {
    ElMessage.error('上传失败')
  }
}

const removeAttachment = async (row) => {
  ElMessageBox.confirm('确定要删除该附件吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteAttachment(row.id)
      attachments.value = attachments.value.filter(a => a.id !== row.id)
      ElMessage.success('附件已删除')
    } catch (error) {
      ElMessage.error('删除附件失败')
    }
  })
}

const handleCancel = () => {
  const versionName = route.query.versionName || form.version_name

  if (isEdit.value && form.project && form.version) {
    // If editing and we have context, try to go back to the list with filters
    router.push({ 
      name: 'TestCaseList', 
      query: { 
        project: form.project,
        version: form.version,
        versionName: versionName
      } 
    })
  } else if (route.query.project && route.query.version) {
    // If creating and we came from a filtered list
    router.push({ 
      name: 'TestCaseList', 
      query: { 
        project: route.query.project,
        version: route.query.version,
        versionName: route.query.versionName
      } 
    })
  } else {
    // Fallback
    router.back()
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.test-case-form {
  margin: 20px;
}
.form-content {
  /* padding: 0 10px; */
}
.form-section {
  background-color: #fff;
  padding: 24px 32px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}
.form-section:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
  padding-left: 12px;
  border-left: 4px solid #409eff;
  line-height: 1.2;
}
.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
  padding-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.attachments-section {
  margin-top: 30px;
}
.upload-container {
  margin-bottom: 15px;
}
.log-container {
  padding: 10px;
}
.log-card {
  /* margin-bottom: 5px; */
}
.log-card h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #333;
}
.log-content {
  margin: 0;
  white-space: pre-wrap;
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  color: #666;
}
.comments-section {
  padding: 10px 0;
}
.comment-item {
  border-bottom: 1px solid #ebeef5;
  padding: 15px 0;
}
.comment-item:last-child {
  border-bottom: none;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}
.comment-author {
  font-weight: bold;
  color: #303133;
}
.comment-time {
  color: #909399;
}
.comment-content {
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}
.comment-content pre {
  margin: 0;
  font-family: inherit;
  white-space: pre-wrap;
}
.comment-actions {
  margin-top: 8px;
  text-align: right;
}
.add-comment {
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}
.no-comments {
  text-align: center;
  color: #909399;
  padding: 20px;
}
.comment-edit-actions {
  margin-top: 10px;
  text-align: right;
}
</style>
