import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ROLE } from '@/constants/enums'

/**
 * 路由与守卫
 * - meta.requiresAuth：需登录（对应 /api/web/** 接口页面）
 * - meta.requiresAdmin：需管理员 role=1（对应 /api/admin/** 接口页面）
 * - meta.guestOnly：仅未登录可访问（登录/注册页）
 * 首页、帖子详情、评论列表为公开页，可未登录浏览
 */
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', guestOnly: true }
  },
  {
    path: '/post/:id(\\d+)',
    name: 'postDetail',
    component: () => import('@/views/PostDetail.vue'),
    meta: { title: '帖子详情' }
  },
  {
    path: '/post/edit',
    name: 'postCreate',
    component: () => import('@/views/PostEdit.vue'),
    meta: { title: '发布帖子', requiresAuth: true }
  },
  {
    path: '/post/edit/:id(\\d+)',
    name: 'postEdit',
    component: () => import('@/views/PostEdit.vue'),
    meta: { title: '编辑帖子', requiresAuth: true }
  },
  {
    path: '/user/:id(\\d+)',
    name: 'userProfile',
    component: () => import('@/views/UserProfile.vue'),
    meta: { title: '个人主页', requiresAuth: true }
  },
  {
    path: '/my',
    component: () => import('@/views/my/MyHome.vue'),
    meta: { title: '我的', requiresAuth: true },
    redirect: '/my/profile',
    children: [
      {
        path: 'profile',
        name: 'myProfile',
        component: () => import('@/views/my/MyProfile.vue'),
        meta: { title: '个人资料' }
      },
      {
        path: 'collect',
        name: 'myCollect',
        component: () => import('@/views/my/MyCollect.vue'),
        meta: { title: '我的收藏' }
      },
      {
        path: 'notifications',
        name: 'myNotifications',
        component: () => import('@/views/my/MyNotifications.vue'),
        meta: { title: '我的通知' }
      },
      {
        path: 'password',
        name: 'myPassword',
        component: () => import('@/views/my/MyPassword.vue'),
        meta: { title: '修改密码' }
      },
      {
        path: 'security',
        name: 'mySecurity',
        component: () => import('@/views/my/MySecurity.vue'),
        meta: { title: '账号注销' }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminHome.vue'),
    meta: { title: '管理后台', requiresAuth: true, requiresAdmin: true },
    redirect: '/admin/users',
    children: [
      {
        path: 'users',
        name: 'adminUsers',
        component: () => import('@/views/admin/AdminUsers.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'reports',
        name: 'adminReports',
        component: () => import('@/views/admin/AdminReports.vue'),
        meta: { title: '举报审核' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

// 全局前置守卫
router.beforeEach((to) => {
  const userStore = useUserStore()

  // 需登录页面：未登录跳登录页并记录回跳地址
  if (to.meta.requiresAuth && !userStore.token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // 管理后台：非管理员强制回首页
  if (to.meta.requiresAdmin && userStore.userInfo?.role !== ROLE.ADMIN) {
    return { name: 'home' }
  }
  // 登录/注册页：已登录直接回首页
  if (to.meta.guestOnly && userStore.token) {
    return { name: 'home' }
  }
  return true
})

// 全局后置守卫：切换页面后刷新未读数（登录态下）
router.afterEach((to) => {
  const userStore = useUserStore()
  if (userStore.token) {
    userStore.refreshUnread()
  }
  const title = to.meta.title || '世界社区'
  document.title = title === '首页' ? '世界社区' : `${title} - 世界社区`
})

export default router
