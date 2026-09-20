<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import AppHeader from '@/components/AppHeader.vue'

const userStore = useUserStore()

onMounted(async () => {
  // 刷新页面后恢复登录态：有 token 则拉取用户信息与未读数
  if (userStore.token) {
    const info = await userStore.fetchInfo()
    if (info) {
      userStore.refreshUnread()
    }
  }
})
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <router-view />
    </main>
    <footer class="app-footer">世界社区 · 连接每一个热爱分享的人</footer>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.app-main {
  flex: 1;
}
.app-footer {
  text-align: center;
  padding: 24px 0 32px;
  color: #a3a8b0;
  font-size: 13px;
}
</style>
