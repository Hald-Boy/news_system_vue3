import { get, post, del } from '@/utils/request'

/**
 * 评论接口模块
 * 函数名与接口 operationId 一一对应（like_1 命名为 commentLike）
 */

/**
 * operationId: getAllComment —— 一级评论分页列表（公开）
 * @param {object} params { id: 帖子ID, pageNum=1, pageSize=10 }
 * @returns {Promise<{list: Array<Comment>, total: number, pageNum: number, pageSize: number}>}
 */
export function getAllComment(params) {
  return get('/publicApi/web/comment/listParent', params)
}

/**
 * operationId: getCommentChild —— 子评论分页列表（公开）
 * @param {object} params { newsId, parentId, pageNum=1, pageSize=10 }
 * @returns {Promise<{list: Array<Comment>, total: number, pageNum: number, pageSize: number}>}
 */
export function getCommentChild(params) {
  return get('/publicApi/web/comment/listChild', params)
}

/**
 * operationId: add —— 发表评论/回复（需登录）
 * 发一级评论：parentId 传 0，toUserId 不传；回复某条评论：parentId、toUserId 都传
 * @param {object} data { newsId, content, parentId=0, toUserId?, rootCommentId? }
 * @returns {Promise<string>}
 */
export function add(data) {
  return post('/api/web/comment/add', data)
}

/**
 * operationId: like_1 —— 评论点赞/取消点赞（需登录）
 * @param {number} commentId 评论 ID
 * @returns {Promise<object>}
 */
export function commentLike(commentId) {
  return post('/api/web/comment/like', null, { params: { commentId } })
}

/**
 * operationId: dislike —— 评论"不喜欢"（需登录，用于折叠）
 * @param {number} commentId 评论 ID
 * @returns {Promise<object>}
 */
export function dislike(commentId) {
  return post('/api/web/comment/dislike', null, { params: { commentId } })
}

/**
 * operationId: getFoldedCommentIds —— 批量查询已"不喜欢"（需折叠）的评论 ID（需登录）
 * @param {Array<number>} ids 待检查的评论 ID 列表
 * @returns {Promise<Array<number>>} 应折叠的评论 ID 列表
 */
export function getFoldedCommentIds(ids) {
  return post('/api/web/comment/dislike/list', ids)
}

/**
 * operationId: del —— 删除评论（需登录，仅本人/管理员）
 * @param {number} id 评论 ID
 * @returns {Promise<string>}
 */
export function delComment(id) {
  return del('/api/web/comment/del', { id })
}
