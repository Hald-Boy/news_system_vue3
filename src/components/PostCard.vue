<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as postApi from '@/api/post'
import * as collectApi from '@/api/collect'
import { MEDIA_TYPE } from '@/constants/enums'
import { useAuthGuard } from '@/utils/auth'
import { formatTime, formatCount } from '@/utils/format'
import { stateOf, countOf } from '@/utils/response'
import { avatarText } from '@/utils/auth'

const props = defineProps({
  /** 帖子对象：News 或 PostCardVO */
  post: { type: Object, required: true },
  mediaType: { type: Number, default: null },
  showDisinterest: { type: Boolean, default: false },
  showCollect: { type: Boolean, default: true }
})

const emit = defineEmits(['disinterest', 'updated'])

const router = useRouter()
const requireLogin = useAuthGuard()

const liked = ref(false)
const collected = ref(false)
const likeLoading = ref(false)
const collectLoading = ref(false)
const disinterestLoading = ref(false)

const coverUrl = computed(
  () => props.post.cover || props.post.coverImageUrl || props.post.images?.[0]?.imageUrl || ''
)

const resolvedMediaType = computed(() => {
  if (props.mediaType != null) return props.mediaType
  if (props.post.mediaType != null) return props.post.mediaType
  return coverUrl.value ? MEDIA_TYPE.IMAGE : MEDIA_TYPE.TEXT
})

const isText = computed(() => resolvedMediaType.value === MEDIA_TYPE.TEXT)

const likeCount = ref(Number(props.post.likeCount) || 0)
const collectCount = ref(Number(props.post.collectCount) || 0)
const commentCount = computed(() => Number(props.post.commentCount) || 0)

watch(
  () => props.post,
  (p) => {
    liked.value = !!p.liked
    collected.value = !!p.collected
    likeCount.value = Number(p.likeCount) || 0
    collectCount.value = Number(p.collectCount) || 0
  },
  { immediate: true, deep: true }
)

const avatarUrl = computed(() => props.post.userAvatar || props.post.avatar || '')

function goDetail() {
  router.push({ name: 'postDetail', params: { id: props.post.id } })
}

async function toggleLike() {
  if (!requireLogin()) return
  if (likeLoading.value) return
  likeLoading.value = true
  const prev = liked.value
  liked.value = !prev
  likeCount.value += liked.value ? 1 : -1
  try {
    const data = await postApi.like(props.post.id)
    if (data) {
      const s = stateOf(data, 'isLiked')
      if (typeof s === 'boolean') liked.value = s
      const c = countOf(data, 'likeCount')
      if (typeof c === 'number') likeCount.value = c
    }
    emit('updated', { liked: liked.value, likeCount: likeCount.value })
  } catch (e) {
    liked.value = prev
    likeCount.value += prev ? 1 : -1
  } finally {
    likeLoading.value = false
  }
}

async function toggleCollect() {
  if (!requireLogin()) return
  if (collectLoading.value) return
  collectLoading.value = true
  const prev = collected.value
  const prevCount = collectCount.value
  try {
    const data = await collectApi.toggleCollectPost(props.post.id)
    const s = stateOf(data, 'isCollected')
    collected.value = typeof s === 'boolean' ? s : !prev
    const c = countOf(data, 'collectCount')
    if (typeof c === 'number') {
      collectCount.value = c
    } else {
      collectCount.value = collected.value ? prevCount + 1 : Math.max(0, prevCount - 1)
    }
    emit('updated', { collected: collected.value, collectCount: collectCount.value })
    ElMessage.success(collected.value ? '收藏成功' : '已取消收藏')
  } catch (e) {
    collected.value = prev
    collectCount.value = prevCount
  } finally {
    collectLoading.value = false
  }
}

async function markDisinterest() {
  if (!requireLogin()) return
  if (disinterestLoading.value) return
  disinterestLoading.value = true
  try {
    await postApi.disinterest(props.post.id)
    ElMessage.success('已标记不感兴趣')
    emit('disinterest', props.post.id)
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    disinterestLoading.value = false
  }
}
</script>

<template>
  <article class="tweet clickable" @click="goDetail">
    <el-avatar :size="40" :src="avatarUrl" class="tweet-avatar">
      {{ avatarText(post.userName) }}
    </el-avatar>

    <div class="tweet-body">
      <!-- 作者行 -->
      <div class="tweet-author-row">
        <span class="author-name ellipsis">{{ post.userName || '匿名用户' }}</span>
        <span v-if="post.userAccount" class="author-handle ellipsis">@{{ post.userAccount }}</span>
        <span class="tweet-time">· {{ formatTime(post.createTime) }}</span>
      </div>

      <!-- 标题 + 正文 -->
      <h3 class="tweet-title ellipsis-2">{{ post.title || '无标题' }}</h3>
      <p v-if="post.content" class="tweet-content ellipsis-2 rich-content">{{ post.content }}</p>

      <!-- 封面媒体（纯文字不显示） -->
      <div v-if="!isText && coverUrl" class="tweet-media" @click.stop="goDetail">
        <el-image
          :src="coverUrl"
          fit="cover"
          class="media-img"
          :preview-src-list="[coverUrl]"
          preview-teleported
        />
      </div>

      <!-- 操作行 -->
      <div class="tweet-actions" @click.stop>
        <span class="icon-action" @click="goDetail">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ formatCount(commentCount) }}</span>
        </span>
        <span class="icon-action" :class="{ active: liked }" @click="toggleLike">
          <el-icon><Pointer /></el-icon>
          <span>{{ formatCount(likeCount) }}</span>
        </span>
        <span v-if="showCollect" class="icon-action collect" :class="{ active: collected }" @click="toggleCollect">
          <el-icon><CollectionTag /></el-icon>
          <span>{{ formatCount(collectCount) }}</span>
        </span>
        <span v-if="showDisinterest" class="icon-action" title="不感兴趣" @click="markDisinterest">
          <el-icon><CircleClose /></el-icon>
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.tweet {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--x-border);
}
.tweet:hover {
  background: rgba(15, 20, 25, 0.02);
}
.tweet-avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #1d9bf0, #7ec8ff);
}
.tweet-body {
  flex: 1;
  min-width: 0;
}
.tweet-author-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15px;
}
.author-name {
  font-weight: 700;
  max-width: 160px;
}
.author-handle {
  color: var(--x-text-2);
  max-width: 120px;
}
.tweet-time {
  color: var(--x-text-2);
}
.tweet-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  margin-top: 2px;
}
.tweet-content {
  font-size: 15px;
  color: var(--x-text);
  margin-top: 2px;
}
.tweet-media {
  margin-top: 8px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--x-border);
}
.media-img {
  width: 100%;
  max-height: 300px;
  display: block;
}
.tweet-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 420px;
  margin-top: 8px;
}
/* 收藏激活：X 绿 */
.tweet-actions .icon-action.collect.active {
  color: var(--x-green);
}
.tweet-actions .icon-action.collect.active:hover {
  color: var(--x-green);
  background: rgba(0, 186, 124, 0.1);
}
</style>
