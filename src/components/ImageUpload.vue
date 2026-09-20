<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

/**
 * 多图上传组件（支持拖拽排序、删除、预览）
 * 图片不立即上传，由父组件在提交时统一组装 FormData
 * 条目结构：{ file?: File, url?: string, id?: number, sortOrder?: number }
 * - 新增图片：file 为本地文件，url 为本地预览地址
 * - 已有图片（编辑场景）：id 为后端图片 ID，url 为线上地址
 */
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  /** 最大图片数量 */
  limit: { type: Number, default: 9 },
  /** 允许的图片格式 */
  accept: { type: String, default: 'image/jpeg,image/png,image/gif,image/webp' },
  /** 单张大小上限（MB） */
  maxSizeMb: { type: Number, default: 10 }
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)
const dragIndex = ref(null)

const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']

function emitList(list) {
  emit('update:modelValue', list)
}

/** 选择文件后追加到列表 */
function onFileChange(e) {
  const files = Array.from(e.target.files || [])
  const list = [...props.modelValue]
  for (const file of files) {
    if (list.length >= props.limit) {
      ElMessage.warning(`最多上传 ${props.limit} 张图片`)
      break
    }
    if (!imageTypes.includes(file.type)) {
      ElMessage.warning(`不支持的图片格式：${file.name}`)
      continue
    }
    if (file.size > props.maxSizeMb * 1024 * 1024) {
      ElMessage.warning(`图片 ${file.name} 超过 ${props.maxSizeMb}MB 限制`)
      continue
    }
    list.push({ file, url: URL.createObjectURL(file) })
  }
  emitList(list)
  if (inputRef.value) inputRef.value.value = ''
}

function chooseFile() {
  if (props.modelValue.length >= props.limit) {
    ElMessage.warning(`最多上传 ${props.limit} 张图片`)
    return
  }
  inputRef.value?.click()
}

/** 删除指定项 */
function removeItem(index) {
  const list = [...props.modelValue]
  const item = list.splice(index, 1)[0]
  if (item?.file && item.url?.startsWith('blob:')) {
    URL.revokeObjectURL(item.url)
  }
  emitList(list)
}

/* 拖拽排序：仅拖拽本地新增图片与已有图片统一重排 */
function onDragStart(index) {
  dragIndex.value = index
}
function onDragOver(e) {
  e.preventDefault()
}
function onDrop(targetIndex) {
  const from = dragIndex.value
  dragIndex.value = null
  if (from === null || from === targetIndex) return
  const list = [...props.modelValue]
  const [moved] = list.splice(from, 1)
  list.splice(targetIndex, 0, moved)
  emitList(list)
}
</script>

<template>
  <div class="image-upload">
    <div
      v-for="(item, index) in modelValue"
      :key="item.file ? item.file.name + index : item.id ?? index"
      class="upload-item"
      draggable="true"
      @dragstart="onDragStart(index)"
      @dragover="onDragOver"
      @drop="onDrop(index)"
    >
      <el-image :src="item.url" fit="cover" class="upload-img" :preview-src-list="[item.url]" preview-teleported />
      <div class="item-mask">
        <el-icon class="drag-icon" :size="18"><Rank /></el-icon>
        <el-icon class="del-icon" :size="18" @click.stop="removeItem(index)"><Delete /></el-icon>
      </div>
      <span class="order-badge">{{ index + 1 }}</span>
    </div>

    <div v-if="modelValue.length < limit" class="upload-trigger" @click="chooseFile">
      <el-icon :size="26"><Plus /></el-icon>
      <span>添加图片</span>
    </div>

    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      multiple
      class="file-input"
      @change="onFileChange"
    />
    <div class="upload-tip">支持 jpg / png / gif / webp，单张不超过 {{ maxSizeMb }}MB，共最多 {{ limit }} 张；拖动图片可调整顺序</div>
  </div>
</template>

<style scoped>
.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.upload-item {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid #ebedf0;
  cursor: grab;
}
.upload-item:active {
  cursor: grabbing;
}
.upload-img {
  width: 100%;
  height: 100%;
  display: block;
}
.item-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  transition: opacity 0.2s;
  color: #fff;
}
.upload-item:hover .item-mask {
  opacity: 1;
}
.drag-icon,
.del-icon {
  cursor: pointer;
}
.order-badge {
  position: absolute;
  left: 4px;
  top: 4px;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-trigger {
  width: 120px;
  height: 120px;
  border: 1.5px dashed #c9cdd4;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #8a9099;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafbfc;
}
.upload-trigger:hover {
  border-color: #4f7cff;
  color: #4f7cff;
  background: #f5f8ff;
}
.file-input {
  display: none;
}
.upload-tip {
  width: 100%;
  font-size: 12px;
  color: #a3a8b0;
}
</style>
