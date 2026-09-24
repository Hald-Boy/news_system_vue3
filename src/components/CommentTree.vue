<script setup>
import { computed, reactive, ref, nextTick, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as commentApi from '@/api/comment'
import * as collectApi from '@/api/collect'
import { COLLECT_TYPE, REPORT_TYPE } from '@/constants/enums'
import { useUserStore } from '@/stores/user'
import { useAuthGuard } from '@/utils/auth'
import { avatarText } from '@/utils/auth'
import { formatTime, formatCount } from '@/utils/format'
import { stateOf, countOf } from '@/utils/response'
import PaginationBar from '@/components/PaginationBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import ReportDialog from '@/components/ReportDialog.vue'

/**
 * 评论树组件
 * - 一级评论分页 + 每条一级评论下子评论懒加载分页
 * - 发评论 / 回复（parentId=0 表示一级评论，回复时传 parentId + toUserId）
 * - 评论点赞、收藏、不喜欢折叠、举报、删除（本人）
 */
const props = defineProps({
  newsId: { type: [Number, String], required: true }
})

const emit = defineEmits(['countChange'])

const userStore = useUserStore()
const requireLogin = useAuthGuard()

// ---------- 一级评论 ----------
const parents = ref([])
const parentTotal = ref(0)
const parentPage = ref(1)
const parentSize = 10
const parentLoading = ref(false)

// ---------- 子评论（按一级评论 ID 缓存） ----------
const childMap = reactive({})
/** 已展开回复的一级评论 ID 集合 */
const expandedParents = ref(new Set())
/** 已被"不喜欢"折叠的评论 ID 集合 */
const foldedIds = ref(new Set())

// ---------- 回复 ----------
const replyContent = ref('')
const replyLoading = ref(false)
const replyBoxRef = ref(null)
/** 当前回复目标：null=顶部发一级评论；{comment, isChild} 表示回复某条评论 */
const replyingTo = ref(null)

// ---------- 举报 ----------
const reportVisible = ref(false)
const reportTarget = ref(null)

const isLoggedIn = computed(() => userStore.isLoggedIn)

// newsId 变化（如路由切换）时重置并重新加载
watch(
  () => props.newsId,
  () => {
    parents.value = []
    parentTotal.value = 0
    parentPage.value = 1
    expandedParents.value = new Set()
    foldedIds.value = new Set()
    replyingTo.value = null
    replyContent.value = ''
    loadParents(1)
  }
)

onMounted(() => {
  loadParents(1)
})

async function loadParents(page = 1) {
  parentLoading.value = true
  try {
    // 登录后附带 currentUserId，后端用于返回评论的 liked 点赞状态（刷新后图标可恢复）
    const params = { id: props.newsId, pageNum: page, pageSize: parentSize }
    if (userStore.userId != null) params.currentUserId = userStore.userId
    const data = await commentApi.getAllComment(params)
    parents.value = data.list || []
    parentTotal.value = data.total || 0
    parentPage.value = page
    syncFoldedIds()
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    parentLoading.value = false
  }
}

/** 查询当前已展示评论中被"不喜欢"的 ID，用于折叠 */
async function syncFoldedIds() {
  if (!userStore.token) return
  const ids = collectLoadedCommentIds()
  if (!ids.length) return
  try {
    const list = await commentApi.getFoldedCommentIds(ids)
    if (Array.isArray(list) && list.length) {
      foldedIds.value = new Set([...foldedIds.value, ...list])
    }
  } catch (e) {
    /* 忽略 */
  }
}

function collectLoadedCommentIds() {
  const ids = parents.value.map((c) => c.id)
  Object.values(childMap).forEach((ch) => {
    ch.list.forEach((c) => ids.push(c.id))
  })
  return ids
}

/** 展开/收起某条一级评论的子评论 */
function toggleExpand(parent) {
  if (expandedParents.value.has(parent.id)) {
    expandedParents.value.delete(parent.id)
    expandedParents.value = new Set(expandedParents.value)
    return
  }
  expandedParents.value.add(parent.id)
  expandedParents.value = new Set(expandedParents.value)
  if (!childMap[parent.id]?.loaded) {
    loadChildren(parent, 1)
  }
}

async function loadChildren(parent, page = 1) {
  if (!childMap[parent.id]) {
    childMap[parent.id] = { list: [], total: 0, page: 1, size: 5, loaded: false, loading: false }
  }
  const state = childMap[parent.id]
  if (state.loading) return
  state.loading = true
  try {
    const params = {
      newsId: props.newsId,
      parentId: parent.id,
      pageNum: page,
      pageSize: state.size
    }
    if (userStore.userId != null) params.currentUserId = userStore.userId
    const data = await commentApi.getCommentChild(params)
    state.list = data.list || []
    state.total = data.total || 0
    state.page = page
    state.loaded = true
    syncFoldedIds()
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    state.loading = false
  }
}

// ---------- 回复逻辑 ----------

/** 打开回复框（comment 为空表示顶部发一级评论） */
function openReply(comment) {
  if (!requireLogin()) return
  replyingTo.value = comment ? { comment, isChild: !!comment.parentId && comment.parentId !== 0 } : null
  nextTick(() => {
    replyBoxRef.value?.focus?.()
  })
}

function cancelReply() {
  replyingTo.value = null
  replyContent.value = ''
}

/** 提交评论/回复 */
async function submitReply() {
  if (!requireLogin()) return
  const content = replyContent.value.trim()
  if (!content) {
    ElMessage.warning('请输入评论内容')
    return
  }
  if (replyLoading.value) return
  replyLoading.value = true
  const target = replyingTo.value?.comment || null
  const payload = {
    newsId: Number(props.newsId),
    content,
    parentId: target ? target.id : 0,
    toUserId: target ? target.userId : undefined,
    rootCommentId: target ? target.rootCommentId || target.id : undefined
  }
  try {
    await commentApi.add(payload)
    ElMessage.success('评论成功')
    replyContent.value = ''
    replyingTo.value = null
    if (target) {
      // 回复子评论：刷新该一级评论的回复列表
      if (target.parentId && target.parentId !== 0) {
        const rootId = target.rootCommentId || target.parentId
        const root = parents.value.find((p) => p.id === rootId)
        if (root) {
          expandedParents.value.add(rootId)
          expandedParents.value = new Set(expandedParents.value)
          loadChildren(root, 1)
        }
      } else {
        expandedParents.value.add(target.id)
        expandedParents.value = new Set(expandedParents.value)
        loadChildren(target, 1)
      }
    } else {
      // 一级评论：刷新列表
      loadParents(1)
    }
    emit('countChange', 1)
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    replyLoading.value = false
  }
}

// ---------- 评论操作 ----------

/** 评论点赞 */
async function likeComment(comment) {
  if (!requireLogin()) return
  if (comment.likeLoading) return
  comment.likeLoading = true
  const prev = comment.liked || false
  comment.liked = !prev
  comment.likeCount = Number(comment.likeCount || 0) + (comment.liked ? 1 : -1)
  try {
    const data = await commentApi.commentLike(comment.id)
    if (data) {
      const s = stateOf(data, 'isLiked')
      if (s !== undefined) comment.liked = s
      const c = countOf(data, 'likeCount')
      if (c !== undefined) comment.likeCount = c
    }
  } catch (e) {
    comment.liked = prev
    comment.likeCount = Number(comment.likeCount || 0) + (prev ? 1 : -1)
  } finally {
    comment.likeLoading = false
  }
}

/** 评论收藏 */
async function collectComment(comment) {
  if (!requireLogin()) return
  if (comment.collectLoading) return
  comment.collectLoading = true
  const prev = comment.collected || false
  try {
    const data = await collectApi.toggleCollectComment(comment.id)
    const s = stateOf(data, 'isCollected')
    comment.collected = s !== undefined ? s : !prev
    ElMessage.success(comment.collected ? '已收藏该评论' : '已取消收藏')
  } catch (e) {
    comment.collected = prev
  } finally {
    comment.collectLoading = false
  }
}

/** 不喜欢（折叠） */
async function dislikeComment(comment) {
  if (!requireLogin()) return
  if (comment.dislikeLoading) return
  comment.dislikeLoading = true
  try {
    await commentApi.dislike(comment.id)
    foldedIds.value.add(comment.id)
    foldedIds.value = new Set(foldedIds.value)
    ElMessage.success('已折叠该评论')
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    comment.dislikeLoading = false
  }
}

/** 展开被折叠的评论 */
function unfoldComment(comment) {
  foldedIds.value.delete(comment.id)
  foldedIds.value = new Set(foldedIds.value)
}

/** 删除评论（本人） */
async function removeComment(comment, isChild, parent) {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？删除后不可恢复。', '删除评论', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (e) {
    return
  }
  try {
    await commentApi.delComment(comment.id)
    ElMessage.success('评论已删除')
    if (isChild && parent) {
      const state = childMap[parent.id]
      state.list = state.list.filter((c) => c.id !== comment.id)
      state.total = Math.max(0, state.total - 1)
    } else {
      parents.value = parents.value.filter((c) => c.id !== comment.id)
      parentTotal.value = Math.max(0, parentTotal.value - 1)
    }
    emit('countChange', -1)
  } catch (e) {
    /* 拦截器已提示 */
  }
}

