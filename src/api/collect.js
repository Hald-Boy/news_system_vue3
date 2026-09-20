import { get, post } from '@/utils/request'
import { COLLECT_TYPE } from '@/constants/enums'

/**
 * 收藏接口模块
 */

/**
 * operationId: toggle —— 收藏/取消收藏（需登录）
 * @param {number} collectType 收藏类型：COLLECT_TYPE.POST=1 帖子 / COLLECT_TYPE.COMMENT=2 评论
 * @param {number} targetId 目标 ID（帖子 ID 或评论 ID）
 * @returns {Promise<object>} 含最新收藏状态/数量
 */
export function toggle(collectType, targetId) {
  return post('/api/web/collect/toggle', null, { params: { collectType, targetId } })
}

/**
 * operationId: status —— 当前用户对某目标的收藏状态（需登录）
 * @param {number} collectType 收藏类型
 * @param {number} targetId 目标 ID
 * @returns {Promise<object>} 含 collected 等状态字段
 */
export function status(collectType, targetId) {
  return get('/api/web/collect/status', { collectType, targetId })
}

/**
 * operationId: minePosts —— 我的收藏·帖子列表（需登录）
 * @param {object} params { pageNum=1, pageSize=10 }
 * @returns {Promise<{list: Array<PostCardVO>, total: number}>}
 */
export function minePosts(params) {
  return get('/api/web/collect/mine/posts', params)
}

/**
 * operationId: mineComments —— 我的收藏·评论列表（需登录）
 * @param {object} params { pageNum=1, pageSize=10 }
 * @returns {Promise<{list: Array<CommentCardVO>, total: number}>}
 */
export function mineComments(params) {
  return get('/api/web/collect/mine/comments', params)
}

/** 便捷方法：收藏/取消收藏帖子 */
export function toggleCollectPost(postId) {
  return toggle(COLLECT_TYPE.POST, postId)
}

/** 便捷方法：收藏/取消收藏评论 */
export function toggleCollectComment(commentId) {
  return toggle(COLLECT_TYPE.COMMENT, commentId)
}
