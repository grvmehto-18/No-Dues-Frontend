import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest } from '../types';
import authService from '../services/authService';
import { 
  getUser, 
  saveToken, 
  saveUser, 
  removeToken, 
  initAuthSession,
  willTokenExpireSoon 
} from '../utils/auth';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (loginRequest: LoginRequest) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getUser());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Initialize auth session (handles page reloads)
  useEffect(() => {
    const init = async () => {
      try {
        const sessionRestored = await initAuthSession();
        if (sessionRestored) {
          setUser(getUser());
        }
      } catch (error) {
        console.error('Failed to initialize auth session:', error);
      } finally {
        setInitializing(false);
      }
    };

    init();
  }, []);

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await api.post('/auth/refresh-token', {}, {
        withCredentials: true // Important for cookie-based refresh tokens
      });
      
      if (response.data && response.data.token) {
        saveToken(response.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  };

  // Check token validity periodically
  useEffect(() => {
    if (!user) return;

    const checkTokenAndRefresh = async () => {
      if (willTokenExpireSoon(10)) { // 10 minutes before expiration
        await refreshToken();
      }
    };

    // Set up check interval
    checkTokenAndRefresh(); // Check immediately
    const interval = setInterval(checkTokenAndRefresh, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, [user]);

  const login = async (loginRequest: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(loginRequest);
      
      if (!response || !response.token) {
        throw new Error('Invalid response from server');
      }

      // Validate token before saving
      try {
        const decoded: any = jwtDecode(response.token);
        if (decoded.exp < Date.now() / 1000) {
          throw new Error('Token is expired');
        }
      } catch (error) {
        throw new Error('Invalid token received');
      }

      // Save token and user data
      saveToken(response.token);
      
      const userData: User = {
        id: response.id,
        username: response.username,
        email: response.email,
        firstName: response.firstName || '',
        lastName: response.lastName || '',
        roles: response.roles || [],
        department: response.department || '',
        uniqueCode: response.uniqueCode || '',
        rollNumber: response.rollNumber || '' // Populate rollNumber from JwtResponse
      };
      
      saveUser(userData);
      setUser(userData);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      removeToken();
      setUser(null);
      // window.location.href = '/login';
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send password reset email';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, newPassword);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset password';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    saveUser(updatedUser);
    setUser(updatedUser);
  };

  // Show a loading indicator during initialization
  if (initializing) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    forgotPassword,
    resetPassword,
    refreshToken,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};