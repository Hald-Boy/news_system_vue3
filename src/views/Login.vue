<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as userApi from '@/api/user'
import * as smsApi from '@/api/sms'
import { SMS_SCENE } from '@/constants/enums'
import { useUserStore } from '@/stores/user'

/**
 * 登录页：密码登录 / 短信验证码登录
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('password')
const loading = ref(false)

const passwordForm = reactive({
  phone: '',
  passWord: ''
})

const smsForm = reactive({
  phone: '',
  smsCode: ''
})

// 验证码倒计时
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
  if (!/^1\d{10}$/.test(smsForm.phone)) {
    ElMessage.warning('请输入正确的 11 位手机号')
    return
  }
  if (countdown.value > 0) return
  try {
    await smsApi.sendCode(smsForm.phone, SMS_SCENE.LOGIN)
    ElMessage.success('验证码已发送，请查看后端控制台')
    startCountdown()
  } catch (e) {
    /* 拦截器已提示 */
  }
}

function goAfterLogin() {
  const redirect = route.query.redirect
  router.push(typeof redirect === 'string' && redirect ? redirect : { name: 'home' })
}

async function loginByPassword() {
  if (!/^1\d{10}$/.test(passwordForm.phone)) {
    ElMessage.warning('请输入正确的 11 位手机号')
    return
  }
  if (!passwordForm.passWord) {
    ElMessage.warning('请输入密码')
    return
  }
  loading.value = true
  try {
    const data = await userApi.loginByPassword({ ...passwordForm })
    userStore.setAuth(data)
    ElMessage.success('登录成功')
    goAfterLogin()
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

async function loginBySms() {
  if (!/^1\d{10}$/.test(smsForm.phone)) {
    ElMessage.warning('请输入正确的 11 位手机号')
    return
  }
  if (!smsForm.smsCode) {
    ElMessage.warning('请输入验证码')
    return
  }
  loading.value = true
  try {
    const data = await userApi.loginBySms({ ...smsForm })
    userStore.setAuth(data)
    ElMessage.success('登录成功')
    goAfterLogin()
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

function submit() {
  if (activeTab.value === 'password') {
    loginByPassword()
  } else {
    loginBySms()
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
        <h2>欢迎回到世界社区</h2>
        <p>登录后即可发布、评论、互动</p>
      </div>

      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="密码登录" name="password">
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="手机号">
              <el-input v-model="passwordForm.phone" placeholder="请输入手机号" maxlength="11" size="large">
                <template #prefix><el-icon><Iphone /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="passwordForm.passWord"
                type="password"
                show-password
                placeholder="请输入密码"
                size="large"
                @keyup.enter="submit"
              >
                <template #prefix><el-icon><Lock /></el-icon></template>
              </el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="验证码登录" name="sms">
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="手机号">
              <el-input v-model="smsForm.phone" placeholder="请输入手机号" maxlength="11" size="large">
                <template #prefix><el-icon><Iphone /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="验证码">
              <div class="sms-row">
                <el-input
                  v-model="smsForm.smsCode"
                  placeholder="请输入验证码"
                  maxlength="6"
                  size="large"
                  @keyup.enter="submit"
                >
                  <template #prefix><el-icon><Message /></el-icon></template>
                </el-input>
                <el-button size="large" :disabled="countdown > 0" @click="sendSms">
                  {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">登录</el-button>

      <div class="auth-footer">
        还没有账号？
        <router-link to="/register" class="link">立即注册</router-link>
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
