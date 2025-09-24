/**
 * 用户工具函数
 */

// 格式化用户名
export function formatUserName(firstName, lastName) {
  return `${firstName} ${lastName}`;
}

// 验证邮箱格式
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// 生成随机ID
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// 异步获取用户详情 - 缺少错误处理（第42行）
export async function getUserDetails(userId) {
  const response = await fetch(`/api/users/${userId}`);
  const user = await response.json();
  return user;
}

// 批量处理用户数据
export function processUsers(users) {
  return users.map(user => ({
    ...user,
    displayName: formatUserName(user.firstName, user.lastName),
    isValidEmail: validateEmail(user.email)
  }));
}

// 缓存用户数据
const userCache = new Map();

export function cacheUser(userId, userData) {
  userCache.set(userId, userData);
}

export function getCachedUser(userId) {
  return userCache.get(userId);
}
