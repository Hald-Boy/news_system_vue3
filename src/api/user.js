import { get, post, del } from '@/utils/request'

/**
 * 用户管理接口模块（对应 OpenAPI tags: 用户管理接口 / 个人主页接口）
 * 全部函数名与接口 operationId 一一对应
 */

/**
 * operationId: register —— 用户注册（公开）
 * 成功后 data = { token, user }，需自动登录
 * @param {object} data { phone, smsCode, passWord }
 * @returns {Promise<{token: string, user: object}>}
 */
export function register(data) {
  return post('/publicApi/web/user/register', data)
}

/**
 * operationId: loginBySms —— 短信验证码登录（公开）
 * @param {object} data { phone, smsCode }
 * @returns {Promise<{token: string, user: object}>}
 */
export function loginBySms(data) {
  return post('/publicApi/web/user/login/sms', data)
}

/**
 * operationId: loginByPassword —— 密码登录（公开）
 * @param {object} data { phone, passWord }
 * @returns {Promise<{token: string, user: object}>}
 */
export function loginByPassword(data) {
  return post('/publicApi/web/user/login/password', data)
}

/**
 * operationId: logout —— 退出登录
 * @returns {Promise<string>}
 */
export function logout() {
  return post('/logout')
}

/**
 * operationId: changePassword —— 修改密码（需登录）
 * @param {object} data { oldPassword, newPassword }
 * @returns {Promise<string>}
 */
export function changePassword(data) {
  return post('/api/web/user/updateCurrent', data)
}

/**
 * operationId: updateProfile —— 编辑个人资料（需登录）
 * @param {object} data UserInfo 对象（id 必填）
 * @returns {Promise<object>} 更新后的 UserInfo
 */
export function updateProfile(data) {
  return post('/api/web/user/profile/update', data)
}

/**
 * operationId: deleteUserById —— 注销当前账号（需登录）
 * @returns {Promise<string>}
 */
export function deleteCurrent() {
  return del('/api/web/user/deleteCurrent')
}

/**
 * operationId: info —— 获取当前登录用户信息（需登录）
 * @returns {Promise<object>} User
 */
export function info() {
  return get('/api/web/user/info')
}

/**
 * operationId: profile —— 获取他人/自己的个人主页信息（需登录）
 * @param {number} userId 目标用户 ID
 * @returns {Promise<{userInfo: object, postCount: number, isFollowing: boolean, isMutual: boolean}>} UserProfileVO
 */
export function profile(userId) {
  return get('/api/web/user/profile', { userId })
}

/**
 * operationId: posts —— 用户的发布列表（需登录）
 * @param {number} userId 目标用户 ID
 * @param {object} params { pageNum, pageSize }
 * @returns {Promise<{list: Array, total: number, pageNum: number, pageSize: number}>} PageBeanPostCardVO
 */
export function posts(userId, params) {
  return get('/api/web/user/posts', { userId, ...params })
}
