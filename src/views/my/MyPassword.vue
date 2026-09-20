<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as userApi from '@/api/user'

/**
 * 修改密码：旧密码 + 新密码
 */
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const saving = ref(false)

function submit() {
  if (!form.oldPassword) {
    ElMessage.warning('请输入旧密码')
    return
  }
  if (form.newPassword.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  saving.value = true
  userApi
    .changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword })
    .then(() => {
      ElMessage.success('密码修改成功')
      form.oldPassword = ''
      form.newPassword = ''
      form.confirmPassword = ''
    })
    .catch(() => {
      /* 拦截器已提示 */
    })
    .finally(() => {
      saving.value = false
    })
}
</script>

<template>
  <div class="app-card section-card">
    <h3 class="section-title">修改密码</h3>
    <el-form label-width="90px" class="pwd-form" @submit.prevent>
      <el-form-item label="旧密码">
        <el-input
          v-model="form.oldPassword"
          type="password"
          show-password
          placeholder="请输入当前密码"
          style="max-width: 320px"
        />
      </el-form-item>
      <el-form-item label="新密码">
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          placeholder="至少 6 位"
          style="max-width: 320px"
        />
      </el-form-item>
      <el-form-item label="确认新密码">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          placeholder="再次输入新密码"
          style="max-width: 320px"
          @keyup.enter="submit"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="submit">确认修改</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.section-card {
  padding: 24px 28px;
}
.section-title {
  font-size: 17px;
  margin-bottom: 20px;
}
.pwd-form {
  max-width: 560px;
}
</style>