/** 打开举报弹窗 */
function openReport(comment) {
  if (!requireLogin()) return
  reportTarget.value = comment
  reportVisible.value = true
}

const isOwn = (comment) => comment.userId === userStore.userId
</script>

<template>
  <div class="comment-tree">
    <!-- 顶部发评论 -->
    <div class="comment-input-box">
      <div v-if="replyingTo" class="replying-tip">
        正在回复
        <span class="replying-name">@{{ replyingTo.comment.username || '用户' }}</span>
        <el-button link type="primary" size="small" @click="cancelReply">取消</el-button>
      </div>
      <el-input
        ref="replyBoxRef"
        v-model="replyContent"
        type="textarea"
        :rows="3"
        maxlength="500"
        show-word-limit
        :placeholder="isLoggedIn ? '友善评论，理性发言' : '登录后即可发表评论'"
      />
      <div class="input-actions">
        <el-button type="primary" round :loading="replyLoading" @click="submitReply">
          {{ replyingTo ? '发布回复' : '发表评论' }}
        </el-button>
      </div>
    </div>

    <!-- 一级评论列表 -->
    <div v-loading="parentLoading" class="comment-list">
      <template v-if="parents.length">
        <div v-for="comment in parents" :key="comment.id" class="comment-item parent">
          <el-avatar :size="38" :src="comment.avatar" class="comment-avatar">
            {{ avatarText(comment.username) }}
          </el-avatar>
          <div class="comment-main">
            <div class="comment-head">
              <span class="comment-user">{{ comment.username || '用户' }}</span>
              <span v-if="comment.userId === userStore.userId" class="own-tag">我</span>
            </div>

            <!-- 折叠态 -->
            <div v-if="foldedIds.has(comment.id)" class="folded-bar">
              <el-icon><View /></el-icon>
              <span>该评论已折叠（你不喜欢）</span>
              <el-button link type="primary" size="small" @click="unfoldComment(comment)">展开查看</el-button>
            </div>
            <template v-else>
              <p class="comment-content rich-content">{{ comment.content }}</p>
              <div class="comment-actions">
                <span class="icon-action" :class="{ active: comment.liked }" @click="likeComment(comment)">
                  <el-icon><Pointer /></el-icon><span>{{ formatCount(comment.likeCount) }}</span>
                </span>
                <span class="icon-action" @click="openReply(comment)">
                  <el-icon><ChatLineRound /></el-icon><span>回复</span>
                </span>
                <span class="icon-action" :class="{ active: comment.collected }" @click="collectComment(comment)">
                  <el-icon><CollectionTag /></el-icon>
                </span>
                <span class="icon-action" @click="dislikeComment(comment)">
                  <el-icon><Close /></el-icon><span>不喜欢</span>
                </span>
                <span class="icon-action" @click="openReport(comment)">
                  <el-icon><Warning /></el-icon><span>举报</span>
                </span>
                <span v-if="isOwn(comment)" class="icon-action danger" @click="removeComment(comment, false)">
                  <el-icon><Delete /></el-icon><span>删除</span>
                </span>
              </div>
              <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
            </template>

            <!-- 子评论 -->
            <div v-if="comment.children > 0 || childMap[comment.id]?.loaded" class="children-area">
              <div
                v-if="!expandedParents.has(comment.id)"
                class="expand-children"
                @click="toggleExpand(comment)"
              >
                <el-icon><ArrowDown /></el-icon>
                <span>展开 {{ comment.children }} 条回复</span>
              </div>
              <template v-else>
                <div v-loading="childMap[comment.id]?.loading" class="children-list">
                  <div v-for="child in childMap[comment.id]?.list || []" :key="child.id" class="comment-item child">
                    <el-avatar :size="30" :src="child.avatar" class="comment-avatar">
                      {{ avatarText(child.username) }}
                    </el-avatar>
                    <div class="comment-main">
                      <div class="comment-head">
                        <span class="comment-user">{{ child.username || '用户' }}</span>
                        <span v-if="child.toUserName" class="reply-to">回复 @{{ child.toUserName }}</span>
                        <span v-if="child.userId === userStore.userId" class="own-tag">我</span>
                      </div>
                      <div v-if="foldedIds.has(child.id)" class="folded-bar">
                        <el-icon><View /></el-icon>
                        <span>该评论已折叠（你不喜欢）</span>
                        <el-button link type="primary" size="small" @click="unfoldComment(child)">展开查看</el-button>
                      </div>
                      <template v-else>
                        <p class="comment-content rich-content">{{ child.content }}</p>
                        <div class="comment-actions">
                          <span class="icon-action" :class="{ active: child.liked }" @click="likeComment(child)">
                            <el-icon><Pointer /></el-icon><span>{{ formatCount(child.likeCount) }}</span>
                          </span>
                          <span class="icon-action" @click="openReply(child)">
                            <el-icon><ChatLineRound /></el-icon><span>回复</span>
                          </span>
                          <span class="icon-action" :class="{ active: child.collected }" @click="collectComment(child)">
                            <el-icon><CollectionTag /></el-icon>
                          </span>
                          <span class="icon-action" @click="dislikeComment(child)">
                            <el-icon><Close /></el-icon><span>不喜欢</span>
                          </span>
                          <span class="icon-action" @click="openReport(child)">
                            <el-icon><Warning /></el-icon><span>举报</span>
                          </span>
                          <span v-if="isOwn(child)" class="icon-action danger" @click="removeComment(child, true, comment)">
                            <el-icon><Delete /></el-icon><span>删除</span>
                          </span>
                        </div>
                        <span class="comment-time">{{ formatTime(child.createTime) }}</span>
                      </template>
                    </div>
                  </div>
                  <EmptyState v-if="!childMap[comment.id]?.loading && !childMap[comment.id]?.list?.length" text="暂无回复" />
                  <PaginationBar
                    v-if="childMap[comment.id]?.total > childMap[comment.id]?.size"
                    :total="childMap[comment.id]?.total || 0"
                    :page-num="childMap[comment.id]?.page || 1"
                    :page-size="childMap[comment.id]?.size || 5"
                    @change="({ page }) => loadChildren(comment, page)"
                  />
                </div>
                <div class="collapse-children" @click="toggleExpand(comment)">
                  <el-icon><ArrowUp /></el-icon>
                  <span>收起回复</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>

      <EmptyState v-else-if="!parentLoading" text="还没有评论，来抢沙发吧" />

      <PaginationBar
        v-if="parentTotal > parentSize"
        :total="parentTotal"
        :page-num="parentPage"
        :page-size="parentSize"
        @change="({ page }) => loadParents(page)"
      />
    </div>

    <!-- 举报弹窗 -->
    <ReportDialog
      v-model="reportVisible"
      :report-type="REPORT_TYPE.COMMENT"
      :target-id="reportTarget?.id"
      :target-title="reportTarget?.content"
    />
  </div>
