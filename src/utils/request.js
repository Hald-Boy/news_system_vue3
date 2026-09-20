import axios from 'axios'
import { ElMessage } from 'element-plus'
import { RESPONSE_CODE, STORAGE_KEY } from '@/constants/enums'

/**
 * Axios 统一封装
 * - 请求拦截器：自动携带 Authorization: Bearer {token}
 * - 响应拦截器：统一解包 {code, msg, data}；code=200 返回 data；
 *   code!=200 用 ElMessage 提示 msg；401/403 清除登录态并跳登录页
 */
const service = axios.create({
  baseURL: '/',
  timeout: 15000
})

// 请求拦截器：附加 token
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEY.TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/** 处理未授权：清除登录态并跳转登录页（带回跳地址） */
function handleUnauthorized() {
  const hadToken = !!localStorage.getItem(STORAGE_KEY.TOKEN)
  localStorage.removeItem(STORAGE_KEY.TOKEN)
  localStorage.removeItem(STORAGE_KEY.USER)
  // 只在确实持有过登录态时跳转，避免注册/登录等公开页 401 引起死循环
  if (hadToken) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search)
    const current = window.location.pathname
    if (current !== '/login' && current !== '/register') {
      window.location.href = `/login?redirect=${redirect}`
    }
  }
}

// 响应拦截器：统一解包
service.interceptors.response.use(
  (response) => {
    // 非 JSON 响应（如文件流）直接返回
    const res = response.data
    if (res === null || typeof res !== 'object' || !('code' in res)) {
      return res
    }
    if (res.code === RESPONSE_CODE.SUCCESS) {
      return res.data
    }
    if (res.code === 401 || res.code === 403) {
      handleUnauthorized()
      ElMessage.error(res.msg || '登录状态已失效，请重新登录')
      return Promise.reject(new Error(res.msg || '未授权'))
    }
    // 其余非 200：用 msg 提示用户（可直接展示）
    ElMessage.error(res.msg || '请求失败，请稍后重试')
    return Promise.reject(new Error(res.msg || '请求失败'))
  },
  (error) => {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      handleUnauthorized()
      ElMessage.error(error.response?.data?.msg || '登录状态已失效，请重新登录')
    } else if (status === 500) {
      ElMessage.error('服务器开小差了，请稍后再试')
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络后重试')
    } else {
      const msg = error.response?.data?.msg
      ElMessage.error(msg || '网络异常，请稍后重试')
    }
    return Promise.reject(error)
  }
)

/**
 * 通用 GET 请求
 * @param {string} url 请求地址
 * @param {object} params query 参数
 */
export function get(url, params) {
  return service.get(url, { params })
}

/**
 * 通用 POST 请求
 * @param {string} url 请求地址
 * @param {object|FormData} data 请求体（JSON 对象或 FormData）
 * @param {object} config 额外配置（params 等）
 */
export function post(url, data, config) {
  return service.post(url, data, config)
}

/**
 * 通用 PUT 请求
 * @param {string} url 请求地址
 * @param {object|FormData} data 请求体
 * @param {object} config 额外配置（params 等）
 */
export function put(url, data, config) {
  return service.put(url, data, config)
}

/**
 * 通用 DELETE 请求
 * @param {string} url 请求地址
 * @param {object} params query 参数
 */
export function del(url, params) {
  return service.delete(url, { params })
}

export default service
