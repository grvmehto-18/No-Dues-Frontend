import axios, { AxiosRequestHeaders } from 'axios';
import { getToken, removeToken, saveToken } from '../utils/auth';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  },
  // Increase timeout to 30 seconds since email sending might take time
  timeout: 30000
});

// Keep track of refresh attempts to prevent infinite loops
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // Skip adding token for refresh-token endpoint
    if (config.url === '/auth/refresh-token' || config.url === '/auth/signin') {
      console.log('Skipping token for auth endpoint');
      return config;
    }
    
    const token = getToken();
    if (token) {
      // Log the token being used (only first few characters for security)
      const tokenPreview = token.substring(0, 10) + '...';
      console.log(`Using token: ${tokenPreview} for ${config.method?.toUpperCase()} ${config.url}`);
      
      // Ensure headers object exists and is properly typed
      if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
      }
      
      // Make sure Bearer prefix is added
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Log the full headers for debugging
      console.log('Request headers:', JSON.stringify(config.headers));
    } else {
      console.warn('No token available for request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log detailed error information
    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: originalRequest?.headers
    });
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh-token requests to avoid infinite loops
      if (originalRequest.url === '/auth/refresh-token' || originalRequest.url === '/auth/signin') {
        console.error('Auth request failed with 401');
        removeToken();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // If already refreshing, add to queue
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          
          // Ensure headers object exists and is properly typed
          if (!originalRequest.headers) {
            originalRequest.headers = {} as AxiosRequestHeaders;
          }
          
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axios(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        console.log('Attempting to refresh token due to 401 error');
        
        // Create a new axios instance for the refresh request to avoid interceptors
        const refreshResponse = await axios.post('http://localhost:8080/api/auth/signin', {
          username: localStorage.getItem('last_username') || '',
          password: localStorage.getItem('last_password') || ''
        });
        
        if (refreshResponse.data && refreshResponse.data.token) {
          const newToken = refreshResponse.data.token;
          saveToken(newToken);
          
          // Ensure headers object exists and is properly typed
          if (!originalRequest.headers) {
            originalRequest.headers = {} as AxiosRequestHeaders;
          }
          
          // Update authorization header
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          // Process queue with new token
          processQueue(null, newToken);
          console.log('Token refreshed successfully, retrying request');
          
          // Return the original request with the new token
          return axios(originalRequest);
        } else {
          console.error('Token refresh failed - no token in response');
          processQueue(error, null);
          removeToken();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        removeToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // For other errors, just reject the promise
    return Promise.reject(error);
  }
);

// Override the put method to always include the token in the header
const originalPut = api.put;
api.put = function(url: string, data?: any, config?: any) {
  const token = getToken();
  const newConfig = {
    ...config,
    headers: {
      ...config?.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  console.log(`Making PUT request to ${url} with token: ${token?.substring(0, 10)}...`);
  return originalPut(url, data, newConfig);
};

// Override the delete method to always include the token in the header
const originalDelete = api.delete;
api.delete = function(url: string, config?: any) {
  const token = getToken();
  const newConfig = {
    ...config,
    headers: {
      ...config?.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  console.log(`Making DELETE request to ${url} with token: ${token?.substring(0, 10)}...`);
  return originalDelete(url, newConfig);
};

// Override the post method to always include the token in the header
const originalPost = api.post;
api.post = function(url: string, data?: any, config?: any) {
  // Skip for auth endpoints
  if (url === '/auth/signin' || url === '/auth/refresh-token') {
    return originalPost(url, data, config);
  }
  
  const token = getToken();
  const newConfig = {
    ...config,
    headers: {
      ...config?.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  console.log(`Making POST request to ${url} with token: ${token?.substring(0, 10)}...`);
  return originalPost(url, data, newConfig);
};

// Override the get method to always include the token in the header
const originalGet = api.get;
api.get = function(url: string, config?: any) {
  const token = getToken();
  const newConfig = {
    ...config,
    headers: {
      ...config?.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  console.log(`Making GET request to ${url} with token: ${token?.substring(0, 10)}...`);
  return originalGet(url, newConfig);
};

export default api; 