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
      // Se a resposta NÃO for OK (404, 500, etc.), tente pegar o erro JSON
      const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
      throw new Error(error.message || `Erro ${response.status}`);
    }

    // --- INÍCIO DA CORREÇÃO ---
    // Se a resposta FOR OK, verifique se é 204 (No Content)
    if (response.status === 204) {
      // Se for 204, a requisição foi um sucesso, mas não há corpo.
      // Retorne um objeto vazio ou um marcador de sucesso.
      return Promise.resolve({}) as Promise<T>;
    }
    // --- FIM DA CORREÇÃO ---

    // Se for 200, 201, etc., prossiga normalmente.
    return response.json();
  },

  async postFormData<T>(endpoint: string, formData: FormData, options: ApiRequestOptions = {}): Promise<T> {
    const { requiresAuth = false, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Accept': 'application/json',
      // NÃO DEFINIMOS 'Content-Type'. O navegador faz isso para 'multipart/form-data'.
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
      method: 'POST', 
      body: formData,
      headers,
    });

    if (!response.ok) {
      // Tenta extrair a mensagem de erro JSON (útil para erros de validação)
      const error = await response.json().catch(() => ({ message: 'Erro na requisição ou arquivo grande demais' }));
      throw new Error(error.message || `Erro ${response.status}`);
    }
    
    if (response.status === 204) {
      return Promise.resolve({}) as Promise<T>;
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