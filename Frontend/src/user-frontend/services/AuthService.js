import api from './api';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const AuthService = {
  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/users/login', { email, password });
    if (response.data.token) {
      const decoded = parseJwt(response.data.token);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId || (decoded ? decoded.sub : null));
      localStorage.setItem('role', decoded ? decoded.role : 'USER');
      localStorage.setItem('email', email);
      
      try {
        const u = await api.get(`/users/${localStorage.getItem('userId')}`);
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
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
  },

  getCurrentUser: () => {
    return {
      token: localStorage.getItem('token'),
      role: localStorage.getItem('role'),
      userId: localStorage.getItem('userId')
    };
  }
};

export default AuthService;
