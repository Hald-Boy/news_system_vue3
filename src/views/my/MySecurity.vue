<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as userApi from '@/api/user'
import { useUserStore } from '@/stores/user'

/**
 * 账号注销（需二次确认）
 */
const router = useRouter()
const userStore = useUserStore()

const deleting = ref(false)

async function deleteAccount() {
  try {
    await ElMessageBox.confirm(
      '注销后账号数据将被删除且无法恢复，确定要注销账号吗？',
      '注销账号',
      {
        confirmButtonText: '确认注销',
        cancelButtonText: '再想想',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch (e) {
    return
  }
  deleting.value = true
  try {
    await userApi.deleteCurrent()
    await userStore.logout()
    ElMessage.success('账号已注销，期待与你再次相遇')
    router.push({ name: 'home' })
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="app-card section-card">
    <h3 class="section-title danger-title">账号注销</h3>
    <div class="danger-box">
      <el-icon :size="28" color="#e64340"><WarningFilled /></el-icon>
      <div class="danger-text">
        <p class="danger-main">注销账号是不可逆操作</p>
        <p class="danger-sub">
          注销后，你的个人信息、发布的帖子、评论、收藏与关注关系都将被删除，且无法找回。
          请谨慎操作。
        </p>
      </div>
    </div>
    <el-button type="danger" plain :loading="deleting" @click="deleteAccount">注销我的账号</el-button>
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
.danger-title {
  color: #e64340;
}
.danger-box {
  display: flex;
  gap: 12px;
  background: #fff3f3;
  border: 1px solid #ffd6d6;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
}
.danger-main {
  font-weight: 600;
  color: #1f2329;
}
.danger-sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 6px;
  line-height: 1.7;
}
</style>
