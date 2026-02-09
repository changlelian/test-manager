<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
        <div class="logo-wrapper">
          <img src="@/assets/vue.svg" alt="Logo" class="logo-img" />
        </div>
        <h2>山东奥太电气测试用例管理系统</h2>
        <p>欢迎登录</p>
      </div>
      <el-form :model="form" @submit.prevent="handleLogin" size="large">
        <el-form-item>
          <el-input 
            v-model="form.username" 
            placeholder="用户名" 
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item>
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="密码" 
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        研发：焊研二十五部@连常乐
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  
  loading.value = true
  try {
    const res = await axios.post('/api/auth/token/', form)
    localStorage.setItem('token', res.data.access)
    
    // Fetch user info to get role
    const userRes = await axios.get('/api/users/me/', {
      headers: { Authorization: `Bearer ${res.data.access}` }
    })
    
    localStorage.setItem('user_role', userRes.data.role)
    localStorage.setItem('user_id', userRes.data.id)
    localStorage.setItem('username', userRes.data.username)

    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error('登录失败，请检查用户名或密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #2d3a4b;
  background-image: url('https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg');
  background-repeat: no-repeat;
  background-position: center 110px;
  background-size: 100%;
}
.login-card {
  width: 480px;
  border-radius: 8px;
}
.login-header {
  text-align: center;
  margin-bottom: 30px;
}
.logo-wrapper {
  margin-bottom: 15px;
}
.logo-img {
  height: 60px;
  width: auto;
}
.login-header h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 600;
}
.login-header p {
  font-size: 14px;
  color: #999;
  margin: 0;
}
.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: #909399;
}
</style>
