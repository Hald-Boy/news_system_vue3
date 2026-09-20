<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as followApi from '@/api/follow'
import { useUserStore } from '@/stores/user'
import { useAuthGuard } from '@/utils/auth'
import { avatarText } from '@/utils/auth'

const props = defineProps({
  /** UserCardVO：{ userInfo, isFollowing, isMutual } */
  card: { type: Object, required: true }
})

const emit = defineEmits(['updated'])

const router = useRouter()
const userStore = useUserStore()
const requireLogin = useAuthGuard()

const loading = ref(false)
const following = ref(!!props.card.isFollowing)
const mutual = ref(!!props.card.isMutual)

const isSelf = () => userStore.userId === props.card.userInfo?.id

function goProfile() {
  router.push({ name: 'userProfile', params: { id: props.card.userInfo.id } })
}

async function toggleFollow() {
  if (!requireLogin()) return
  if (loading.value) return
  if (isSelf()) return
  loading.value = true
  const prev = following.value
  following.value = !prev
  try {
    const data = await followApi.follow(props.card.userInfo.id)
    if (data && typeof data.following === 'boolean') {
      following.value = data.following
    }
    if (data && typeof data.mutual === 'boolean') {
      mutual.value = data.mutual
    }
    emit('updated', { following: following.value })
  } catch (e) {
    following.value = prev
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="user-card">
    <div class="user-main clickable" @click="goProfile">
      <el-avatar :size="46" :src="card.userInfo?.avatar" class="user-avatar">
        {{ avatarText(card.userInfo?.username) }}
      </el-avatar>
      <div class="user-info">
        <div class="name-row">
          <span class="name">{{ card.userInfo?.username || '未设置昵称' }}</span>
          <el-tag v-if="mutual" size="small" type="success" effect="plain">互相关注</el-tag>
        </div>
        <p class="bio ellipsis">{{ card.userInfo?.bio || '这个人很懒，什么都没写' }}</p>
      </div>
    </div>
    <el-button
      v-if="!isSelf()"
      :type="following ? 'default' : 'primary'"
      size="small"
      round
      :loading="loading"
      @click="toggleFollow"
    >
      {{ following ? '已关注' : '+ 关注' }}
    </el-button>
    <el-tag v-else size="small" type="info" effect="plain">我</el-tag>
  </div>
</template>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(31, 35, 41, 0.05);
}
.user-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}
.user-avatar {
  background: linear-gradient(135deg, #4f7cff, #7aa2ff);
  flex-shrink: 0;
}
.user-info {
  min-width: 0;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.name {
  font-weight: 600;
  color: #1f2329;
}
.bio {
  font-size: 13px;
  color: #8a9099;
  margin-top: 2px;
}
</style>
