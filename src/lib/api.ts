// API configuration for Laravel backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

const api = { // Removida a palavra 'export' daqui
  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { requiresAuth = false, ...fetchOptions } = options;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...fetchOptions.headers,
    };

    if (requiresAuth) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
      throw new Error(error.message || `Erro ${response.status}`);
    }

    return response.json();
  },

  async login(email: string, password: string) {
    const data = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }) as { token: string; user: any };
    
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  async logout() {
    try {
      await this.request('/logout', {
        method: 'POST',
        requiresAuth: true,
      });
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  },
};

export default api; // <-- NOVO: Exportação padrão