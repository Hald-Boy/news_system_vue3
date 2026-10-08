<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { avatarText } from '@/utils/auth'
import { ROLE } from '@/constants/enums'

/**
 * X 风格左侧导航栏
 * 排除项：聊天、Grok、创作者工作室、Premium
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.userInfo?.role === ROLE.ADMIN)
const user = computed(() => userStore.userInfo || {})

/** 需登录的导航点击：未登录引导去登录页 */
function guardLogin(target) {
  if (!userStore.token) {
    ElMessage.warning('请先登录')
    router.push({ name: 'login', query: { redirect: target ? router.resolve(target).fullPath : undefined } })
    return
  }
  router.push(target)
}

const navItems = computed(() => [
  { key: 'home', label: '主页', icon: 'House', to: { name: 'home' }, requiresAuth: false,
    active: () => route.name === 'home' },
  { key: 'explore', label: '探索', icon: 'Search', to: { name: 'home' }, requiresAuth: false,
    active: () => false },
  { key: 'notifications', label: '通知', icon: 'Bell', to: { name: 'myNotifications' }, requiresAuth: true,
    badge: computed(() => userStore.unreadCount),
    active: () => route.name === 'myNotifications' },
  { key: 'bookmarks', label: '收藏', icon: 'CollectionStar', to: { name: 'myCollect' }, requiresAuth: true,
    active: () => route.name === 'myCollect' },
  { key: 'profile', label: '个人资料', icon: 'User',
    to: computed(() => ({ name: 'userProfile', params: { id: userStore.userId } })), requiresAuth: true,
    active: () => route.name === 'userProfile' && Number(route.params.id) === Number(userStore.userId) },
])

function onNavClick(item) {
  const to = typeof item.to === 'function' ? item.to() : item.to
  if (item.requiresAuth) {
    guardLogin(to)
  } else {
    router.push(to)
  }
}

function goPublish() {
  if (!userStore.token) {
    router.push({ name: 'login', query: { redirect: '/post/edit' } })
    return
  }
  router.push({ name: 'postCreate' })
}

function goRegister() {
  router.push({ name: 'register' })
}

function goLogin() {
  router.push({ name: 'login' })
}

/** 底部用户卡片 / 更多 下拉 */
function onCommand(cmd) {
  if (cmd === 'my') router.push({ name: 'myProfile' })
  else if (cmd === 'admin') router.push({ name: 'adminUsers' })
  else if (cmd === 'logout') handleLogout()
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (e) {
    return
  }
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push({ name: 'home' })
}
</script>

<template>
  <aside class="x-sidebar">
    <div class="sidebar-inner">
      <!-- X Logo -->
      <div class="logo clickable" @click="router.push({ name: 'home' })">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-label="X">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>

      <!-- 导航 -->
      <nav class="nav">
        <div
          v-for="item in navItems"
          :key="item.key"
          class="nav-item clickable"
          :class="{ active: item.active() }"
          @click="onNavClick(item)"
        >
          <span class="nav-icon">
            <el-icon :size="26">
              <component :is="item.icon" />
            </el-icon>
            <span v-if="item.requiresAuth && userStore.unreadCount > 0" class="nav-dot"></span>
          </span>
          <span class="nav-label">{{ item.label }}</span>
        </div>

        <!-- 更多（下拉） -->
        <el-dropdown trigger="click" @command="onCommand" :hide-on-click="true">
          <div class="nav-item clickable">
            <span class="nav-icon"><el-icon :size="26"><MoreFilled /></el-icon></span>
            <span class="nav-label">更多</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="isLoggedIn" command="my">我的设置</el-dropdown-item>
              <el-dropdown-item v-if="isAdmin" command="admin">管理后台</el-dropdown-item>
              <el-dropdown-item v-if="isLoggedIn" divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </nav>

      <!-- 发布按钮 -->
      <button class="publish-btn" @click="goPublish">发布</button>

      <div class="sidebar-spacer"></div>

      <!-- 底部：用户卡片 / 登录注册 -->
      <div v-if="isLoggedIn" class="me-entry">
        <el-dropdown trigger="click" @command="onCommand" class="me-dropdown">
          <div class="me-card clickable">
            <el-avatar :size="40" :src="user.avatar" class="me-avatar">
              {{ avatarText(user.username) }}
            </el-avatar>
            <div class="me-info">
              <div class="me-name ellipsis">{{ user.username || '未设置昵称' }}</div>
              <div class="me-handle ellipsis">@{{ user.userAccount || 'user' }}</div>
            </div>
            <el-icon class="me-more"><MoreFilled /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="my">我的设置</el-dropdown-item>
              <el-dropdown-item v-if="isAdmin" divided command="admin">管理后台</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div v-else class="guest-box">
        <el-button type="primary" size="large" round class="guest-btn" @click="goLogin">登录</el-button>
        <el-button size="large" round class="guest-btn" @click="goRegister">注册</el-button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.x-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 275px;
  flex-shrink: 0;
}
.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px 12px 12px;
}
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  margin-bottom: 4px;
}
.logo:hover {
  background: var(--x-hover);
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 999px;
  width: fit-content;
}
.nav-item:hover {
  background: var(--x-hover);
}
.nav-icon {
  position: relative;
  display: inline-flex;
}
.nav-dot {
  position: absolute;
  top: -2px;
  right: -3px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--x-blue);
  border: 2px solid #fff;
}
.nav-label {
  font-size: 19px;
  font-weight: 400;
}
.nav-item.active .nav-label {
  font-weight: 700;
}
.publish-btn {
  margin-top: 16px;
  width: 100%;
  max-width: 230px;
  padding: 15px 0;
  border: none;
  border-radius: 999px;
  background: var(--x-black);
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.publish-btn:hover {
  background: rgba(15, 20, 25, 0.9);
}
.sidebar-spacer {
  flex: 1;
}
.me-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  width: 100%;
}
.me-card:hover {
  background: var(--x-hover);
}
.me-avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #1d9bf0, #7ec8ff);
}
.me-info {
  flex: 1;
  min-width: 0;
  line-height: 1.3;
}
.me-name {
  font-size: 15px;
  font-weight: 700;
}
.me-handle {
  font-size: 13px;
  color: var(--x-text-2);
}
.me-more {
  color: var(--x-text-2);
}
.guest-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 230px;
}
.guest-btn {
  width: 100%;
  font-weight: 700;
}

/* 窄屏：只留图标 */
@media (max-width: 1100px) {
  .x-sidebar {
    width: 72px;
  }
  .sidebar-inner {
    align-items: center;
    padding: 8px 0 12px;
  }
  .nav-label,
  .me-info,
  .me-more {
    display: none;
  }
  .nav-item {
    padding: 12px;
  }
  .publish-btn {
    max-width: 52px;
    padding: 14px 0;
    font-size: 0;
  }
  .publish-btn::after {
    content: '+';
    font-size: 24px;
  }
  .guest-box {
    max-width: 52px;
  }
  .guest-btn {
    font-size: 13px !important;
    padding: 8px 0 !important;
  }
}
</style>
