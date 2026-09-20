<script setup>
defineProps({
  text: { type: String, default: '暂无内容' },
  icon: { type: String, default: 'FolderOpened' }
})
</script>

<template>
  <div class="empty-state">
    <el-icon :size="48" class="empty-icon"><component :is="icon" /></el-icon>
    <p class="empty-text">{{ text }}</p>
    <div v-if="$slots.default" class="empty-action">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: #c2c7d0;
}
.empty-icon {
  color: #dfe3ea;
}
.empty-text {
  margin-top: 12px;
  font-size: 14px;
  color: #a3a8b0;
}
.empty-action {
  margin-top: 12px;
}
</style>
