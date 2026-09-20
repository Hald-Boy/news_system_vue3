import { get, post } from '@/utils/request'

/**
 * 关注/粉丝接口模块
 */

/**
 * operationId: follow —— 关注/取消关注（需登录）
 * @param {number} targetUserId 目标用户 ID
 * @returns {Promise<object>} 含最新关注状态等
 */
export function follow(targetUserId) {
  return post('/api/web/follow/toggle', null, { params: { targetUserId } })
}

/**
 * operationId: followStatus —— 当前用户对目标用户的关注状态（需登录）
 * @param {number} targetUserId 目标用户 ID
 * @returns {Promise<object>} 含 following 等状态字段
 */
export function followStatus(targetUserId) {
  return get('/api/web/follow/status', { targetUserId })
}

/**
 * operationId: following —— 关注列表（需登录）
 * @param {number} userId 目标用户 ID
 * @param {object} params { pageNum=1, pageSize=10 }
 * @returns {Promise<{list: Array<UserCardVO>, total: number}>}
 */
export function following(userId, params) {
  return get('/api/web/follow/following', { userId, ...params })
}

/**
 * operationId: fans —— 粉丝列表（需登录）
 * @param {number} userId 目标用户 ID
 * @param {object} params { pageNum=1, pageSize=10 }
 * @returns {Promise<{list: Array<UserCardVO>, total: number}>}
 */
export function fans(userId, params) {
  return get('/api/web/follow/fans', { userId, ...params })
}
