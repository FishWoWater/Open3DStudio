import { UserInfo } from '../types/api';

const AUTH_TOKEN_KEY = 'open3d_studio_auth_token';
const AUTH_USER_KEY = 'open3d_studio_auth_user';

export interface PersistedAuth {
  token: string;
  user: UserInfo;
}

class AuthPersistence {
  /**
   * Save authentication data to localStorage
   */
  saveAuth(token: string, user: UserInfo): void {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  }

  /**
   * Load authentication data from localStorage
   */
  loadAuth(): PersistedAuth | null {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const userJson = localStorage.getItem(AUTH_USER_KEY);

      if (token && userJson) {
        const user = JSON.parse(userJson) as UserInfo;
        return { token, user };
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
    }
    return null;
  }

  /**
   * Clear authentication data from localStorage
   */
  clearAuth(): void {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Get just the token
   */
  getToken(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}

export const authPersistence = new AuthPersistence();

