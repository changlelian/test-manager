<template>
  <div class="notification-settings">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>企业微信通知设置</span>
        </div>
      </template>
      
      <el-form :model="form" label-width="120px" v-loading="loading">
        <el-form-item label="Webhook URL">
          <el-input 
            v-model="form.webhook_url" 
            placeholder="请输入企业微信群机器人的 Webhook URL"
            clearable
          />
          <div class="help-text">
            请输入企业微信机器人的 Webhook URL。如果为空，则不发送通知。
            <br>
            例如: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveSettings">保存配置</el-button>
          <el-button type="success" @click="testWebhook" :disabled="!form.webhook_url">发送测试消息</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

const loading = ref(false)
const form = ref({
  webhook_url: ''
})

const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await api.get('system/settings/')
    // Handle pagination if present, or list
    const settings = res.results || res
    
    if (Array.isArray(settings)) {
      const wecomSetting = settings.find(s => s.key === 'wecom_webhook')
      if (wecomSetting) {
        form.value.webhook_url = wecomSetting.value
      }
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    // api interceptor handles 401/errors usually, but we catch here too
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  loading.value = true
  try {
    await api.post('system/settings/update_setting/', {
      key: 'wecom_webhook',
      value: form.value.webhook_url
    })
    ElMessage.success('配置已保存')
  } catch (error) {
    console.error('Failed to save settings:', error)
    ElMessage.error('保存配置失败')
  } finally {
    loading.value = false
  }
}

const testWebhook = async () => {
  loading.value = true
  try {
    await api.post('system/settings/test_webhook/', {
      webhook_url: form.value.webhook_url
    })
    ElMessage.success('测试消息发送成功，请在企业微信群查看')
  } catch (error) {
    console.error('Test failed:', error)
    // Error message might be in error.response.data.error or just error.message depending on interceptor
    // The interceptor returns Promise.reject(error), so error is the axios error object.
    const errorMsg = error.response?.data?.error || '测试发送失败'
    ElMessage.error(errorMsg)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.notification-settings {
  padding: 20px;
}
.box-card {
  max-width: 800px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
