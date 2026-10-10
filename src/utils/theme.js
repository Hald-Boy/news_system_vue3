/**
 * 日间/夜间主题切换工具
 * 夜间模式 = html.dark class + Element Plus 暗黑变量 + 自定义 --x-* 变量
 */
const THEME_KEY = 'world_community_theme'

/** 当前主题：'light' | 'dark' */
export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light'
}

/** 应用主题并持久化，返回应用后的主题 */
export function applyTheme(theme) {
  const dark = theme === 'dark'
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem(THEME_KEY, theme)
  return theme
}

/** 切换主题（light<->dark），返回切换后的主题 */
export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  return applyTheme(next)
}

/** 应用启动时初始化一次（App.vue onMounted 调用） */
export function initTheme() {
  applyTheme(getTheme())
}
