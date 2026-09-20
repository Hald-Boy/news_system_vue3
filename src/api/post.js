import { get, post, put, del } from '@/utils/request'

/**
 * 帖子（新闻管理）接口模块
 * 函数名与接口 operationId 一一对应
 */

/**
 * operationId: pageQuery —— 帖子分页列表（公开）
 * @param {object} params { title?, pageNum=1, pageSize=10 }
 * @returns {Promise<{list: Array<News>, total: number, pageNum: number, pageSize: number}>} PageBeanNews
 */
export function pageQuery(params) {
  return get('/publicApi/web/post/page', params)
}

/**
 * operationId: getById —— 帖子详情（公开）
 * @param {number} id 帖子 ID
 * @returns {Promise<object>} News
 */
export function getById(id) {
  return get(`/publicApi/web/post/find/${id}`)
}

/**
 * operationId: addNews —— 发布帖子（需登录）
 * Content-Type 必须为 multipart/form-data：
 * news 字段传 JSON 字符串（如 {"title":"标题","content":"内容"}），newImages 传文件数组
 * @param {FormData} formData 包含 news、newImages 字段的 FormData
 * @returns {Promise<string>}
 */
export function addNews(formData) {
  return post('/api/web/post/add', formData)
}

/**
 * operationId: update —— 编辑帖子（需登录）
 * Content-Type 必须为 multipart/form-data：
 * - news：JSON 字符串 {"id":x,"title":"...","content":"..."}
 * - newImages：新增图片文件
 * - keepMediaList：保留的旧图 JSON（如 [{"id":15,"sortOrder":2}]）
 * - newMediaSortList：新图排序 JSON（如 [1,2]）
 * keepMediaList / newMediaSortList 也可拼在 URL query 上，这里同时以 query 传递
 * @param {number} id 帖子 ID
 * @param {FormData} formData 含 news、newImages 字段的 FormData
 * @param {object} queryParams { keepMediaList?, newMediaSortList? }
 * @returns {Promise<string>}
 */
export function update(id, formData, queryParams) {
  return put(`/api/web/post/update/${id}`, formData, { params: queryParams })
}

/**
 * operationId: like —— 点赞/取消点赞帖子（需登录）
 * @param {number} postId 帖子 ID
 * @returns {Promise<object>} 含最新点赞数等
 */
export function like(postId) {
  return post('/api/web/post/postlike', null, { params: { postId } })
}

/**
 * operationId: likeStatus —— 当前用户对帖子的点赞状态（需登录）
 * @param {number} postId 帖子 ID
 * @returns {Promise<object>} 含 liked 等状态字段
 */
export function likeStatus(postId) {
  return get('/api/web/post/postlike/status', { postId })
}

/**
 * operationId: disinterest —— 标记帖子不感兴趣（需登录）
 * @param {number} postId 帖子 ID
 * @returns {Promise<object>}
 */
export function disinterest(postId) {
  return post('/api/web/post/disinterest', null, { params: { postId } })
}

/**
 * operationId: disinterestIds —— 获取当前用户不感兴趣的帖子 ID 列表（需登录）
 * @returns {Promise<Array<number>>}
 */
export function disinterestIds() {
  return get('/api/web/post/disinterest/ids')
}

/**
 * operationId: delete —— 删除帖子（需登录，仅本人/管理员）
 * @param {number} id 帖子 ID
 * @returns {Promise<string>}
 */
export function delPost(id) {
  return del(`/api/web/post/delete/${id}`)
}
