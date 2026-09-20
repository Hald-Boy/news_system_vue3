<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as adminApi from '@/api/admin'
import { ROLE, ROLE_LABEL } from '@/constants/enums'
import { formatDateTime } from '@/utils/format'
import PaginationBar from '@/components/PaginationBar.vue'
import EmptyState from '@/components/EmptyState.vue'

/**
 * 管理后台-用户管理：搜索（用户名）/角色筛选/分页/修改角色
 */
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const loading = ref(false)

const filters = reactive({
  username: '',
  role: ''
})

async function loadList(pageNum = 1) {
  loading.value = true
  try {
    const params = {
      page: pageNum,
      pageSize,
      username: filters.username.trim() || undefined,
      role: filters.role === '' ? undefined : filters.role
    }
    const data = await adminApi.getAllUsers(params)
    list.value = data.list || []
    total.value = data.total || 0
    page.value = pageNum
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  loadList(1)
}

function resetSearch() {
  filters.username = ''
  filters.role = ''
  loadList(1)
}

function onPageChange({ page: p }) {
  loadList(p)
}

/** 修改用户角色 */
async function changeRole(user) {
  const action = user.role === ROLE.ADMIN ? '普通用户' : '管理员'
  try {
    await ElMessageBox.confirm(
      `确定将「${user.username || user.userAccount || user.phone}」的角色改为「${action}」吗？`,
      '修改角色',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch (e) {
    return
  }
  const newRole = user.role === ROLE.ADMIN ? ROLE.USER : ROLE.ADMIN
  try {
    await adminApi.updateUser({ id: user.id, role: newRole })
    ElMessage.success('角色已更新')
    loadList(page.value)
  } catch (e) {
    /* 拦截器已提示 */
  }
}

loadList(1)
</script>

<template>
  <div class="app-card section-card">
    <div class="section-head">
      <h3 class="section-title">用户管理</h3>
      <div class="filter-bar">
        <el-input
          v-model="filters.username"
          placeholder="按用户名搜索"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filters.role" placeholder="全部角色" style="width: 130px" clearable @change="handleSearch">
          <el-option label="普通用户" :value="ROLE.USER" />
          <el-option label="管理员" :value="ROLE.ADMIN" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="用户" min-width="160">
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="28" :src="row.avatar" class="cell-avatar">
              {{ (row.username || '客').charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="user-cell-info">
              <span class="cell-name">{{ row.username || '未设置昵称' }}</span>
              <span class="cell-account">{{ row.userAccount || row.phone || '' }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column label="角色" width="110">
        <template #default="{ row }">
          <el-tag :type="row.role === ROLE.ADMIN ? 'warning' : 'info'" effect="plain">
            {{ ROLE_LABEL[row.role] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="150">
        <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="changeRole(row)">
            {{ row.role === ROLE.ADMIN ? '设为普通用户' : '设为管理员' }}
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <EmptyState text="没有匹配的用户" icon="User" />
      </template>
    </el-table>

    <PaginationBar :total="total" :page-num="page" :page-size="pageSize" @change="onPageChange" />
  </div>
</template>

<style scoped>
.section-card {
  padding: 20px 24px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.section-title {
  font-size: 17px;
}
.filter-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cell-avatar {
  background: linear-gradient(135deg, #4f7cff, #7aa2ff);
  flex-shrink: 0;
}
.user-cell-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.cell-name {
  font-weight: 500;
  color: #1f2329;
}
.cell-account {
  font-size: 12px;
  color: #a3a8b0;
}
</style>
