<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as collectApi from '@/api/collect'
import PostCard from '@/components/PostCard.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatTime, formatCount } from '@/utils/format'

/**
 * 我的收藏：帖子 / 评论 两个 Tab
 */
const router = useRouter()
const activeTab = ref('posts')
const pageSize = 10

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)

async function loadList(pageNum = 1) {
  loading.value = true
  try {
    const api = activeTab.value === 'posts' ? collectApi.minePosts : collectApi.mineComments
    const data = await api({ pageNum, pageSize })
    list.value = data.list || []
    total.value = data.total || 0
    page.value = pageNum
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  loadList(1)
}

function onPageChange({ page: p }) {
  loadList(p)
}

/** 取消收藏帖子（从列表中移除） */
async function cancelCollectPost(post) {
  try {
    await collectApi.toggleCollectPost(post.id)
    ElMessage.success('已取消收藏')
    list.value = list.value.filter((p) => p.id !== post.id)
    total.value = Math.max(0, total.value - 1)
  } catch (e) {
    /* 拦截器已提示 */
  }
}

/** 取消收藏评论（从列表中移除） */
async function cancelCollectComment(comment) {
  try {
    await collectApi.toggleCollectComment(comment.id)
    ElMessage.success('已取消收藏')
    list.value = list.value.filter((c) => c.id !== comment.id)
    total.value = Math.max(0, total.value - 1)
  } catch (e) {
    /* 拦截器已提示 */
  }
}

// 首次加载
loadList(1)
</script>

<template>
  <div class="app-card section-card">
    <h3 class="section-title">我的收藏</h3>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane :label="`帖子`" name="posts" />
      <el-tab-pane label="评论" name="comments" />
    </el-tabs>

    <div v-loading="loading" class="collect-body">
      <!-- 帖子 Tab -->
      <template v-if="activeTab === 'posts'">
        <div v-for="post in list" :key="post.id" class="post-wrap">
          <PostCard :post="post" :show-collect="false" />
          <div class="post-extra">
            <el-button link type="danger" size="small" @click="cancelCollectPost(post)">
              <el-icon><Delete /></el-icon> 取消收藏
            </el-button>
          </div>
        </div>
        <EmptyState v-if="!loading && !list.length" text="还没有收藏任何帖子" icon="Collection">
          <el-button type="primary" round @click="router.push({ name: 'home' })">去逛逛</el-button>
        </EmptyState>
        <PaginationBar :total="total" :page-num="page" :page-size="pageSize" @change="onPageChange" />
      </template>

      <!-- 评论 Tab -->
      <template v-else>
        <div v-for="comment in list" :key="comment.id" class="comment-card">
          <div class="comment-body">
            <p class="comment-content rich-content">{{ comment.content }}</p>
            <div class="comment-meta">
              <span class="post-title-link" @click="router.push({ name: 'postDetail', params: { id: comment.newsId } })">
                <el-icon><Link /></el-icon> 来自：《{{ comment.postTitle || '帖子' }}》
              </span>
              <span class="dot">·</span>
              <span><el-icon><Pointer /></el-icon> {{ formatCount(comment.likeCount) }}</span>
              <span class="dot">·</span>
              <span>{{ formatTime(comment.createTime) }}</span>
            </div>
          </div>
          <el-button link type="danger" size="small" class="cancel-btn" @click="cancelCollectComment(comment)">
            <el-icon><Delete /></el-icon> 取消收藏
          </el-button>
        </div>
        <EmptyState v-if="!loading && !list.length" text="还没有收藏任何评论" icon="Collection" />
        <PaginationBar :total="total" :page-num="page" :page-size="pageSize" @change="onPageChange" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.section-card {
  padding: 24px 28px;
}
.section-title {
  font-size: 17px;
  margin-bottom: 12px;
}
.collect-body {
  min-height: 200px;
}
.post-wrap {
  position: relative;
}
.post-wrap .post-card {
  margin-bottom: 0;
}
.post-extra {
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid #f2f3f5;
  padding-bottom: 8px;
  margin-bottom: 10px;
}
.comment-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fafbfc;
  margin-bottom: 10px;
}
.comment-body {
  flex: 1;
  min-width: 0;
}
.comment-content {
  font-size: 14px;
  color: #1f2329;
}
.comment-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #8a9099;
  flex-wrap: wrap;
}
.comment-meta span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.post-title-link {
  color: #4f7cff;
  cursor: pointer;
}
.cancel-btn {
  flex-shrink: 0;
}
</style>
