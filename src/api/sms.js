import { post } from '@/utils/request'
import { SMS_SCENE } from '@/constants/enums'

/**
 * 短信验证码接口模块（模拟实现，验证码打印在后端控制台）
 */

/**
 * operationId: send —— 发送短信验证码（公开）
 * @param {object} data { phone, scene: 1注册 2登录 }
 * @returns {Promise<string>}
 */
export function send(data) {
  return post('/publicApi/sms/send', data)
}

/**
 * 发送验证码（带场景常量）
 * @param {string} phone 手机号
 * @param {number} scene SMS_SCENE.REGISTER / SMS_SCENE.LOGIN
 */
export function sendCode(phone, scene = SMS_SCENE.LOGIN) {
  return send({ phone, scene })
}
