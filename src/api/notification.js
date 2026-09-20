import { get, post } from '@/utils/request'

/**
 * 站内通知接口模块
 */

/**
 * operationId: unreadCount —— 未读通知数（需登录）
 * @returns {Promise<number>}
 */
export function unreadCount() {
  return get('/api/web/notification/unread-count')
}

/**
 * operationId: list —— 通知分页列表（需登录）
 * @param {object} params { pageNum=1, pageSize=10 }
 * @returns {Promise<{list: Array<Notification>, total: number}>}
 */
export function list(params) {
  return get('/api/web/notification/list', params)
}

/**
 * operationId: read —— 标记通知已读（需登录）
 * 不传 notificationId 时表示全部已读
 * @param {number} [notificationId] 通知 ID，可选
 * @returns {Promise<void>}
 */
export function read(notificationId) {
  const params = notificationId ? { notificationId } : undefined
  return post('/api/web/notification/read', null, { params })
}

/** 便捷方法：全部已读 */
export function readAll() {
  return read()
}
