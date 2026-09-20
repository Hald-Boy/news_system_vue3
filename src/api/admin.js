import { get, post } from '@/utils/request'
import { REPORT_ACTION } from '@/constants/enums'

/**
 * 管理后台接口模块（仅 role=1 管理员可用）
 */

/**
 * operationId: getAllUsers —— 用户列表（需管理员）
 * @param {object} params { username?, role?, createTime?, page=1, pageSize=10 }
 * @returns {Promise<{list: Array<User>, total: number}>}
 */
export function getAllUsers(params) {
  return get('/api/admin/user/list', params)
}

/**
 * operationId: updateUser —— 修改用户（需管理员，用于改角色）
 * @param {object} data UserInfo 对象，改角色时传 { id, role }
 * @returns {Promise<string>}
 */
export function updateUser(data) {
  return post('/api/admin/user/update', data)
}

/**
 * operationId: reports —— 举报列表（需管理员）
 * @param {object} params { status?: 0待审核 1已通过 2已驳回, pageNum=1, pageSize=10 }
 * @returns {Promise<{list: Array<ReportVO>, total: number}>}
 */
export function reports(params) {
  return get('/api/admin/reports', params)
}

/**
 * operationId: handle —— 处理举报（需管理员）
 * @param {number} reportId 举报 ID
 * @param {number} action 动作：REPORT_ACTION.APPROVE=1 通过 / REPORT_ACTION.REJECT=2 驳回
 * @param {string} [remark] 处理备注
 * @returns {Promise<object>} ReportHandleResult
 */
export function handleReport(reportId, action, remark) {
  return post('/api/admin/report/handle', null, { params: { reportId, action, remark } })
}

/** 便捷方法：通过举报 */
export function approveReport(reportId, remark) {
  return handleReport(reportId, REPORT_ACTION.APPROVE, remark)
}

/** 便捷方法：驳回举报 */
export function rejectReport(reportId, remark) {
  return handleReport(reportId, REPORT_ACTION.REJECT, remark)
}
