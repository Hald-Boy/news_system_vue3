<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as postApi from '@/api/post'
import * as collectApi from '@/api/collect'
import { MEDIA_TYPE, MEDIA_TYPE_LABEL, REPORT_TYPE, COLLECT_TYPE } from '@/constants/enums'
import { useUserStore } from '@/stores/user'
import { useAuthGuard } from '@/utils/auth'
import { formatTime, formatCount } from '@/utils/format'
import CommentTree from '@/components/CommentTree.vue'
import ReportDialog from '@/components/ReportDialog.vue'
import EmptyState from '@/components/EmptyState.vue'

/**
 * 帖子详情页（公开可浏览）
 * 正文 + 图片轮播 + 点赞/收藏 + 评论树 + 举报；本人帖子可编辑/删除
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const requireLogin = useAuthGuard()

const post = ref(null)
const loading = ref(false)
const notFound = ref(false)

const liked = ref(false)
const collected = ref(false)
const likeLoading = ref(false)
const collectLoading = ref(false)

const reportVisible = ref(false)

const postId = computed(() => Number(route.params.id))
const isOwn = computed(() => post.value && post.value.userId === userStore.userId)
const isVideo = computed(() => post.value?.mediaType === MEDIA_TYPE.VIDEO)
const isText = computed(() => post.value?.mediaType === MEDIA_TYPE.TEXT)

const sortedImages = computed(() => {
  const imgs = post.value?.images || []
  return [...imgs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
})

async function loadDetail() {
  loading.value = true
  notFound.value = false
  try {
    post.value = await postApi.getById(postId.value)
    await loadStatus()
  } catch (e) {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

/** 登录态下加载点赞/收藏状态 */
async function loadStatus() {
  if (!userStore.token) {
    liked.value = false
    collected.value = false
    return
  }
  try {
    const [likeData, collectData] = await Promise.all([
      postApi.likeStatus(postId.value).catch(() => null),
      collectApi.status(COLLECT_TYPE.POST, postId.value).catch(() => null)
    ])
    if (likeData && typeof likeData.liked === 'boolean') liked.value = likeData.liked
    if (collectData && typeof collectData.collected === 'boolean') collected.value = collectData.collected
  } catch (e) {
    /* 忽略 */
  }
}

async function toggleLike() {
  if (!requireLogin()) return
  if (likeLoading.value) return
  likeLoading.value = true
  const prev = liked.value
  liked.value = !prev
  post.value.likeCount = Number(post.value.likeCount || 0) + (liked.value ? 1 : -1)
  try {
    const data = await postApi.like(postId.value)
    if (data) {
      if (typeof data.liked === 'boolean') liked.value = data.liked
      if (typeof data.likeCount === 'number') post.value.likeCount = data.likeCount
    }
  } catch (e) {
    liked.value = prev
    post.value.likeCount = Number(post.value.likeCount || 0) + (prev ? 1 : -1)
  } finally {
    likeLoading.value = false
  }
}

async function toggleCollect() {
  if (!requireLogin()) return
  if (collectLoading.value) return
  collectLoading.value = true
  const prev = collected.value
  const prevCount = Number(post.value.collectCount || 0)
  try {
    const data = await collectApi.toggleCollectPost(postId.value)
    if (data && typeof data.collected === 'boolean') {
      collected.value = data.collected
    } else {
      collected.value = !prev
    }
    if (data && typeof data.collectCount === 'number') {
      post.value.collectCount = data.collectCount
    } else {
      post.value.collectCount = collected.value ? prevCount + 1 : Math.max(0, prevCount - 1)
    }
    ElMessage.success(collected.value ? '收藏成功' : '已取消收藏')
  } catch (e) {
    collected.value = prev
    post.value.collectCount = prevCount
  } finally {
    collectLoading.value = false
  }
}

function goEdit() {
  router.push({ name: 'postEdit', params: { id: postId.value } })
}

