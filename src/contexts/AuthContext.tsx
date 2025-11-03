import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { echo } from '@/lib/echo'; // <-- 1. Importe o 'echo'


const setEchoToken = (token: string | null) => {
  // Garante que a estrutura de autenticação exista na instância do Echo
  if (!echo.options.auth) {
    echo.options.auth = {
      headers: {},
    };
  }

  if (token) {
    console.log('AuthContext: Definindo token do Echo.'); // Log de sucesso
    echo.options.auth.headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.log('AuthContext: Limpando token do Echo.'); // Log de sucesso
    delete echo.options.auth.headers['Authorization'];
  }
};

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = api.getUser();
    if (storedUser) {
      setUser(storedUser);
      
   
      // Se o usuário já estava logado (deu F5 na página),
      // atualizamos o token do echo imediatamente.
      const token = localStorage.getItem('auth_token');
      setEchoToken(token); // Use a nova função
   
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // 'data' aqui contém o token e o usuário
    const data = await api.login(email, password); 
    setUser(data.user);
    
    // --- 3. ADICIONE ESTA LINHA (A MAIS IMPORTANTE) ---
    // Atualiza o token no objeto 'echo' DEPOIS do login.
  setEchoToken(data.token);
    // --- FIM DA ADIÇÃO ---
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    
    // --- 4. ADICIONE ESTE BLOCO ---
    // Limpa o token do echo ao sair
    setEchoToken(null);
    // --- FIM DA ADIÇÃO ---
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}