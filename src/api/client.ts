import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
});

// 요청 인터셉터: 모든 요청에 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    // OAuth 로그인 엔드포인트는 토큰 없이 요청
    if (config.url && config.url.includes('/auth/login/oauth')) {
      return config;
    }
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

