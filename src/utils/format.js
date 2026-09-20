import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/** 格式化时间：一分钟内显示"刚刚"，1 小时内"x分钟前"，24 小时内"x小时前"，7 天内"x天前"，其余显示 yyyy-MM-dd HH:mm */
export function formatTime(time) {
  if (!time) return ''
  const d = dayjs(time)
  if (!d.isValid()) return String(time)
  const diffMin = dayjs().diff(d, 'minute')
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = dayjs().diff(d, 'hour')
  if (diffHour < 24) return `${diffHour}小时前`
  const diffDay = dayjs().diff(d, 'day')
  if (diffDay < 7) return `${diffDay}天前`
  return d.format('YYYY-MM-DD HH:mm')
}

/** 完整时间格式 */
export function formatDateTime(time) {
  if (!time) return ''
  const d = dayjs(time)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : String(time)
}

/** 日期格式 yyyy-MM-dd（生日等） */
export function formatDate(time) {
  if (!time) return ''
  const d = dayjs(time)
  return d.isValid() ? d.format('YYYY-MM-DD') : String(time)
}

/** 数字缩写：1200 -> 1.2k */
export function formatCount(num) {
  const n = Number(num) || 0
  if (n < 1000) return String(n)
  if (n < 1000000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return `${(n / 1000000).toFixed(1)}M`
}
