<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { avatarText } from '@/utils/auth'

/**
 * 我的页面布局：左侧菜单 + 右侧内容（嵌套路由）
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => {
  const name = route.name
  if (name === 'myProfile') return '/my/profile'
  if (name === 'myCollect') return '/my/collect'
  if (name === 'myNotifications') return '/my/notifications'
  if (name === 'myPassword') return '/my/password'
  if (name === 'mySecurity') return '/my/security'
  return '/my/profile'
})

function onSelect(path) {
  router.push(path)
}
</script>

<template>
  <div class="page-container my-page">
    <div class="my-layout">
      <aside class="my-aside app-card">
        <div class="aside-user">
          <el-avatar :size="52" :src="userStore.userInfo?.avatar" class="aside-avatar">
            {{ avatarText(userStore.userInfo?.username) }}
          </el-avatar>
          <div class="aside-user-info">
            <p class="aside-name ellipsis">{{ userStore.userInfo?.username || '未设置昵称' }}</p>
            <p class="aside-sub">{{ userStore.userInfo?.phone || '' }}</p>
          </div>
        </div>
        <el-menu :default-active="activeMenu" class="aside-menu" @select="onSelect">
          <el-menu-item index="/my/profile">
            <el-icon><User /></el-icon><span>个人资料</span>
          </el-menu-item>
          <el-menu-item index="/my/collect">
            <el-icon><Collection /></el-icon><span>我的收藏</span>
          </el-menu-item>
          <el-menu-item index="/my/notifications">
            <el-icon><Bell /></el-icon><span>我的通知</span>
            <el-badge
              v-if="userStore.unreadCount > 0"
              :value="userStore.unreadCount"
              :max="99"
              class="menu-badge"
            />
          </el-menu-item>
          <el-menu-item index="/my/password">
            <el-icon><Lock /></el-icon><span>修改密码</span>
          </el-menu-item>
          <el-menu-item index="/my/security">
            <el-icon><Warning /></el-icon><span>账号注销</span>
          </el-menu-item>
        </el-menu>
      </aside>
      <main class="my-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.my-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  max-width: 1080px;
  margin: 0 auto;
}
.my-aside {
  width: 220px;
  flex-shrink: 0;
  padding: 16px 10px;
  position: sticky;
  top: 76px;
}
.aside-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 16px;
  border-bottom: 1px solid #f2f3f5;
  margin-bottom: 8px;
}
.aside-avatar {
  background: linear-gradient(135deg, #4f7cff, #7aa2ff);
  flex-shrink: 0;
}
.aside-user-info {
  min-width: 0;
}
.aside-name {
  font-weight: 600;
  font-size: 14px;
}
.aside-sub {
  font-size: 12px;
  color: #a3a8b0;
  margin-top: 2px;
}
.aside-menu {
  border-right: none;
}
.aside-menu :deep(.el-menu-item) {
  border-radius: 8px;
  margin-bottom: 2px;
  height: 44px;
}
.menu-badge {
  margin-left: auto;
}
.my-content {
  flex: 1;
  min-width: 0;
}
@media (max-width: 900px) {
  .my-layout {
    flex-direction: column;
  }
  .my-aside {
    width: 100%;
    position: static;
  }
  .aside-menu {
    display: flex;
    flex-wrap: wrap;
  }
  .aside-menu .el-menu-item {
    flex: 1;
    min-width: 130px;
  }
}
</style>
