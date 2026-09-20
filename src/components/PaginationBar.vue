<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 总条数 */
  total: { type: Number, default: 0 },
  /** 当前页码（从 1 开始） */
  pageNum: { type: Number, default: 1 },
  /** 每页条数 */
  pageSize: { type: Number, default: 10 },
  /** 不显示时隐藏 */
  hidden: { type: Boolean, default: false }
})

const emit = defineEmits(['change'])

const show = computed(() => !props.hidden && props.total > 0)

function onPageChange(page) {
  emit('change', { page, pageSize: props.pageSize })
}
</script>

<template>
  <div v-if="show" class="pagination-bar">
    <el-pagination
      background
      layout="prev, pager, next, jumper, total"
      :total="total"
      :current-page="pageNum"
      :page-size="pageSize"
      @current-change="onPageChange"
    />
  </div>
</template>

<style scoped>
.pagination-bar {
  display: flex;
  justify-content: center;
  padding: 20px 0 8px;
}
</style>
