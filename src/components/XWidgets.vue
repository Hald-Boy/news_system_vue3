<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * X 风格右侧边栏：搜索框 + 趋势/推荐关注占位
 * 未完成功能先占位，后续接真实接口
 */
const router = useRouter()
const keyword = ref('')

function onSearch() {
  const q = keyword.value.trim()
  router.push({ name: 'home', query: q ? { keyword: q } : {} })
}

/** 趋势占位数据（架构占位，后续替换为热门接口） */
const trends = [
  { tag: '社区热点 · 占位', topic: '今天你发了什么？' },
  { tag: '社区热点 · 占位', topic: '今日话题：新学期打卡' },
  { tag: '社区热点 · 占位', topic: '热门讨论：毕业之后' },
]
</script>

<template>
  <aside class="x-right">
    <div class="right-inner">
      <!-- 搜索框 -->
      <div class="search-box">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="搜索社区帖子"
          @keyup.enter="onSearch"
        />
      </div>

      <!-- 趋势占位卡 -->
      <div class="widget-card">
        <h3 class="widget-title">有什么新鲜事</h3>
        <div v-for="(t, i) in trends" :key="i" class="trend-row clickable">
          <div class="trend-tag">{{ t.tag }}</div>
          <div class="trend-topic">{{ t.topic }}</div>
          <el-icon class="trend-more"><MoreFilled /></el-icon>
        </div>
        <div class="widget-more clickable">显示更多</div>
      </div>

      <!-- 推荐关注占位卡 -->
      <div class="widget-card">
        <h3 class="widget-title">推荐关注</h3>
        <div class="trend-row clickable recommend-row">
          <el-avatar :size="40" class="rec-avatar">社</el-avatar>
          <div class="rec-info">
            <div class="rec-name ellipsis">世界社区官方</div>
            <div class="rec-handle ellipsis">@world_community</div>
          </div>
          <button class="follow-btn">关注</button>
        </div>
        <div class="widget-more clickable">显示更多</div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.x-right {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 350px;
  flex-shrink: 0;
  padding: 0 24px;
  overflow-y: auto;
}
.right-inner {
  padding-top: 8px;
}
.search-box {
  position: relative;
  margin-bottom: 16px;
}
.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--x-text-2);
  font-size: 16px;
  z-index: 1;
}
.search-input {
  width: 100%;
  height: 44px;
  border: none;
  outline: none;
  border-radius: 999px;
  background: var(--x-bg-subtle);
  padding: 0 16px 0 46px;
  font-size: 15px;
  color: var(--x-text);
}
.search-input:focus {
  background: #fff;
  box-shadow: 0 0 0 2px var(--x-blue);
}
.search-input::placeholder {
  color: var(--x-text-2);
}
.widget-card {
  background: var(--x-bg-subtle);
  border-radius: 16px;
  padding: 8px 0;
  margin-bottom: 16px;
}
.widget-title {
  font-size: 19px;
  font-weight: 800;
  padding: 12px 16px;
}
.trend-row {
  position: relative;
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.trend-row:hover {
  background: rgba(15, 20, 25, 0.03);
}
.trend-tag {
  font-size: 13px;
  color: var(--x-text-2);
}
.trend-topic {
  font-size: 15px;
  font-weight: 700;
}
.trend-more {
  position: absolute;
  right: 12px;
  top: 12px;
  color: var(--x-text-2);
}
.widget-more {
  padding: 14px 16px;
  color: var(--x-blue);
  font-size: 15px;
}
.recommend-row {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}
.rec-avatar {
  background: linear-gradient(135deg, #1d9bf0, #7ec8ff);
  color: #fff;
  font-weight: 700;
}
.rec-info {
  flex: 1;
  min-width: 0;
  line-height: 1.3;
}
.rec-name {
  font-size: 15px;
  font-weight: 700;
}
.rec-handle {
  font-size: 13px;
  color: var(--x-text-2);
}
.follow-btn {
  border: none;
  border-radius: 999px;
  background: var(--x-black);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  padding: 7px 18px;
  cursor: pointer;
}
</style>
