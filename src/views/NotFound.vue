<script setup>
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
</script>

<template>
  <div class="page-container not-found">
    <div class="app-card">
      <EmptyState text="页面不存在或已被删除" icon="Warning">
        <el-button type="primary" round @click="router.push({ name: 'home' })">返回首页</el-button>
      </EmptyState>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  max-width: 560px;
}
</style>
