<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Connection } from '@element-plus/icons-vue'
import * as userApi from '@/api/user'
import * as smsApi from '@/api/sms'
import { SMS_SCENE } from '@/constants/enums'
import { useUserStore } from '@/stores/user'

/**
 * 登录页（X 风格）
 * 默认手机号验证码登录：主按钮「获取验证码」→ 发码后变「继续」提交登录
 * 可切换「使用密码登录」：表单下方多密码输入框，主按钮为「继续」
 * QQ / 微信登录为占位入口（暂未开放）
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// sms：手机号验证码登录（默认）；password：密码登录
const mode = ref('sms')

const phone = ref('')
const smsCode = ref('')
const passWord = ref('')

const loading = ref(false)

// 验证码倒计时
const countdown = ref(0)
const smsSent = ref(false) // 是否已发送过验证码
let timer = null

function startCountdown() {
  countdown.value = 60
  clearInterval(timer)
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function sendSms() {
  if (!/^1\d{10}$/.test(phone.value)) {
    ElMessage.warning('请输入正确的 11 位手机号')
    return
  }
  if (countdown.value > 0) return
  try {
    await smsApi.sendCode(phone.value, SMS_SCENE.LOGIN)
    ElMessage.success('验证码已发送，请查看后端控制台')
    smsSent.value = true
    startCountdown()
  } catch (e) {
    /* 拦截器已提示 */
  }
}

function goAfterLogin() {
  const redirect = route.query.redirect
  router.push(typeof redirect === 'string' && redirect ? redirect : { name: 'home' })
}

