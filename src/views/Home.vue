<script setup>
import { ref, onMounted } from 'vue'
import * as postApi from '@/api/post'
import { useUserStore } from '@/stores/user'
import PostCard from '@/components/PostCard.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import EmptyState from '@/components/EmptyState.vue'

/**
 * 首页：帖子信息流（分页加载 + 标题搜索）
 * 支持卡片点赞/收藏/不感兴趣；未登录可浏览，操作用引导登录
 */
const userStore = useUserStore()

const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const loading = ref(false)
const keyword = ref('')
const searchText = ref('')

/** 已"不感兴趣"的帖子 ID（本地过滤） */
const excludedIds = ref(new Set())

async function loadList(page = 1) {
  loading.value = true
  try {
    const data = await postApi.pageQuery({
      title: searchText.value || undefined,
      pageNum: page,
      pageSize
    })
    // 过滤掉不感兴趣的帖子
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

function handleSearch() {
  searchText.value = keyword.value.trim()
  loadList(1)
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

onMounted(() => {
  loadList(1)
  loadDisinterestIds()
})
</script>

<template>
  <div class="page-container home-page">
    <div class="home-layout">
      <div class="feed">
        <!-- 搜索栏 -->
        <div class="search-bar app-card">
          <el-input
            v-model="keyword"
            placeholder="搜索你感兴趣的帖子标题"
            clearable
            size="large"
            class="search-input"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>

        <div v-loading="loading" class="feed-list">
          <PostCard
            v-for="post in list"
            :key="post.id"
            :post="post"
            show-disinterest
            @disinterest="handleDisinterest"
          />
          <EmptyState v-if="!loading && !list.length" text="暂无帖子" icon="Document">
            <el-button type="primary" round @click="$router.push({ name: 'postCreate' })">发布第一篇帖子</el-button>
          </EmptyState>
        </div>

        <PaginationBar :total="total" :page-num="pageNum" :page-size="pageSize" @change="handlePageChange" />
      </div>

      <!-- 侧边栏（桌面端） -->
      <aside class="side">
        <div class="app-card side-card">
          <h4 class="side-title">关于世界社区</h4>
          <p class="side-text">
            一个自由、友善的内容分享社区。在这里记录你的思考，与志同道合的人交流。
          </p>
          <el-button v-if="!userStore.isLoggedIn" type="primary" round style="width: 100%" @click="$router.push({ name: 'register' })">
            加入社区
          </el-button>
          <el-button v-else type="primary" round style="width: 100%" @click="$router.push({ name: 'postCreate' })">
            发布帖子
          </el-button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.home-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.feed {
  flex: 1;
  min-width: 0;
}
.side {
  width: 280px;
  flex-shrink: 0;
}
.search-bar {
  padding: 12px;
  margin-bottom: 14px;
}
.search-input :deep(.el-input-group__append) {
  padding: 0;
}
.feed-list {
  min-height: 300px;
}
.side-card {
  padding: 20px;
  position: sticky;
  top: 76px;
}
.side-title {
  font-size: 15px;
  margin-bottom: 10px;
  color: #1f2329;
}
.side-text {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.7;
  margin-bottom: 14px;
}
@media (max-width: 992px) {
  .side {
    display: none;
  }
}
</style>
