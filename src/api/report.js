import { post } from '@/utils/request'

/**
 * 举报接口模块
 */

/**
 * operationId: submit —— 提交举报（需登录）
 * @param {object} data {
 *   reportType: 举报类型 REPORT_TYPE.POST=1 / REPORT_TYPE.COMMENT=2,
 *   targetId: 被举报目标 ID,
 *   reasonType: 举报原因（见 REASON_TYPE_OPTIONS）,
 *   remark: 补充说明
 * }
 * @returns {Promise<string>}
 */
export function submit(data) {
  return post('/api/web/report/submit', data)
}
