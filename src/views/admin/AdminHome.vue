<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

/**
 * 管理后台布局：左侧菜单 + 右侧内容（仅 role=1 可见，路由守卫控制）
 */
const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => (route.path.startsWith('/admin/reports') ? '/admin/reports' : '/admin/users'))

function onSelect(path) {
  router.push(path)
}
</script>

<template>
  <div class="page-container admin-page">
    <div class="admin-layout">
      <aside class="admin-aside app-card">
        <h3 class="admin-logo"><el-icon><Setting /></el-icon> 管理后台</h3>
        <el-menu :default-active="activeMenu" class="admin-menu" @select="onSelect">
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon><span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/reports">
            <el-icon><Warning /></el-icon><span>举报审核</span>
          </el-menu-item>
        </el-menu>
      </aside>
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  max-width: 1200px;
  margin: 0 auto;
}
.admin-aside {
  width: 200px;
  flex-shrink: 0;
  padding: 16px 10px;
  position: sticky;
  top: 76px;
}
.admin-logo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  padding: 8px 12px 14px;
  border-bottom: 1px solid #f2f3f5;
  margin-bottom: 8px;
  color: #1f2329;
}
.admin-menu {
  border-right: none;
}
.admin-menu :deep(.el-menu-item) {
  border-radius: 8px;
  margin-bottom: 2px;
  height: 44px;
}
.admin-content {
  flex: 1;
  min-width: 0;
}
@media (max-width: 900px) {
  .admin-layout {
    flex-direction: column;
  }
  .admin-aside {
    width: 100%;
    position: static;
  }
  .admin-menu {
    display: flex;
  }
  .admin-menu .el-menu-item {
    flex: 1;
  }
}
</style>
