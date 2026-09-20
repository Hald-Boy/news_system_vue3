import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

/**
 * 登录校验工具
 * 返回 requireLogin()：未登录时给出提示并跳转登录页，返回 false；已登录返回 true
 */
export function useAuthGuard() {
  const router = useRouter()
  const userStore = useUserStore()
  return function requireLogin() {
    if (userStore.token) return true
    ElMessage.warning('请先登录后再操作')
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    return false
  }
}

/** 头像占位（无头像时显示用户名首字符） */
export function avatarText(name) {
  if (!name) return '客'
  return name.charAt(0).toUpperCase()
}
