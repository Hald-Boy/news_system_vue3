<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import * as adminApi from '@/api/admin'
import { REPORT_STATUS, REPORT_STATUS_LABEL, REPORT_TYPE_LABEL, REPORT_ACTION } from '@/constants/enums'
import { formatDateTime } from '@/utils/format'
import PaginationBar from '@/components/PaginationBar.vue'
import EmptyState from '@/components/EmptyState.vue'

/**
 * 管理后台-举报审核：按状态筛选，待审核可 通过/驳回 并填备注
 */
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const loading = ref(false)

const filters = reactive({
  status: REPORT_STATUS.PENDING
})

const handleVisible = ref(false)
const handleTarget = ref(null)
const handleAction = ref(REPORT_ACTION.APPROVE)
const handleRemark = ref('')
const handling = ref(false)

async function loadList(pageNum = 1) {
  loading.value = true
  try {
    const data = await adminApi.reports({ status: filters.status, pageNum, pageSize })
    list.value = data.list || []
    total.value = data.total || 0
    page.value = pageNum
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

function onStatusChange() {
  loadList(1)
}

function onPageChange({ page: p }) {
  loadList(p)
}

function openHandle(report, action) {
  handleTarget.value = report
  handleAction.value = action
  handleRemark.value = ''
  handleVisible.value = true
}

async function confirmHandle() {
  if (!handleTarget.value) return
  if (handling.value) return
  handling.value = true
  try {
    await adminApi.handleReport(handleTarget.value.reportId, handleAction.value, handleRemark.value.trim())
    ElMessage.success(handleAction.value === REPORT_ACTION.APPROVE ? '已通过该举报' : '已驳回该举报')
    handleVisible.value = false
    loadList(page.value)
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    handling.value = false
  }
}

loadList(1)
</script>

<template>
  <div class="app-card section-card">
    <div class="section-head">
      <h3 class="section-title">举报审核</h3>
      <el-radio-group v-model="filters.status" @change="onStatusChange">
        <el-radio-button :value="REPORT_STATUS.PENDING">待审核</el-radio-button>
        <el-radio-button :value="REPORT_STATUS.APPROVED">已通过</el-radio-button>
        <el-radio-button :value="REPORT_STATUS.REJECTED">已驳回</el-radio-button>
      </el-radio-group>
    </div>

    <div v-loading="loading">
      <template v-if="list.length">
        <div v-for="report in list" :key="report.reportId" class="report-item">
          <div class="report-main">
            <div class="report-head">
              <el-tag size="small" type="warning" effect="plain">{{ REPORT_TYPE_LABEL[report.reportType] }}举报</el-tag>
              <el-tag
                size="small"
                :type="report.status === REPORT_STATUS.PENDING ? 'primary' : report.status === REPORT_STATUS.APPROVED ? 'success' : 'info'"
                effect="plain"
              >
                {{ REPORT_STATUS_LABEL[report.status] }}
              </el-tag>
              <span class="report-time">{{ formatDateTime(report.createTime) }}</span>
            </div>
            <p class="report-target">
              <span class="target-label">被举报{{ REPORT_TYPE_LABEL[report.reportType] }}：</span>
              <span class="target-title">{{ report.targetTitle || '（无标题）' }}</span>
            </p>
            <p class="report-content rich-content">{{ report.targetContent || '（无内容）' }}</p>
            <div class="report-meta">
              <span>举报人：<b>{{ report.reporterName || '未知' }}</b></span>
              <span>被举报人：<b>{{ report.targetUserName || '未知' }}</b></span>
              <span v-if="report.reasonType">原因：<b>{{ report.reasonType }}</b></span>
              <span v-if="report.remark">备注：<b>{{ report.remark }}</b></span>
            </div>
          </div>
          <div v-if="report.status === REPORT_STATUS.PENDING" class="report-actions">
            <el-button type="success" plain size="small" @click="openHandle(report, REPORT_ACTION.APPROVE)">通过</el-button>
            <el-button type="danger" plain size="small" @click="openHandle(report, REPORT_ACTION.REJECT)">驳回</el-button>
          </div>
          <span v-else class="handled-tag">已处理</span>
        </div>
      </template>
      <EmptyState v-else-if="!loading" :text="filters.status === REPORT_STATUS.PENDING ? '暂无待审核的举报' : '该状态下暂无举报'" icon="Warning" />
    </div>

    <PaginationBar :total="total" :page-num="page" :page-size="pageSize" @change="onPageChange" />
  </div>

  <!-- 处理举报弹窗 -->
  <el-dialog
    v-model="handleVisible"
    :title="handleAction === REPORT_ACTION.APPROVE ? '通过举报' : '驳回举报'"
    width="460px"
    :close-on-click-modal="false"
  >
    <p class="dialog-tip">
      处理：<span class="dialog-target">{{ handleTarget?.targetTitle || '#' + handleTarget?.targetId }}</span>
    </p>
    <el-input
      v-model="handleRemark"
      type="textarea"
      :rows="3"
      maxlength="200"
      show-word-limit
      :placeholder="handleAction === REPORT_ACTION.APPROVE ? '填写处理备注（可选），如处理方式' : '填写驳回理由（可选），将反馈给举报人'"
    />
    <template #footer>
      <el-button @click="handleVisible = false">取消</el-button>
      <el-button
        :type="handleAction === REPORT_ACTION.APPROVE ? 'success' : 'danger'"
        :loading="handling"
        @click="confirmHandle"
      >
        {{ handleAction === REPORT_ACTION.APPROVE ? '确认通过' : '确认驳回' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.section-card {
  padding: 20px 24px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.section-title {
  font-size: 17px;
}
.report-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border: 1px solid #f2f3f5;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #fafbfc;
}
.report-main {
  flex: 1;
  min-width: 0;
}
.report-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.report-time {
  margin-left: auto;
  font-size: 12px;
  color: #a3a8b0;
}
.report-target {
  margin-top: 8px;
  font-size: 14px;
  color: #1f2329;
}
.target-label {
  color: #8a9099;
  font-size: 13px;
}
.target-title {
  font-weight: 600;
}
.report-content {
  font-size: 13px;
  color: #6b7280;
  margin-top: 6px;
  background: #fff;
  border-radius: 8px;
  padding: 10px 12px;
}
.report-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-size: 12px;
  color: #8a9099;
}
.report-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.handled-tag {
  flex-shrink: 0;
  color: #a3a8b0;
  font-size: 13px;
  margin-top: 4px;
}
.dialog-tip {
  margin-bottom: 12px;
  color: #6b7280;
  font-size: 13px;
}
.dialog-target {
  color: #1f2329;
  font-weight: 500;
}
</style>
