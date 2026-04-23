import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.error || 'Something went wrong.';

    // Do NOT show error or redirect for /auth/me failures
    if (err.config?.url?.includes('/auth/me')) {
      return Promise.reject(err);
    }

    if (status === 401) {
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (status !== 404) {
      toast.error(msg);
    }

    return Promise.reject(err);
  }
);

export default api;