<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as postApi from '@/api/post'
import { useUserStore } from '@/stores/user'
import PostCard from '@/components/PostCard.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { avatarText } from '@/utils/auth'

/**
 * 首页：X 风格信息流
 * 顶部发稿框 + tabs + 帖子流；搜索关键词来自右栏搜索框（route.query.keyword）
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const loading = ref(false)
const searchText = ref('')

const activeTab = ref('forYou')

const excludedIds = ref(new Set())

async function loadList(page = 1) {
  loading.value = true
  try {
    const data = await postApi.pageQuery({
      title: searchText.value || undefined,
      pageNum: page,
      pageSize
    })
    const filtered = (data.list || []).filter((p) => !excludedIds.value.has(p.id))
    list.value = filtered
    total.value = data.total || 0
    pageNum.value = page
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

function handlePageChange({ page }) {
  loadList(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleDisinterest(postId) {
  excludedIds.value.add(postId)
  excludedIds.value = new Set(excludedIds.value)
  list.value = list.value.filter((p) => p.id !== postId)
  total.value = Math.max(0, total.value - 1)
}

async function loadDisinterestIds() {
  if (!userStore.token) return
  try {
    const ids = await postApi.disinterestIds()
    if (Array.isArray(ids) && ids.length) {
      excludedIds.value = new Set(ids)
      list.value = list.value.filter((p) => !excludedIds.value.has(p.id))
    }
  } catch (e) {
    /* 忽略 */
  }
}

/** 右栏搜索 → query.keyword 联动 */
watch(
  () => route.query.keyword,
  (kw) => {
    searchText.value = (kw || '').trim()
    loadList(1)
  }
)

function openComposer() {
  if (!userStore.token) {
    router.push({ name: 'login', query: { redirect: '/post/edit' } })
    return
  }
  router.push({ name: 'postCreate' })
}

onMounted(() => {
  searchText.value = (route.query.keyword || '').trim()
  loadList(1)
  loadDisinterestIds()
})
</script>

<template>
  <div class="home-feed">
    <!-- tabs -->
    <div class="feed-tabs">
      <div class="feed-tab clickable" :class="{ active: activeTab === 'forYou' }" @click="activeTab = 'forYou'">
        为你推荐
      </div>
      <div class="feed-tab clickable" :class="{ active: activeTab === 'following' }" @click="activeTab = 'following'">
        正在关注
      </div>
    </div>

    <!-- 发稿框 -->
    <div class="composer">
      <el-avatar :size="40" :src="userStore.userInfo?.avatar" class="composer-avatar">
        {{ avatarText(userStore.userInfo?.username) }}
      </el-avatar>
      <div class="composer-body">
        <div class="composer-input clickable" @click="openComposer">有什么新鲜事？</div>
        <div class="composer-footer">
          <button class="composer-post-btn" @click="openComposer">发布</button>
        </div>
      </div>
    </div>

    <!-- 帖子流 -->
    <div v-loading="loading" class="feed-list">
      <PostCard
        v-for="post in list"
        :key="post.id"
        :post="post"
        show-disinterest
        @disinterest="handleDisinterest"
      />
      <EmptyState v-if="!loading && !list.length" :text="searchText ? '没有找到相关帖子' : '还没有帖子'" icon="Document" />
    </div>

    <div class="feed-pager">
      <PaginationBar :total="total" :page-num="pageNum" :page-size="pageSize" @change="handlePageChange" />
    </div>
  </div>
</template>

<style scoped>
.home-feed {
  min-height: 100vh;
}
.feed-tabs {
  display: flex;
  position: sticky;
  top: 57px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  z-index: 40;
  border-bottom: 1px solid var(--x-border);
}
.feed-tab {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  font-size: 15px;
  color: var(--x-text-2);
  font-weight: 500;
  position: relative;
}
.feed-tab:hover {
  background: var(--x-hover);
}
.feed-tab.active {
  color: var(--x-text);
  font-weight: 700;
}
.feed-tab.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 56px;
  height: 4px;
  border-radius: 999px;
  background: var(--x-blue);
}
.composer {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--x-border);
}
.composer-avatar {
  background: linear-gradient(135deg, #1d9bf0, #7ec8ff);
}
.composer-body {
  flex: 1;
}
.composer-input {
  font-size: 18px;
  color: var(--x-text-2);
  padding: 8px 0 14px;
}
.composer-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--x-border);
  padding-top: 10px;
}
.composer-post-btn {
  border: none;
  border-radius: 999px;
  background: var(--x-black);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 8px 24px;
  cursor: pointer;
}
.composer-post-btn:hover {
  background: rgba(15, 20, 25, 0.9);
}
.feed-pager {
  padding: 20px 16px 60px;
}
</style>
