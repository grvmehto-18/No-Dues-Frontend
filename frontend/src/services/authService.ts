import api from './api';
import { LoginRequest, JwtResponse } from '../types';
import { removeToken } from '../utils/auth';

class AuthService {
  async login(loginRequest: LoginRequest): Promise<JwtResponse> {
    const response = await api.post('/auth/signin', loginRequest);
    return response.data;
  }
  
  logout(): void {
    removeToken();
  }
  
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', null, {
      params: { email }
    });
  }
  
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', null, {
      params: { token, newPassword }
    });
  }
}

const authService = new AuthService();
export default authService; 