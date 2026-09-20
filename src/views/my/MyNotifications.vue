<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as notificationApi from '@/api/notification'
import { READ_STATUS, NOTIFICATION_TARGET_TYPE } from '@/constants/enums'
import { useUserStore } from '@/stores/user'
import { formatTime } from '@/utils/format'
import PaginationBar from '@/components/PaginationBar.vue'
import EmptyState from '@/components/EmptyState.vue'

/**
 * 我的通知：未读红点、点击标记已读、全部已读
 */
const router = useRouter()
const userStore = useUserStore()

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const loading = ref(false)
const readingAll = ref(false)

async function loadList(pageNum = 1) {
  loading.value = true
  try {
    const data = await notificationApi.list({ pageNum, pageSize })
    list.value = data.list || []
    total.value = data.total || 0
    page.value = pageNum
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

function onPageChange({ page: p }) {
  loadList(p)
}

/** 点击通知：标记已读，若是帖子通知则跳转帖子详情 */
async function onItemClick(item) {
  if (item.isRead === READ_STATUS.UNREAD) {
    try {
      await notificationApi.read(item.id)
      item.isRead = READ_STATUS.READ
      userStore.refreshUnread()
    } catch (e) {
      /* 忽略 */
    }
  }
  // 约定值：targetType=1 表示帖子，跳转详情；其他类型不跳转（缺口清单已注明）
  if (item.targetType === NOTIFICATION_TARGET_TYPE.POST && item.targetId) {
    router.push({ name: 'postDetail', params: { id: item.targetId } })
  }
}

/** 全部已读 */
async function markAllRead() {
  if (readingAll.value) return
  readingAll.value = true
  try {
    await notificationApi.readAll()
    list.value.forEach((item) => {
      item.isRead = READ_STATUS.READ
    })
    userStore.unreadCount = 0
    ElMessage.success('已全部标记为已读')
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    readingAll.value = false
  }
}

loadList(1)
</script>

<template>
  <div class="app-card section-card">
    <div class="section-head">
      <h3 class="section-title">我的通知</h3>
      <el-button size="small" text type="primary" :loading="readingAll" @click="markAllRead">全部已读</el-button>
    </div>

    <div v-loading="loading" class="notice-body">
      <template v-if="list.length">
        <div
          v-for="item in list"
          :key="item.id"
          class="notice-item"
          :class="{ unread: item.isRead === READ_STATUS.UNREAD }"
          @click="onItemClick(item)"
        >
          <span class="notice-dot" />
          <div class="notice-content">
            <p class="notice-text">{{ item.content || '（空通知）' }}</p>
            <span class="notice-time">{{ formatTime(item.createTime) }}</span>
          </div>
          <el-icon v-if="item.targetType === NOTIFICATION_TARGET_TYPE.POST && item.targetId" class="notice-arrow">
            <ArrowRight />
          </el-icon>
        </div>
      </template>
      <EmptyState v-else-if="!loading" text="暂无通知" icon="Bell" />
      <PaginationBar :total="total" :page-num="page" :page-size="pageSize" @change="onPageChange" />
    </div>
  </div>
</template>

<style scoped>
.section-card {
  padding: 24px 28px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title {
  font-size: 17px;
}
.notice-body {
  min-height: 200px;
}
.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.notice-item:hover {
  background: #f5f8ff;
}
.notice-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  margin-top: 6px;
  flex-shrink: 0;
}
.notice-item.unread .notice-dot {
  background: #e64340;
}
.notice-content {
  flex: 1;
  min-width: 0;
}
.notice-text {
  font-size: 14px;
  color: #1f2329;
  line-height: 1.6;
}
.notice-item.unread .notice-text {
  font-weight: 600;
}
.notice-time {
  font-size: 12px;
  color: #a3a8b0;
  margin-top: 4px;
  display: block;
}
.notice-arrow {
  color: #c2c7d0;
  margin-top: 6px;
}
</style>
