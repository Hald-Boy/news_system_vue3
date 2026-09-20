<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { avatarText } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.isAdmin)
const user = computed(() => userStore.userInfo || {})

function goHome() {
  router.push({ name: 'home' })
}

function goPublish() {
  if (!userStore.token) {
    ElMessage.warning('请先登录后再发布帖子')
    router.push({ name: 'login', query: { redirect: '/post/edit' } })
    return
  }
  router.push({ name: 'postCreate' })
}

function goNotifications() {
  if (!userStore.token) return
  router.push({ name: 'myNotifications' })
}

function goMyProfile() {
  router.push({ name: 'userProfile', params: { id: userStore.userId } })
}

function goMyHome() {
  router.push({ name: 'myProfile' })
}

/** 用户下拉菜单命令 */
function handleCommand(cmd) {
  if (cmd === 'profile') {
    goMyProfile()
  } else if (cmd === 'my') {
    goMyHome()
  } else if (cmd === 'admin') {
    router.push({ name: 'adminUsers' })
  } else if (cmd === 'logout') {
    handleLogout()
  }
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
  <header class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <div class="logo" @click="goHome">
          <el-icon :size="22"><Connection /></el-icon>
          <span class="logo-text">世界社区</span>
        </div>
        <nav class="nav">
          <router-link to="/" class="nav-item" :class="{ active: route.name === 'home' }">首页</router-link>
          <router-link v-if="isLoggedIn" to="/post/edit" class="nav-item">发布</router-link>
          <router-link
            v-if="isAdmin"
            to="/admin/users"
            class="nav-item"
            :class="{ active: route.path.startsWith('/admin') }"
          >
            管理后台
          </router-link>
        </nav>
      </div>

      <div class="header-right">
        <el-button v-if="!isLoggedIn" text class="header-btn" @click="router.push({ name: 'login' })">登录</el-button>
        <el-button v-if="!isLoggedIn" type="primary" size="small" round @click="router.push({ name: 'register' })">
          注册
        </el-button>

        <template v-if="isLoggedIn">
          <el-button type="primary" size="small" round @click="goPublish">发布帖子</el-button>
          <el-badge :value="userStore.unreadCount" :hidden="userStore.unreadCount === 0" :max="99" class="notice-badge">
            <el-icon :size="20" class="notice-icon" @click="goNotifications"><Bell /></el-icon>
          </el-badge>

          <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd)">
            <div class="user-entry">
              <el-avatar :size="30" :src="user.avatar" class="header-avatar">
                {{ avatarText(user.username) }}
              </el-avatar>
              <span class="user-name ellipsis">{{ user.username || '未设置昵称' }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人主页</el-dropdown-item>
                <el-dropdown-item command="my">我的</el-dropdown-item>
                <el-dropdown-item v-if="isAdmin" divided command="admin">管理后台</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
  box-shadow: 0 1px 6px rgba(31, 35, 41, 0.04);
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 28px;
  min-width: 0;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #4f7cff;
}
.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1f2329;
}
.nav {
  display: flex;
  align-items: center;
  gap: 6px;
}
.nav-item {
  padding: 6px 12px;
  border-radius: 8px;
  color: #4e5969;
  font-size: 14px;
  transition: all 0.2s;
}
.nav-item:hover {
  color: #4f7cff;
  background: #f2f6ff;
}
.nav-item.active {
  color: #4f7cff;
  font-weight: 600;
  background: #f2f6ff;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.notice-badge {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.notice-icon {
  color: #4e5969;
}
.notice-icon:hover {
  color: #4f7cff;
}
.user-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  max-width: 180px;
}
.header-avatar {
  background: linear-gradient(135deg, #4f7cff, #7aa2ff);
}
.user-name {
  font-size: 14px;
  color: #1f2329;
  max-width: 110px;
}
</style>
