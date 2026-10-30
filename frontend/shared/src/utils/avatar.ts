/** 中国大陆手机号。 */
export const PHONE_PATTERN = /^1[3-9]\d{9}$/

/** 用户自己填的昵称上限，与后端 ProfileUpdateRequest 一致。 */
export const NICKNAME_MAX_LENGTH = 10

/** 与后端 spring.servlet.multipart.max-file-size 保持一致。 */
export const AVATAR_MAX_BYTES = 10 * 1024 * 1024

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/** 上传前检查类型和大小，不通过时抛出给页面提示。 */
export function assertAvatarFile(file: File) {
  if (!AVATAR_TYPES.includes(file.type)) {
    throw new Error('头像只支持 jpg、png、gif、webp')
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error('头像不能超过 10MB')
  }
}