async function loginBySms() {
  if (!/^1\d{10}$/.test(phone.value)) {
    ElMessage.warning('请输入正确的 11 位手机号')
    return
  }
  if (!smsCode.value) {
    ElMessage.warning('请输入验证码')
    return
  }
  loading.value = true
  try {
    const data = await userApi.loginBySms({ phone: phone.value, smsCode: smsCode.value })
    userStore.setAuth(data)
    ElMessage.success('登录成功')
    goAfterLogin()
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

async function loginByPassword() {
  if (!/^1\d{10}$/.test(phone.value)) {
    ElMessage.warning('请输入正确的 11 位手机号')
    return
  }
  if (!passWord.value) {
    ElMessage.warning('请输入密码')
    return
  }
  loading.value = true
  try {
    const data = await userApi.loginByPassword({ phone: phone.value, passWord: passWord.value })
    userStore.setAuth(data)
    ElMessage.success('登录成功')
    goAfterLogin()
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

// 主按钮点击：验证码模式未发码=发码，已发码=登录；密码模式=登录
function handlePrimary() {
  if (mode.value === 'sms') {
    if (!smsSent.value || countdown.value <= 0) {
      sendSms()
    } else {
      loginBySms()
    }
  } else {
    loginByPassword()
  }
}

function switchMode() {
  mode.value = mode.value === 'sms' ? 'password' : 'sms'
}

function placeholderLogin(name) {
  ElMessage.info(`${name}登录暂未开放，敬请期待`)
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="x-login">
    <!-- 左侧：登录模块 -->
    <div class="x-login-left">
      <h1 class="x-slogan">看世界，也发声。</h1>
      <p class="x-sub">加入世界社区，分享你的新鲜事</p>

      <div class="x-form">
        <el-input
          v-model="phone"
          class="x-input"
          placeholder="手机号"
          maxlength="11"
          size="large"
          @keyup.enter="handlePrimary"
        />

        <template v-if="mode === 'sms'">
          <el-input
            v-model="smsCode"
            class="x-input"
            placeholder="验证码"
            maxlength="6"
            size="large"
            @keyup.enter="handlePrimary"
          />
          <div v-if="countdown > 0" class="x-sms-tip">{{ countdown }} 秒后可重新获取</div>
          <div v-else-if="smsSent" class="x-sms-tip x-sms-resend" @click="sendSms">重新获取验证码</div>
        </template>

        <template v-else>
          <el-input
            v-model="passWord"
            class="x-input"
            type="password"
            show-password
            placeholder="密码"
            size="large"
            @keyup.enter="handlePrimary"
          />
        </template>

        <el-button class="x-primary" size="large" :loading="loading" @click="handlePrimary">
          {{ mode === 'sms' && (!smsSent || countdown <= 0) ? '获取验证码' : '继续' }}
        </el-button>
      </div>

      <div class="x-divider"><span>或</span></div>

      <div class="x-third">
        <el-button class="x-third-btn" size="large" @click="placeholderLogin('QQ')">
          <span class="x-third-logo qq">QQ</span>使用QQ登录
        </el-button>
        <el-button class="x-third-btn" size="large" @click="placeholderLogin('微信')">
          <span class="x-third-logo wx">微信</span>使用微信登录
        </el-button>
      </div>

      <button class="x-switch" type="button" @click="switchMode">
        {{ mode === 'sms' ? '使用密码登录' : '使用手机号验证码登录' }}
      </button>

      <p class="x-legal">
        还没有账号？
        <router-link to="/register" class="x-link">立即注册</router-link>
      </p>
    </div>

    <!-- 右侧：品牌 logo -->
    <div class="x-login-right">
      <div class="x-brand">
        <div class="x-brand-icon">
          <el-icon :size="92" color="#ffffff"><Connection /></el-icon>
        </div>
        <div class="x-brand-name">世界社区</div>
        <div class="x-brand-slogan">在这里，和世界发生点什么</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.x-login {
  min-height: 100vh;
  display: flex;
  background: #ffffff;
}

/* 左侧登录模块 */
.x-login-left {
  width: 440px;
  flex-shrink: 0;
  padding: 96px 48px 40px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.x-slogan {
  font-size: 34px;
  font-weight: 800;
  color: #0f1419;
  margin: 0 0 8px;
  letter-spacing: 1px;
}
.x-sub {
  font-size: 14px;
  color: #536471;
  margin: 0 0 36px;
}

.x-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.x-input :deep(.el-input__wrapper) {
  border-radius: 999px;
  padding: 6px 18px;
  box-shadow: 0 0 0 1px #cfd9de inset;
}
.x-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #8b98a5 inset;
}
.x-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #0f1419 inset;
}
.x-sms-tip {
  font-size: 12px;
  color: #536471;
  margin: -6px 0 0 20px;
}
.x-sms-resend {
  color: #1d9bf0;
  cursor: pointer;
}
.x-sms-resend:hover {
  text-decoration: underline;
}

.x-primary {
  width: 100%;
  margin-top: 6px;
  border-radius: 999px;
  background: #0f1419;
  border-color: #0f1419;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  height: 48px;
}
.x-primary:hover,
.x-primary:focus {
  background: #272c30;
  border-color: #272c30;
  color: #ffffff;
}

.x-divider {
  display: flex;
  align-items: center;
  margin: 28px 0 20px;
  color: #536471;
  font-size: 13px;
}
.x-divider::before,
.x-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #eff3f4;
}
.x-divider span {
  padding: 0 12px;
}

.x-third {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.x-third-btn {
  width: 100%;
  height: 48px;
  border-radius: 999px;
  border: 1px solid #cfd9de;
  background: #ffffff;
  color: #0f1419;
  font-size: 15px;
  font-weight: 600;
}
.x-third-btn:hover {
  background: #f7f9f9;
  border-color: #cfd9de;
}
.x-third-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  margin-right: 8px;
}
.x-third-logo.qq {
  background: #12b7f5;
  color: #ffffff;
}
.x-third-logo.wx {
  background: #07c160;
  color: #ffffff;
}

.x-switch {
  margin-top: 24px;
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1d9bf0;
  cursor: pointer;
  align-self: center;
}
.x-switch:hover {
  text-decoration: underline;
}

.x-legal {
  margin-top: 28px;
  font-size: 13px;
  color: #536471;
  text-align: center;
}
.x-link {
  color: #1d9bf0;
  font-weight: 600;
  text-decoration: none;
}
.x-link:hover {
  text-decoration: underline;
}

/* 右侧品牌 logo */
.x-login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%);
}
.x-brand {
  text-align: center;
  padding: 24px;
}
.x-brand-icon {
  width: 160px;
  height: 160px;
  border-radius: 40px;
  background: #0f1419;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28px;
}
.x-brand-name {
  font-size: 40px;
  font-weight: 900;
  color: #0f1419;
  letter-spacing: 4px;
}
.x-brand-slogan {
  margin-top: 10px;
  font-size: 15px;
  color: #536471;
}

/* 窄屏：右侧隐藏，登录模块铺满 */
@media (max-width: 900px) {
  .x-login-right {
    display: none;
  }
  .x-login-left {
    width: 100%;
    padding: 64px 24px 40px;
  }
}
</style>
