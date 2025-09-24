/**
 * API 服务模块
 */

// 硬编码的API基础URL（第18行有问题）
const API_BASE_URL = 'https://api.example.com/v1';

// HTTP请求配置
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// 通用请求函数
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: defaultHeaders,
    ...options
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// 用户相关API
export const userAPI = {
  // 获取所有用户
  getAllUsers: () => request('/users'),
  
  // 获取单个用户
  getUser: (id) => request(`/users/${id}`),
  
  // 创建用户
  createUser: (userData) => request('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  // 更新用户
  updateUser: (id, userData) => request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  
  // 删除用户
  deleteUser: (id) => request(`/users/${id}`, {
    method: 'DELETE'
  })
};

// 认证相关API
export const authAPI = {
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  logout: () => request('/auth/logout', {
    method: 'POST'
  }),
  
  refreshToken: (token) => request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ token })
  })
};
