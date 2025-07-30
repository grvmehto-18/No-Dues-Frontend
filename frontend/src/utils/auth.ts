import { jwtDecode } from "jwt-decode";
import { User } from "../types";

// Memory storage for session-only auth data
class SecureAuthStorage {
  private static instance: SecureAuthStorage;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {}

  public static getInstance(): SecureAuthStorage {
    if (!SecureAuthStorage.instance) {
      SecureAuthStorage.instance = new SecureAuthStorage();
    }
    return SecureAuthStorage.instance;
  }

  public setToken(token: string): void {
    this.token = token;

    sessionStorage.setItem("auth_session_active", "true");
  }

  public getToken(): string | null {
    return this.token;
  }

  public setUser(user: User): void {
    this.user = user;
  }

  public getUser(): User | null {
    return this.user;
  }

  public clear(): void {
    this.token = null;
    this.user = null;
    sessionStorage.removeItem("auth_session_active");
  }

  public hasSession(): boolean {
    return sessionStorage.getItem("auth_session_active") === "true";
  }
}

// Get the singleton instance
const secureStorage = SecureAuthStorage.getInstance();

// Save token to secure memory storage
export const saveToken = (token: string): void => {
  secureStorage.setToken(token);

  // Optional: Store the expiration time in session storage (not the token itself)
  try {
    const decoded: any = jwtDecode(token);
    if (decoded.exp) {
      sessionStorage.setItem("auth_token_exp", decoded.exp.toString());
    }
  } catch (error) {
    // Handle decode error
  }
};

// Get token from secure memory storage
export const getToken = (): string | null => {
  return secureStorage.getToken();
};

// Remove token from secure memory storage
export const removeToken = (): void => {
  secureStorage.clear();
};

// Save user to secure memory storage
export const saveUser = (user: User): void => {
  secureStorage.setUser(user);
};

// Get user from secure memory storage
export const getUser = (): User | null => {
  return secureStorage.getUser();
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getToken();

  // If no token in memory but session flag exists, we need to re-authenticate
  // This happens after a page refresh
  if (!token && secureStorage.hasSession()) {
    return false; // Token lost due to page refresh, need re-auth
  }

  if (!token) {
    return false;
  }

  try {
    const decoded: any = jwtDecode(token);
    const isValid = decoded.exp > Date.now() / 1000;

    if (!isValid) {
      removeToken();
      return false;
    }

    return true;
  } catch (error) {
    removeToken();
    return false;
  }
};

// Check if user has a specific role
export const hasRole = (role: string): boolean => {
  const user = getUser();
  if (!user || !user.roles) {
    return false;
  }
  return user.roles.includes(role);
};

// Role check utility functions
export const isAdmin = (): boolean => hasRole("ROLE_ADMIN");
export const isDepartmentAdmin = (): boolean =>
  hasRole("ROLE_DEPARTMENT_ADMIN");
export const isHOD = (): boolean => hasRole("ROLE_HOD");
export const isPrincipal = (): boolean => hasRole("ROLE_PRINCIPAL");
export const isStudent = (): boolean => hasRole("ROLE_STUDENT");

// Check token validity with the backend
export const checkTokenValidity = async (): Promise<boolean> => {
  const token = getToken();
  if (!token) {
    return false;
  }

  try {
    const response = await fetch("http://localhost:8080/api/auth/check-token", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
};

// Get token expiration time (in seconds)
export const getTokenExpirationTime = (): number | null => {
  // Try to get from memory first
  const token = getToken();
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp;
    } catch (error) {
      // Fall back to session storage
    }
  }

  // Fall back to session storage (used after page reload)
  const expString = sessionStorage.getItem("auth_token_exp");
  if (expString) {
    return parseInt(expString, 10);
  }

  return null;
};

// Check if token will expire soon (within the next minutes)
export const willTokenExpireSoon = (minutesThreshold: number = 5): boolean => {
  const expirationTime = getTokenExpirationTime();
  if (!expirationTime) {
    return true;
  }

  const currentTime = Date.now() / 1000;
  const thresholdInSeconds = minutesThreshold * 60;

  return expirationTime - currentTime < thresholdInSeconds;
};

// Handle session restoration after page reload
export const initAuthSession = async (): Promise<boolean> => {
  // If we have session indicator but no token in memory (page was refreshed)
  if (secureStorage.hasSession() && !getToken()) {
    try {
      const token = getToken(); // Try to get token if exists

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        "http://localhost:8080/api/auth/refresh-token",
        {
          method: "POST",
          credentials: "include", // important to send cookies
          headers: headers,
        }
      );

      console.log("Trying to refresh session...");

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          saveToken(data.token);
          if (data.user) {
            saveUser(data.user);
          }
          console.log("Session refreshed successfully ✅");
          return true;
        }
      }

      console.warn("Could not refresh session ❌");
      secureStorage.clear();
      return false;
    } catch (error) {
      console.error("Refresh session failed ❗", error);
      secureStorage.clear();
      return false;
    }
  }

  return isAuthenticated();
};
