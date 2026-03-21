import api from './api';

const AuthService = {
  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/users/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('email', email);
      try {
        const u = await api.get(`/users/${response.data.userId}`);
        if (u.data?.name) localStorage.setItem('name', u.data.name);
      } catch {
        /* optional */
      }
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
  },

  getCurrentUser: () => {
    // This could decode the JWT or hit an endpoint
    return localStorage.getItem('token');
  }
};

export default AuthService;