</template>

<style scoped>
.comment-tree {
  margin-top: 8px;
}
.comment-input-box {
  margin-bottom: 20px;
}
.replying-tip {
  font-size: 13px;
  color: #4f7cff;
  margin-bottom: 6px;
}
.replying-name {
  font-weight: 600;
}
.input-actions {
  margin-top: 8px;
  text-align: right;
}
.comment-list {
  min-height: 120px;
}
.comment-item {
  display: flex;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #f2f3f5;
}
.comment-item:last-child {
  border-bottom: none;
}
.comment-item.child {
  border-bottom: 1px dashed #f2f3f5;
  padding: 10px 0;
}
.comment-avatar {
  background: linear-gradient(135deg, #4f7cff, #7aa2ff);
  flex-shrink: 0;
}
.comment-main {
  flex: 1;
  min-width: 0;
}
.comment-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.comment-user {
  font-weight: 600;
  font-size: 14px;
  color: #1f2329;
}
.reply-to {
  color: #4f7cff;
  font-size: 13px;
}
.own-tag {
  font-size: 11px;
  color: #4f7cff;
  background: #eef4ff;
  border-radius: 4px;
  padding: 1px 6px;
}
.comment-content {
  font-size: 14px;
  color: #1f2329;
}
.comment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  font-size: 13px;
}
.comment-actions .icon-action {
  font-size: 12px;
}
.comment-actions .danger:hover {
  color: #e64340;
}
.comment-time {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  color: #a3a8b0;
}
.folded-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f6f8;
  border-radius: 8px;
  padding: 8px 12px;
  color: #8a9099;
  font-size: 13px;
}
.children-area {
  margin-top: 10px;
  background: #fafbfc;
  border-radius: 10px;
  padding: 6px 12px;
}
.expand-children,
.collapse-children {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #4f7cff;
  font-size: 13px;
  cursor: pointer;
  padding: 8px 0;
}
.children-list {
  min-height: 60px;
}
</style>
