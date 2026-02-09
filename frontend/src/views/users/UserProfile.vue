<template>
  <div class="user-profile">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>个人中心</span>
        </div>
      </template>
      
      <el-form :model="userForm" label-width="100px" v-if="userForm.username">
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" disabled></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" disabled></el-input>
        </el-form-item>
        <el-form-item label="角色">
           <el-tag>{{ userForm.role }}</el-tag>
        </el-form-item>
         <el-form-item label="部门" v-if="userForm.department_name">
           <el-tag type="info">{{ userForm.department_name }}</el-tag>
        </el-form-item>
      </el-form>
      
      <el-divider content-position="left">修改密码</el-divider>
      
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="原密码" prop="old_password">
          <el-input v-model="passwordForm.old_password" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="passwordForm.new_password" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirm_password">
          <el-input v-model="passwordForm.confirm_password" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangePassword" :loading="loading">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getCurrentUser, changePassword } from '@/api/users'
import { ElMessage } from 'element-plus'

const userForm = ref({})
const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})
const loading = ref(false)
const passwordFormRef = ref(null)

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.new_password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const passwordRules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirm_password: [{ validator: validatePass2, trigger: 'blur' }]
}

onMounted(async () => {
  try {
    const res = await getCurrentUser()
    userForm.value = res
  } catch (error) {
    console.error(error)
  }
})

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await changePassword({
            old_password: passwordForm.old_password,
            new_password: passwordForm.new_password
        })
        ElMessage.success('密码修改成功')
        passwordForm.old_password = ''
        passwordForm.new_password = ''
        passwordForm.confirm_password = ''
        passwordFormRef.value.resetFields()
      } catch (error) {
        console.error(error)
        ElMessage.error(error.response?.data?.error || '密码修改失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.user-profile {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
