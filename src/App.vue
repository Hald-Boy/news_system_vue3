<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { initTheme } from '@/utils/theme'
import XSidebar from '@/components/XSidebar.vue'
import XWidgets from '@/components/XWidgets.vue'

const userStore = useUserStore()
const route = useRoute()

/** 登录/注册等全屏页：不渲染三栏 */
const isBare = computed(() => !!route.meta.guestOnly)

onMounted(async () => {
  // 恢复日间/夜间主题
  initTheme()
  // 刷新页面后恢复登录态
  if (userStore.token) {
    const info = await userStore.fetchInfo()
    if (info) {
      userStore.refreshUnread()
    }
  }
})
</script>

<template>
  <!-- 全屏页（登录/注册） -->
  <router-view v-if="isBare" />

  <!-- X 三栏 shell -->
  <div v-else class="x-shell">
    <XSidebar />

    <main class="x-center">
      <!-- sticky 页头 -->
      <div class="x-topbar">
        <h1 class="topbar-title">{{ route.meta.title || '世界社区' }}</h1>
      </div>

      <router-view />
    </main>

    <XWidgets />
  </div>
</template>

<style scoped>
.x-shell {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
}
.x-center {
  flex: 1;
  max-width: 600px;
  min-height: 100vh;
  border-left: 1px solid var(--x-border);
  border-right: 1px solid var(--x-border);
}
.x-topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--x-topbar-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--x-border);
  padding: 14px 16px;
}
.topbar-title {
  font-size: 19px;
  font-weight: 800;
}
@media (max-width: 1200px) {
  .x-center {
    border-left: none;
  }
}
</style>
