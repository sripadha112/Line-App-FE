import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import API_BASE_URL from '../config';

// Navigation ref for programmatic navigation
let navigationRef = null;
let isRedirecting = false; // Flag to prevent multiple redirections

// Function to set navigation reference
export function setNavigationRef(ref) {
  navigationRef = ref;
}

// Helpful debug log so developers can see what base URL was picked at runtime.
try {
  // eslint-disable-next-line no-console
  console.log('[api] API_BASE_URL =', API_BASE_URL);
} catch (e) {}

const api = axios.create({
  baseURL: API_BASE_URL || undefined, // undefined allows relative paths when running in environments where host is same origin
  timeout: 10000,
});

// Request logger - helps show which full URL is being requested
api.interceptors.request.use((cfg) => {
  try { 
    console.log('[api] request', cfg.method, cfg.baseURL ? cfg.baseURL + cfg.url : cfg.url);
    // Log request body for workplace related requests
    if (cfg.url && cfg.url.includes('add-workplaces') && cfg.data) {
      // console.log('[api] request body:', JSON.stringify(cfg.data, null, 2));
    }

    // Debug: log payload for bulk-reschedule to inspect exact shape sent
    if (cfg.url && cfg.url.includes('bulk-reschedule') && cfg.data) {
      try {
        console.log('[api] bulk-reschedule request body:', JSON.stringify(cfg.data, null, 2));
      } catch (e) {
        console.log('[api] bulk-reschedule request body (unserializable)');
      }
    }

    // Debug: log payload for cancel-day requests
    if (cfg.url && cfg.url.includes('cancel-day') && cfg.data) {
      try {
        console.log('[api] cancel-day request body:', JSON.stringify(cfg.data, null, 2));
      } catch (e) {
        console.log('[api] cancel-day request body (unserializable)');
      }
    }
  } catch (e) {}
  return cfg;
}, (err) => {
  try { console.log('[api] request err', err && err.message); } catch (e) {}
  return Promise.reject(err);
});

// Response logger and centralized error augmentation
api.interceptors.response.use((res) => {
  return res;
}, async (err) => {
  try {
    const cfg = err.config || {};
    console.log('[api] response error:', {
      message: err.message,
      url: cfg.baseURL ? cfg.baseURL + cfg.url : cfg.url,
      status: err.response?.status,
      data: err.response?.data,
    });

    // Handle token invalidation
    if (err.response?.status === 401) {
      console.log('[api] 401 Unauthorized - Token expired or invalid');
      
      // Clear stored authentication data
      try {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('userId');
        await SecureStore.deleteItemAsync('fullName');
        await SecureStore.deleteItemAsync('userRole');
        await SecureStore.deleteItemAsync('role');
        
        // Remove auth header
        delete api.defaults.headers.common['Authorization'];
        
        console.log('[api] Cleared stored credentials due to 401 error');
        
        // Navigate to Auth screen if navigation ref is available (with debounce)
        if (navigationRef && navigationRef.reset && !isRedirecting) {
          isRedirecting = true;
          console.log('[api] Redirecting to login due to expired token');
          
          // Show alert and redirect to login
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigationRef.reset({
                    index: 0,
                    routes: [{ name: 'Auth' }],
                  });
                  // Reset flag after navigation
                  setTimeout(() => {
                    isRedirecting = false;
                  }, 2000);
                }
              }
            ],
            { cancelable: false }
          );
        }
        
        // Add a flag to the error to indicate auth was cleared
        err.authCleared = true;
      } catch (clearError) {
        console.log('[api] Error clearing credentials:', clearError);
      }
    }
  } catch (e) {}

  // rethrow so existing try/catch in screens work as before
  return Promise.reject(err);
});

// Helper to override base URL at runtime (useful for testing from a phone)
export function overrideApiBaseUrl(url) {
  api.defaults.baseURL = url;
  try { console.log('[api] override baseURL ->', url); } catch (e) {}
}

export async function setAuthHeaderFromStore() {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  else delete api.defaults.headers.common['Authorization'];
}

// Helper function to clear all authentication data
export async function clearAuthData() {
  try {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('fullName');
    await SecureStore.deleteItemAsync('userRole');
    await SecureStore.deleteItemAsync('role');
    
    // Remove auth header
    delete api.defaults.headers.common['Authorization'];
    
    console.log('[api] Authentication data cleared');
    return true;
  } catch (error) {
    console.log('[api] Error clearing auth data:', error);
    return false;
  }
}

export default api;
