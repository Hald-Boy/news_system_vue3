<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as userApi from '@/api/user'
import * as smsApi from '@/api/sms'
import { SMS_SCENE } from '@/constants/enums'
import { useUserStore } from '@/stores/user'

/**
 * 注册页：手机号 + 验证码 + 密码，注册成功后自动登录
 */
const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  phone: '',
  smsCode: '',
  passWord: '',
  confirmPassword: ''
})

const loading = ref(false)
const countdown = ref(0)
let timer = null

function startCountdown() {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function sendSms() {
  if (!/^1\d{10}$/.test(form.phone)) {
    ElMessage.warning('请输入正确的 11 位手机号')
    return
  }
  if (countdown.value > 0) return
  try {
    await smsApi.sendCode(form.phone, SMS_SCENE.REGISTER)
    ElMessage.success('验证码已发送，请查看后端控制台')
    startCountdown()
  } catch (e) {
    /* 拦截器已提示 */
  }
}

function validate() {
  if (!/^1\d{10}$/.test(form.phone)) {
    ElMessage.warning('请输入正确的 11 位手机号')
    return false
  }
  if (!form.smsCode) {
    ElMessage.warning('请输入验证码')
    return false
  }
  if (form.passWord.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return false
  }
  if (form.passWord !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return false
  }
  return true
}

async function submit() {
  if (!validate()) return
  loading.value = true
  try {
    const data = await userApi.register({
      phone: form.phone,
      smsCode: form.smsCode,
      passWord: form.passWord
    })
    // 注册成功后接口返回 token+user，自动登录
    userStore.setAuth(data)
    ElMessage.success('注册成功，欢迎加入世界社区！')
    router.push({ name: 'home' })
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-card app-card">
      <div class="auth-header">
        <el-icon :size="30" color="#4f7cff"><Connection /></el-icon>
        <h2>加入世界社区</h2>
        <p>注册只需 30 秒，开启你的分享之旅</p>
      </div>

      <el-form label-position="top" @submit.prevent>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入 11 位手机号" maxlength="11" size="large">
            <template #prefix><el-icon><Iphone /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="短信验证码">
          <div class="sms-row">
            <el-input v-model="form.smsCode" placeholder="请输入验证码" maxlength="6" size="large">
              <template #prefix><el-icon><Message /></el-icon></template>
            </el-input>
            <el-button size="large" :disabled="countdown > 0" @click="sendSms">
              {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.passWord" type="password" show-password placeholder="至少 6 位" size="large">
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            show-password
            placeholder="再次输入密码"
            size="large"
            @keyup.enter="submit"
          >
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
      </el-form>

      <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">注册</el-button>

      <div class="auth-footer">
        已有账号？
        <router-link to="/login" class="link">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
}
.auth-card {
  width: 420px;
  max-width: 100%;
  padding: 32px;
}
.auth-header {
  text-align: center;
  margin-bottom: 20px;
}
.auth-header h2 {
  font-size: 20px;
  margin-top: 10px;
}
.auth-header p {
  color: #8a9099;
  font-size: 13px;
  margin-top: 6px;
}
.sms-row {
  display: flex;
  gap: 10px;
  width: 100%;
}
.sms-row .el-input {
  flex: 1;
}
.submit-btn {
  width: 100%;
  margin-top: 8px;
}
.auth-footer {
  text-align: center;
  margin-top: 16px;
  color: #8a9099;
  font-size: 13px;
}
.link {
  color: #4f7cff;
  font-weight: 500;
}
</style>
