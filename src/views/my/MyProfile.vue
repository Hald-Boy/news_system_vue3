<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import * as userApi from '@/api/user'
import { useUserStore } from '@/stores/user'

/**
 * 编辑个人资料（昵称/头像/背景/简介/生日/所在地）
 * 说明：接口文档未提供独立图片上传接口，头像/背景以图片 URL 填写（缺口清单中已注明）
 */
const userStore = useUserStore()

const form = reactive({
  id: userStore.userId,
  username: userStore.userInfo?.username || '',
  avatar: userStore.userInfo?.avatar || '',
  cover: userStore.userInfo?.cover || '',
  bio: userStore.userInfo?.bio || '',
  location: userStore.userInfo?.location || '',
  birthday: userStore.userInfo?.birthday || ''
})

const saving = ref(false)

function submit() {
  if (!form.username.trim()) {
    ElMessage.warning('昵称不能为空')
    return
  }
  saving.value = true
  // 用户可能清空头像/背景：空字符串同样提交
  const payload = {
    id: form.id,
    username: form.username.trim(),
    avatar: form.avatar.trim(),
    cover: form.cover.trim(),
    bio: form.bio.trim(),
    location: form.location.trim(),
    birthday: form.birthday || null
  }
  userApi
    .updateProfile(payload)
    .then((info) => {
      userStore.setUserInfo(info || payload)
      ElMessage.success('资料已更新')
    })
    .catch(() => {
      /* 拦截器已提示 */
    })
    .finally(() => {
      saving.value = false
    })
}
</script>

<template>
  <div class="app-card section-card">
    <h3 class="section-title">个人资料</h3>
    <el-form label-width="90px" class="profile-form">
      <el-form-item label="昵称">
        <el-input v-model="form.username" maxlength="20" show-word-limit placeholder="给自己起个好记的昵称" />
      </el-form-item>
      <el-form-item label="头像 URL">
        <el-input v-model="form.avatar" placeholder="填写图片 URL，例如 https://.../avatar.png" clearable>
          <template #append>
            <el-avatar :size="26" :src="form.avatar || undefined" class="preview-avatar">
              {{ (form.username || '客').charAt(0).toUpperCase() }}
            </el-avatar>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="背景 URL">
        <el-input v-model="form.cover" placeholder="填写背景图 URL（用于个人主页头图）" clearable />
      </el-form-item>
      <el-form-item label="简介">
        <el-input
          v-model="form.bio"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="一句话介绍自己"
        />
      </el-form-item>
      <el-form-item label="生日">
        <el-date-picker
          v-model="form.birthday"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择生日"
          style="width: 220px"
        />
      </el-form-item>
      <el-form-item label="所在地">
        <el-input v-model="form.location" maxlength="30" placeholder="例如：广东东莞" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="submit">保存修改</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.section-card {
  padding: 24px 28px;
}
.section-title {
  font-size: 17px;
  margin-bottom: 20px;
}
.profile-form {
  max-width: 560px;
}
.preview-avatar {
  background: linear-gradient(135deg, #4f7cff, #7aa2ff);
}
</style>
