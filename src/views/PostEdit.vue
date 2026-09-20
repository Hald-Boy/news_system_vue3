<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as postApi from '@/api/post'
import ImageUpload from '@/components/ImageUpload.vue'

/**
 * 发布/编辑帖子页
 * - multipart/form-data 提交：news 为 JSON 字符串，newImages 为文件
 * - 编辑时：keepMediaList 保留旧图（含新 sortOrder），newMediaSortList 新图顺序，走 URL query
 */
const route = useRoute()
const router = useRouter()

const editId = computed(() => (route.name === 'postEdit' ? Number(route.params.id) : null))

const form = reactive({
  title: '',
  content: ''
})

/** 图片列表条目：{ file?, url?, id?, sortOrder? } */
const images = ref([])
const loading = ref(false)
const submitting = ref(false)

const isEdit = computed(() => editId.value != null)

async function loadForEdit() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const post = await postApi.getById(editId.value)
    form.title = post.title || ''
    form.content = post.content || ''
    const imgs = post.images || []
    images.value = imgs
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((img) => ({
        id: img.id,
        url: img.imageUrl,
        sortOrder: img.sortOrder
      }))
  } catch (e) {
    router.push({ name: 'home' })
  } finally {
    loading.value = false
  }
}

onMounted(loadForEdit)

// 编辑模式下路由参数变化（如从详情页切换）时重新加载
watch(editId, loadForEdit)

function validate() {
  if (!form.title.trim()) {
    ElMessage.warning('请输入标题')
    return false
  }
  if (form.title.trim().length > 100) {
    ElMessage.warning('标题不能超过 100 字')
    return false
  }
  if (!form.content.trim()) {
    ElMessage.warning('请输入正文内容')
    return false
  }
  return true
}

function buildFormData() {
  const fd = new FormData()
  // news 字段传 JSON 字符串
  const news = { title: form.title.trim(), content: form.content.trim() }
  if (isEdit.value) news.id = editId.value
  fd.append('news', JSON.stringify(news))
  // newImages：新增图片文件
  images.value.forEach((item) => {
    if (item.file) {
      fd.append('newImages', item.file, item.file.name)
    }
  })
  return fd
}

async function submit() {
  if (!validate()) return
  if (submitting.value) return
  submitting.value = true
  try {
    if (isEdit.value) {
      // 保留的旧图（含新排序） + 新图排序
      const oldItems = images.value.filter((i) => i.id != null)
      const newItems = images.value.filter((i) => i.file)
      const keepMediaList = oldItems.map((item, idx) => ({ id: item.id, sortOrder: idx + 1 }))
      const newMediaSortList = newItems.map((_, idx) => idx + 1)
      const fd = buildFormData()
      await postApi.update(editId.value, fd, {
        keepMediaList: JSON.stringify(keepMediaList),
        newMediaSortList: JSON.stringify(newMediaSortList)
      })
      ElMessage.success('帖子已更新')
      router.push({ name: 'postDetail', params: { id: editId.value } })
    } else {
      await postApi.addNews(buildFormData())
      ElMessage.success('发布成功')
      router.push({ name: 'home' })
    }
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-container edit-page">
    <div v-loading="loading" class="edit-card app-card">
      <h2 class="edit-title">{{ isEdit ? '编辑帖子' : '发布帖子' }}</h2>

      <el-form label-position="top">
        <el-form-item label="标题">
          <el-input v-model="form.title" maxlength="100" show-word-limit placeholder="请填写标题（最多 100 字）" size="large" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            maxlength="5000"
            show-word-limit
            placeholder="分享你的想法、见闻或经验……"
          />
        </el-form-item>
        <el-form-item label="配图（可选，支持拖拽排序）">
          <ImageUpload v-model="images" :limit="9" />
        </el-form-item>
      </el-form>

      <div class="edit-actions">
        <el-button size="large" @click="router.back()">取消</el-button>
        <el-button type="primary" size="large" :loading="submitting" @click="submit">
          {{ isEdit ? '保存修改' : '发布' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-page {
  max-width: 860px;
}
.edit-card {
  padding: 28px 32px;
}
.edit-title {
  font-size: 20px;
  margin-bottom: 20px;
}
.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
@media (max-width: 768px) {
  .edit-card {
    padding: 18px 16px;
  }
}
</style>
