import { defineStore } from 'pinia'
import { STORAGE_KEY, ROLE } from '@/constants/enums'
import * as userApi from '@/api/user'
import * as notificationApi from '@/api/notification'

/**
 * 用户状态：token（localStorage 持久化）+ userInfo（localStorage 持久化）+ 未读通知数
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(STORAGE_KEY.TOKEN) || '',
    userInfo: JSON.parse(localStorage.getItem(STORAGE_KEY.USER) || 'null'),
    unreadCount: 0
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.userInfo?.role === ROLE.ADMIN,
    userId: (state) => state.userInfo?.id ?? null
  },

  actions: {
    /** 登录/注册成功后写入 token 与用户信息 */
    setAuth(data) {
      this.token = data?.token || ''
      this.userInfo = data?.user || null
      localStorage.setItem(STORAGE_KEY.TOKEN, this.token)
      if (this.userInfo) {
        localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(this.userInfo))
      } else {
        localStorage.removeItem(STORAGE_KEY.USER)
      }
    },

    /** 更新用户信息（编辑资料后回写） */
    setUserInfo(info) {
      this.userInfo = { ...(this.userInfo || {}), ...info }
      localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(this.userInfo))
    },

    /** 拉取当前用户信息（页面刷新后恢复登录态） */
    async fetchInfo() {
      if (!this.token) return null
      try {
        const info = await userApi.info()
        this.setUserInfo(info)
        return info
      } catch (e) {
        // 401 等已由拦截器统一处理并清 token
        return null
      }
    },

    /** 退出登录：调后端 logout 接口并清空本地登录态 */
    async logout() {
      try {
        await userApi.logout()
      } catch (e) {
        /* 忽略退出接口异常，本地态必须清理 */
      }
      this.token = ''
      this.userInfo = null
      this.unreadCount = 0
      localStorage.removeItem(STORAGE_KEY.TOKEN)
      localStorage.removeItem(STORAGE_KEY.USER)
    },

    /** 刷新未读通知数 */
    async refreshUnread() {
      if (!this.token) {
        this.unreadCount = 0
        return
      }
      try {
        this.unreadCount = (await notificationApi.unreadCount()) || 0
      } catch (e) {
        /* 静默失败 */
      }
    }
  }
})