async function removePost() {
  try {
    await ElMessageBox.confirm('删除后不可恢复，确定要删除这篇帖子吗？', '删除帖子', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (e) {
    return
  }
  try {
    await postApi.delPost(postId.value)
    ElMessage.success('帖子已删除')
    router.push({ name: 'home' })
  } catch (e) {
    /* 拦截器已提示 */
  }
}

function handleCommentCountChange(delta = 1) {
  if (post.value) {
    post.value.commentCount = Math.max(0, Number(post.value.commentCount || 0) + delta)
  }
}

watch(postId, () => {
  if (postId.value) loadDetail()
})

// 首次加载
if (postId.value) {
  loadDetail()
}
</script>

<template>
  <div class="page-container detail-page">
    <div v-loading="loading" class="detail-layout">
      <div class="detail-main">
        <div v-if="notFound" class="app-card">
          <EmptyState text="帖子不存在或已被删除" icon="Warning">
            <el-button type="primary" round @click="router.push({ name: 'home' })">返回首页</el-button>
          </EmptyState>
        </div>

        <article v-else-if="post" class="app-card detail-card">
          <div class="detail-head">
            <el-tag v-if="!isText" size="small" :type="isVideo ? 'danger' : 'primary'" effect="plain">
              {{ MEDIA_TYPE_LABEL[post.mediaType] }}
            </el-tag>
            <h1 class="detail-title">{{ post.title }}</h1>
            <div class="detail-meta">
              <span class="author" @click="router.push({ name: 'userProfile', params: { id: post.userId } })">
                {{ post.userName || '匿名用户' }}
              </span>
              <span class="dot">·</span>
              <span>{{ formatTime(post.createTime) }}</span>
              <span class="dot">·</span>
              <span><el-icon><View /></el-icon> {{ formatCount(post.viewCount) }} 浏览</span>
            </div>
          </div>

          <p class="detail-content rich-content">{{ post.content }}</p>

          <!-- 图片轮播 -->
          <el-carousel v-if="sortedImages.length" height="420px" class="detail-carousel" arrow="always">
            <el-carousel-item v-for="img in sortedImages" :key="img.id ?? img.imageUrl">
              <el-image
                :src="img.imageUrl"
                fit="contain"
                class="carousel-img"
                :preview-src-list="sortedImages.map((i) => i.imageUrl)"
                preview-teleported
              />
            </el-carousel-item>
          </el-carousel>
          <div v-else-if="isVideo" class="video-placeholder">
            <el-icon :size="40" color="#a3a8b0"><VideoPlay /></el-icon>
            <p>该帖子为视频内容，请在完整版中播放（当前文档未提供视频字段）</p>
          </div>

          <div class="detail-actions">
            <el-button
              :type="liked ? 'danger' : 'default'"
              round
              :loading="likeLoading"
              @click="toggleLike"
            >
              <el-icon><Pointer /></el-icon>
              <span class="btn-text">{{ liked ? '已点赞' : '点赞' }}</span>
              <span class="count-text">{{ formatCount(post.likeCount) }}</span>
            </el-button>
            <el-button
              :type="collected ? 'warning' : 'default'"
              round
              :loading="collectLoading"
              @click="toggleCollect"
            >
              <el-icon><CollectionTag /></el-icon>
              <span class="btn-text">{{ collected ? '已收藏' : '收藏' }}</span>
              <span class="count-text">{{ formatCount(post.collectCount) }}</span>
            </el-button>
            <el-button round @click="reportVisible = true">
              <el-icon><Warning /></el-icon>
              <span class="btn-text">举报</span>
            </el-button>
            <template v-if="isOwn">
              <el-button type="primary" plain round @click="goEdit">
                <el-icon><EditPen /></el-icon>
                <span class="btn-text">编辑</span>
              </el-button>
              <el-button type="danger" plain round @click="removePost">
                <el-icon><Delete /></el-icon>
                <span class="btn-text">删除</span>
              </el-button>
            </template>
          </div>
        </article>

        <!-- 评论 -->
        <div v-if="post && !notFound" class="app-card comment-card">
          <h3 class="comment-title">评论（{{ formatCount(post.commentCount) }}）</h3>
          <CommentTree :news-id="postId" @count-change="handleCommentCountChange" />
        </div>
      </div>
    </div>

    <ReportDialog
      v-model="reportVisible"
      :report-type="REPORT_TYPE.POST"
      :target-id="postId"
      :target-title="post?.title"
    />
  </div>
</template>

<style scoped>
.detail-layout {
  min-height: 300px;
}
.detail-main {
  max-width: 860px;
  margin: 0 auto;
}
.detail-card {
  padding: 28px 32px;
}
.detail-head {
  margin-bottom: 16px;
}
.detail-title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  margin: 10px 0;
}
.detail-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #a3a8b0;
  font-size: 13px;
  flex-wrap: wrap;
}
.detail-meta .author {
  color: #4f7cff;
  cursor: pointer;
  font-weight: 500;
}
.detail-content {
  font-size: 15px;
  color: #1f2329;
  margin: 16px 0 20px;
}
.detail-carousel {
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}
.carousel-img {
  width: 100%;
  height: 100%;
}
.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 220px;
  background: #fafbfc;
  border-radius: 10px;
  color: #a3a8b0;
  margin-bottom: 20px;
  font-size: 13px;
  gap: 8px;
}
.detail-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #f2f3f5;
}
.btn-text {
  margin: 0 4px;
}
.count-text {
  font-size: 12px;
  opacity: 0.75;
}
.comment-card {
  margin-top: 16px;
  padding: 20px 24px;
}
.comment-title {
  font-size: 16px;
  margin-bottom: 4px;
}
@media (max-width: 768px) {
  .detail-card {
    padding: 18px 16px;
  }
  .detail-title {
    font-size: 19px;
  }
}
</style>
