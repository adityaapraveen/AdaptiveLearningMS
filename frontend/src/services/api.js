// In services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Teacher-student mapping endpoints
export const getTeacherCode = () => api.get('/users/teacher/code');
export const regenerateTeacherCode = () => api.post('/users/teacher/code/regenerate');
export const joinTeacher = (teacherCode) => api.post('/users/student/join', { teacher_code: teacherCode });
export const getTeacherStudents = () => api.get('/users/teacher/students');
export const getStudentTeachers = () => api.get('/users/student/teachers');
export const unsubscribeFromTeacher = (teacherUsername) => api.post('/users/student/unsubscribe', { teacher_username: teacherUsername });

// Existing endpoints
export const login = (credentials) => api.post('/login', credentials);
export const register = (userData) => api.post('/register', userData);
export const getProfile = () => api.get('/users/profile');
export const verifyToken = () => api.get('/users/verify-token');

export default api;