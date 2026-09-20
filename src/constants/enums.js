/**
 * 全局枚举常量
 * 说明：接口文档中带 description 的枚举值以文档为准；
 * 文档未给出取值含义、但由业务语义推导的约定值，均以「约定值」标注，
 * 集中列在 README 的「缺口清单」中，便于与后端二次确认。
 */

/** 帖子内容类型 mediaType */
export const MEDIA_TYPE = {
  TEXT: 1, // 纯文字
  IMAGE: 2, // 图文
  VIDEO: 3, // 视频
  MIXED: 4 // 混合
}

export const MEDIA_TYPE_LABEL = {
  [MEDIA_TYPE.TEXT]: '纯文字',
  [MEDIA_TYPE.IMAGE]: '图文',
  [MEDIA_TYPE.VIDEO]: '视频',
  [MEDIA_TYPE.MIXED]: '混合'
}

/** 短信验证码使用场景 scene */
export const SMS_SCENE = {
  REGISTER: 1, // 注册
  LOGIN: 2 // 登录
}

/** 用户身份 role */
export const ROLE = {
  USER: 0, // 普通用户
  ADMIN: 1 // 管理员
}

export const ROLE_LABEL = {
  [ROLE.USER]: '普通用户',
  [ROLE.ADMIN]: '管理员'
}

/** 收藏类型 collectType（约定值：1=帖子 2=评论） */
export const COLLECT_TYPE = {
  POST: 1,
  COMMENT: 2
}

export const COLLECT_TYPE_LABEL = {
  [COLLECT_TYPE.POST]: '帖子',
  [COLLECT_TYPE.COMMENT]: '评论'
}

/** 举报类型 reportType（约定值：1=帖子 2=评论） */
export const REPORT_TYPE = {
  POST: 1,
  COMMENT: 2
}

export const REPORT_TYPE_LABEL = {
  [REPORT_TYPE.POST]: '帖子',
  [REPORT_TYPE.COMMENT]: '评论'
}

/** 举报审核状态 status（约定值：0=待审核 1=已通过 2=已驳回） */
export const REPORT_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
}

export const REPORT_STATUS_LABEL = {
  [REPORT_STATUS.PENDING]: '待审核',
  [REPORT_STATUS.APPROVED]: '已通过',
  [REPORT_STATUS.REJECTED]: '已驳回'
}

/** 管理员处理举报的动作 action（约定值：1=通过 2=驳回） */
export const REPORT_ACTION = {
  APPROVE: 1,
  REJECT: 2
}

export const REPORT_ACTION_LABEL = {
  [REPORT_ACTION.APPROVE]: '通过',
  [REPORT_ACTION.REJECT]: '驳回'
}

/** 举报原因 reasonType（字符串，前端可选项，约定值） */
export const REASON_TYPE_OPTIONS = [
  { value: 'SPAM', label: '垃圾广告' },
  { value: 'ILLEGAL', label: '违法违规' },
  { value: 'RUMOR', label: '不实信息' },
  { value: 'ABUSE', label: '人身攻击' },
  { value: 'PORN', label: '色情低俗' },
  { value: 'OTHER', label: '其他' }
]

/** 帖子状态 status */
export const POST_STATUS = {
  NORMAL: 0, // 正常
  BANNED: 1 // 封禁
}

/** 账号状态 status */
export const USER_STATUS = {
  NORMAL: 0, // 正常
  BANNED: 1 // 封禁
}

/** 通知已读状态 isRead */
export const READ_STATUS = {
  UNREAD: 0, // 未读
  READ: 1 // 已读
}

/** 通知目标类型 targetType（约定值：1=帖子 2=评论，仅用于点击跳转） */
export const NOTIFICATION_TARGET_TYPE = {
  POST: 1,
  COMMENT: 2
}

/** 业务响应码 */
export const RESPONSE_CODE = {
  SUCCESS: 200
}

/** 存储 key */
export const STORAGE_KEY = {
  TOKEN: 'world_community_token',
  USER: 'world_community_user'
}
