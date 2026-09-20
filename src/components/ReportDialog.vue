<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as reportApi from '@/api/report'
import { REPORT_TYPE, REASON_TYPE_OPTIONS } from '@/constants/enums'
import { useAuthGuard } from '@/utils/auth'

/**
 * 通用举报弹窗
 * 支持举报帖子（reportType=1）与评论（reportType=2）
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 举报类型：REPORT_TYPE.POST / REPORT_TYPE.COMMENT */
  reportType: { type: Number, required: true },
  /** 被举报目标 ID（弹窗打开前可为空） */
  targetId: { type: [Number, String], default: '' },
  /** 目标标题（弹窗内展示） */
  targetTitle: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const requireLogin = useAuthGuard()

const form = ref({
  reasonType: '',
  remark: ''
})
const submitting = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      form.value = { reasonType: '', remark: '' }
    }
  }
)

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  if (!requireLogin()) return
  if (!props.targetId) {
    ElMessage.warning('缺少举报目标，请重试')
    return
  }
  if (!form.value.reasonType) {
    ElMessage.warning('请选择举报原因')
    return
  }
  submitting.value = true
  try {
    await reportApi.submit({
      reportType: props.reportType,
      targetId: Number(props.targetId),
      reasonType: form.value.reasonType,
      remark: form.value.remark?.trim()
    })
    ElMessage.success('举报已提交，感谢你的反馈')
    emit('submitted')
    close()
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="举报"
    width="480px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="target-tip">
      举报对象：<span class="target-title">{{ targetTitle || `#${targetId}` }}</span>
    </p>
    <el-form label-position="top">
      <el-form-item label="举报原因（必选）">
        <el-select v-model="form.reasonType" placeholder="请选择举报原因" style="width: 100%">
          <el-option v-for="opt in REASON_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="补充说明（可选）">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="请描述举报的具体内容，便于管理员核实"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">提交举报</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.target-tip {
  margin-bottom: 12px;
  color: #6b7280;
  font-size: 13px;
}
.target-title {
  color: #1f2329;
  font-weight: 500;
}
</style>
