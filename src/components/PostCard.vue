<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as postApi from '@/api/post'
import * as collectApi from '@/api/collect'
import { MEDIA_TYPE, MEDIA_TYPE_LABEL } from '@/constants/enums'
import { useAuthGuard } from '@/utils/auth'
import { formatTime, formatCount } from '@/utils/format'

const props = defineProps({
  /** 帖子对象：News（首页）或 PostCardVO（收藏/作品列表），兼容两者字段 */
  post: { type: Object, required: true },
  /** 内容类型（可选）：News 自带 mediaType；PostCardVO 无该字段时按 cover 推断 */
  mediaType: { type: Number, default: null },
  /** 是否显示"不感兴趣"按钮 */
  showDisinterest: { type: Boolean, default: false },
  /** 是否显示收藏按钮 */
  showCollect: { type: Boolean, default: true }
})

const emit = defineEmits(['disinterest', 'updated'])

const router = useRouter()
const requireLogin = useAuthGuard()

// 点赞/收藏状态（列表接口不返回当前用户状态，点击后由本组件维护）
const liked = ref(false)
const collected = ref(false)
const likeLoading = ref(false)
const collectLoading = ref(false)
const disinterestLoading = ref(false)

const coverUrl = computed(() => props.post.cover || props.post.coverImageUrl || props.post.images?.[0]?.imageUrl || '')

const resolvedMediaType = computed(() => {
  if (props.mediaType != null) return props.mediaType
  if (props.post.mediaType != null) return props.post.mediaType
  // PostCardVO 无 mediaType：有封面视为图文，无封面视为纯文字
  return coverUrl.value ? MEDIA_TYPE.IMAGE : MEDIA_TYPE.TEXT
})

const isText = computed(() => resolvedMediaType.value === MEDIA_TYPE.TEXT)
const isVideo = computed(() => resolvedMediaType.value === MEDIA_TYPE.VIDEO)

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

function goDetail() {
  router.push({ name: 'postDetail', params: { id: props.post.id } })
}

/** 点赞/取消点赞（乐观更新，失败回滚） */
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
      if (typeof data.liked === 'boolean') liked.value = data.liked
      if (typeof data.likeCount === 'number') likeCount.value = data.likeCount
    }
    emit('updated', { liked: liked.value, likeCount: likeCount.value })
  } catch (e) {
    liked.value = prev
    likeCount.value = prev ? likeCount.value + 1 : Math.max(0, likeCount.value - 1)
  } finally {
    likeLoading.value = false
  }
}

/** 收藏/取消收藏 */
async function toggleCollect() {
  if (!requireLogin()) return
  if (collectLoading.value) return
  collectLoading.value = true
  const prev = collected.value
  const prevCount = collectCount.value
  try {
    const data = await collectApi.toggleCollectPost(props.post.id)
    if (data && typeof data.collected === 'boolean') {
      collected.value = data.collected
    } else {
      collected.value = !prev
    }
    if (data && typeof data.collectCount === 'number') {
      collectCount.value = data.collectCount
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

/** 标记不感兴趣 */
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
  <div class="post-card clickable" @click="goDetail">
    <div class="card-body">
      <div class="card-info">
        <div class="card-title-row">
          <el-tag v-if="!isText" size="small" :type="isVideo ? 'danger' : 'primary'" effect="plain" class="type-tag">
            {{ MEDIA_TYPE_LABEL[resolvedMediaType] }}
          </el-tag>
          <h3 class="card-title ellipsis-2">{{ post.title || '无标题' }}</h3>
        </div>
        <p v-if="post.content" class="card-summary ellipsis-2">{{ post.content }}</p>
        <div class="card-meta">
          <span class="author">{{ post.userName || '匿名用户' }}</span>
          <span class="dot">·</span>
          <span>{{ formatTime(post.createTime) }}</span>
        </div>
        <div class="card-actions" @click.stop>
          <span class="icon-action" :class="{ active: liked }" @click="toggleLike">
            <el-icon><Pointer /></el-icon>
            <span>{{ formatCount(likeCount) }}</span>
          </span>
          <span class="icon-action" @click="goDetail">
            <el-icon><ChatDotRound /></el-icon>
            <span>{{ formatCount(commentCount) }}</span>
          </span>
          <span v-if="showCollect" class="icon-action" :class="{ active: collected }" @click="toggleCollect">
            <el-icon><CollectionTag /></el-icon>
            <span>{{ formatCount(collectCount) }}</span>
          </span>
          <span v-if="showDisinterest" class="icon-action disinterest" title="不感兴趣" @click="markDisinterest">
            <el-icon><Hide /></el-icon>
          </span>
        </div>
      </div>
      <div v-if="!isText && coverUrl" class="card-cover" @click.stop="goDetail">
        <el-image :src="coverUrl" fit="cover" class="cover-img" :preview-src-list="[coverUrl]" preview-teleported />
        <div v-if="isVideo" class="video-mask">
          <el-icon :size="26" color="#fff"><VideoPlay /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(31, 35, 41, 0.05);
  transition: box-shadow 0.2s, transform 0.2s;
}
.post-card:hover {
  box-shadow: 0 4px 16px rgba(31, 35, 41, 0.1);
}
.card-body {
  display: flex;
  gap: 16px;
}
.card-info {
  flex: 1;
  min-width: 0;
}
.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.type-tag {
  flex-shrink: 0;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
  line-height: 1.4;
}
.card-title:hover {
  color: #4f7cff;
}
.card-summary {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 10px;
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #a3a8b0;
  font-size: 13px;
  margin-bottom: 10px;
}
.card-meta .author {
  color: #4e5969;
  font-weight: 500;
}
.card-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 13px;
}
.disinterest {
  margin-left: auto;
}
.card-cover {
  width: 168px;
  height: 104px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}
.cover-img {
  width: 100%;
  height: 100%;
  display: block;
}
.video-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (max-width: 768px) {
  .card-cover {
    width: 112px;
    height: 76px;
  }
}
</style>
