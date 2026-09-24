<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as userApi from '@/api/user'
import * as followApi from '@/api/follow'
import { useUserStore } from '@/stores/user'
import { useAuthGuard } from '@/utils/auth'
import { avatarText } from '@/utils/auth'
import { formatDate } from '@/utils/format'
import { stateOf } from '@/utils/response'
import PostCard from '@/components/PostCard.vue'
import UserCard from '@/components/UserCard.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import EmptyState from '@/components/EmptyState.vue'

/**
 * 个人主页：信息卡片 + 关注/取关 + 作品/关注/粉丝三个 Tab（均分页）
 */
const route = useRoute()
const userStore = useUserStore()
const requireLogin = useAuthGuard()

const userId = computed(() => Number(route.params.id))

const profile = ref(null)
const loading = ref(false)
const followLoading = ref(false)
const following = ref(false)
const mutual = ref(false)

const activeTab = ref('posts')

// 作品列表
const posts = ref([])
const postsTotal = ref(0)
const postsPage = ref(1)
const postsLoading = ref(false)

// 关注/粉丝列表
const userList = ref([])
const userTotal = ref(0)
const userPage = ref(1)
const userLoading = ref(false)
const pageSize = 10

const isSelf = computed(() => userStore.userId === userId.value)

async function loadProfile() {
  loading.value = true
  try {
    const data = await userApi.profile(userId.value)
    profile.value = data.userInfo
    following.value = !!data.isFollowing
    mutual.value = !!data.isMutual
  } catch (e) {
    profile.value = null
  } finally {
    loading.value = false
  }
}

async function loadPosts(page = 1) {
  postsLoading.value = true
  try {
    const data = await userApi.posts(userId.value, { pageNum: page, pageSize })
    posts.value = data.list || []
    postsTotal.value = data.total || 0
    postsPage.value = page
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    postsLoading.value = false
  }
}

async function loadUsers(page = 1) {
  userLoading.value = true
  try {
    const api = activeTab.value === 'following' ? followApi.following : followApi.fans
    const data = await api(userId.value, { pageNum: page, pageSize })
    userList.value = data.list || []
    userTotal.value = data.total || 0
    userPage.value = page
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    userLoading.value = false
  }
}

function onTabChange() {
  if (activeTab.value === 'posts') {
    loadPosts(1)
  } else {
    loadUsers(1)
  }
}

