/**
 * 接口返回字段解析工具
 * 后端状态类字段实际命名为 isLiked / isCollected / isFollowing / isMutual / isDisliked
 * （见 NewsServiceImpl / CommentServiceImpl / CollectServiceImpl / FollowServiceImpl 的 result.put）
 * 为兼容不同命名习惯，统一用 stateOf / countOf 解析，两种写法都能识别
 */

/**
 * 从接口返回的 data 中提取布尔状态
 * 优先取 isXxx（如 isLiked），其次兼容 xxx（如 liked）
 * @param {object} data 接口返回的 data
 * @param {string} key 首选字段名，如 'isLiked'
 * @returns {boolean|undefined} 解析不到布尔值时返回 undefined
 */
export function stateOf(data, key) {
  if (data && typeof data === 'object') {
    if (typeof data[key] === 'boolean') return data[key]
    // 兼容无 is 前缀的写法：isLiked -> liked
    const alt = key.startsWith('is')
      ? key.slice(2).replace(/^./, (c) => c.toLowerCase())
      : `is${key.charAt(0).toUpperCase()}${key.slice(1)}`
    if (typeof data[alt] === 'boolean') return data[alt]
  }
  return undefined
}

/**
 * 从接口返回的 data 中提取数值（likeCount / collectCount 等）
 * @param {object} data 接口返回的 data
 * @param {string} key 字段名
 * @returns {number|undefined}
 */
export function countOf(data, key) {
  if (data && typeof data[key] === 'number') return data[key]
  return undefined
}
