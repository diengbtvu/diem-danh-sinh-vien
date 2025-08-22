import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { buildApiUrl, API_CONFIG } from '../config/api';

export interface User {
  id: number;
  username: string;
  hoTen: string;
  email: string;
  role: 'ADMIN' | 'GIANGVIEN';
  khoa?: string;
  boMon?: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

const AUTH_STORAGE_KEY = 'diemdanh_auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Load and verify auth state from localStorage on mount
  useEffect(() => {
    const loadAndVerifyAuthState = async () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const { token, user } = JSON.parse(stored || '{}');

        // Verify token with backend before trusting
        try {
          const resp = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.VERIFY), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          const data = await resp.json();
          if (resp.ok && data?.success) {
            setAuthState({
              user: data.user || user,
              token,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setAuthState({ user: null, token: null, isAuthenticated: false, isLoading: false });
          }
        } catch (err) {
          // Network error: keep user logged out to avoid 403 loops
          setAuthState({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadAndVerifyAuthState();
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<LoginResult> => {
    try {
      console.log('useAuth: Making login request to backend');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      console.log('useAuth: Response status:', response.status);
      const result = await response.json();
      console.log('useAuth: Response data:', result);

      if (result.success) {
        const authData = {
          user: result.user,
          token: result.token
        };

        // Save to localStorage
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

        // Update state
        setAuthState({
          user: result.user,
          token: result.token,
          isAuthenticated: true,
          isLoading: false
        });

        return {
          success: true,
          user: result.user,
          token: result.token
        };
      } else {
        return {
          success: false,
          message: result.message
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Lỗi kết nối: ' + error.message
      };
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.VERIFY), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      return false;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!authState.user) return false;

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          userId: authState.user.id,
          oldPassword,
          newPassword
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      return false;
    }
  };

  const isAdmin = (): boolean => {
    return authState.user?.role === 'ADMIN';
  };

  const isGiangVien = (): boolean => {
    return authState.user?.role === 'GIANGVIEN';
  };

  const hasRole = (role: 'ADMIN' | 'GIANGVIEN'): boolean => {
    return authState.user?.role === role;
  };

  const getAuthHeader = useCallback((): Record<string, string> => {
    let token = authState.token;
    if (!token) {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.token && typeof parsed.token === 'string') {
            token = parsed.token;
          }
        }
      } catch {
        // ignore parse errors
      }
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [authState.token]);

  return {
    ...authState,
    login,
    logout,
    changePassword,
    isAdmin,
    isGiangVien,
    hasRole,
    getAuthHeader
  };
};

// Context for auth (optional, for provider pattern)
export const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