function onListPageChange({ page }) {
  if (activeTab.value === 'posts') {
    loadPosts(page)
  } else {
    loadUsers(page)
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function toggleFollow() {
  if (!requireLogin()) return
  if (followLoading.value) return
  followLoading.value = true
  const prev = following.value
  following.value = !prev
  try {
    const data = await followApi.follow(userId.value)
    const s = stateOf(data, 'isFollowing')
    if (s !== undefined) following.value = s
    const m = stateOf(data, 'isMutual')
    if (m !== undefined) mutual.value = m
    // 同步刷新粉丝数
    if (profile.value) {
      profile.value.fanCount = Math.max(0, Number(profile.value.fanCount || 0) + (following.value ? 1 : -1))
    }
    ElMessage.success(following.value ? '关注成功' : '已取消关注')
  } catch (e) {
    following.value = prev
  } finally {
    followLoading.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    activeTab.value = 'posts'
    loadProfile()
    loadPosts(1)
  }
)

// 首次加载
loadProfile()
loadPosts(1)
</script>

<template>
  <div class="page-container profile-page">
    <div v-loading="loading" class="profile-main">
      <template v-if="profile">
        <!-- 信息卡片 -->
        <div class="profile-card app-card">
          <div class="cover" :style="profile.cover ? { backgroundImage: `url(${profile.cover})` } : {}">
            <el-icon v-if="!profile.cover" :size="40" color="rgba(255,255,255,0.6)"><Picture /></el-icon>
          </div>
          <div class="profile-body">
            <el-avatar :size="84" :src="profile.avatar" class="profile-avatar">
              {{ avatarText(profile.username) }}
            </el-avatar>
            <div class="profile-info">
              <div class="profile-name-row">
                <span class="profile-name">{{ profile.username || '未设置昵称' }}</span>
                <el-tag v-if="profile.role === 1" size="small" type="warning" effect="plain">管理员</el-tag>
              </div>
              <p class="profile-bio">{{ profile.bio || '这个人很懒，什么都没有写' }}</p>
              <div class="profile-extra">
                <span v-if="profile.location"><el-icon><Location /></el-icon>{{ profile.location }}</span>
                <span v-if="profile.birthday"><el-icon><Calendar /></el-icon>{{ formatDate(profile.birthday) }}</span>
              </div>
              <div class="profile-stats">
                <div class="stat"><b>{{ profile.totalLikeCount || 0 }}</b><span>获赞</span></div>
                <div class="stat"><b>{{ profile.followCount || 0 }}</b><span>关注</span></div>
                <div class="stat"><b>{{ profile.fanCount || 0 }}</b><span>粉丝</span></div>
              </div>
            </div>
            <div class="profile-actions">
              <el-button
                v-if="!isSelf"
                :type="following ? 'default' : 'primary'"
                round
                size="large"
                :loading="followLoading"
                @click="toggleFollow"
              >
                {{ mutual ? '互相关注' : following ? '已关注' : '+ 关注' }}
              </el-button>
              <el-button v-else type="primary" plain round size="large" @click="$router.push({ name: 'myProfile' })">
                编辑资料
              </el-button>
            </div>
          </div>
        </div>

        <!-- Tab：作品 / 关注 / 粉丝 -->
        <div class="app-card tabs-card">
          <el-tabs v-model="activeTab" @tab-change="onTabChange">
            <el-tab-pane :label="`作品 ${profile.postCount ?? ''}`" name="posts" />
            <el-tab-pane label="关注" name="following" />
            <el-tab-pane label="粉丝" name="fans" />
          </el-tabs>

          <div v-loading="activeTab === 'posts' ? postsLoading : userLoading">
            <template v-if="activeTab === 'posts'">
              <PostCard v-for="post in posts" :key="post.id" :post="post" />
              <EmptyState v-if="!postsLoading && !posts.length" text="还没有发布过作品" />
              <PaginationBar :total="postsTotal" :page-num="postsPage" :page-size="pageSize" @change="onListPageChange" />
            </template>
            <template v-else>
              <UserCard v-for="card in userList" :key="card.userInfo.id" :card="card" />
              <EmptyState v-if="!userLoading && !userList.length" :text="activeTab === 'following' ? '还没有关注任何人' : '还没有粉丝'" />
              <PaginationBar :total="userTotal" :page-num="userPage" :page-size="pageSize" @change="onListPageChange" />
            </template>
          </div>
        </div>
      </template>

      <EmptyState v-else-if="!loading" text="用户不存在或已被注销" icon="User">
        <el-button type="primary" round @click="$router.push({ name: 'home' })">返回首页</el-button>
      </EmptyState>
    </div>
  </div>
</template>

<style scoped>
.profile-main {
  max-width: 900px;
  margin: 0 auto;
}
.profile-card {
  padding: 0;
  overflow: hidden;
  margin-bottom: 16px;
}
.cover {
  height: 160px;
  background: linear-gradient(135deg, #4f7cff, #7aa2ff);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-body {
  padding: 0 24px 24px;
  position: relative;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.profile-avatar {
  margin-top: -42px;
  border: 4px solid #fff;
  background: linear-gradient(135deg, #4f7cff, #7aa2ff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.profile-info {
  flex: 1;
  min-width: 260px;
}
.profile-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.profile-name {
  font-size: 20px;
  font-weight: 700;
}
.profile-bio {
  color: #6b7280;
  font-size: 13px;
  margin-top: 6px;
}
.profile-extra {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  color: #8a9099;
  font-size: 12px;
  margin-top: 8px;
  align-items: center;
}
.profile-extra span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.profile-stats {
  display: flex;
  gap: 28px;
  margin-top: 12px;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat b {
  font-size: 17px;
  color: #1f2329;
}
.stat span {
  font-size: 12px;
  color: #8a9099;
  margin-top: 2px;
}
.profile-actions {
  align-self: flex-end;
  margin-left: auto;
}
.tabs-card {
  padding: 8px 24px 20px;
}
</style>
