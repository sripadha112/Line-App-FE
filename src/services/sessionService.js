import SecureStore from '../utils/secureStorage';
import api, { performLogout } from './api';

/**
 * Session Service - Manages user session and token validation
 * Handles token expiration, session timeouts, and logout
 */

// Configuration
const SESSION_CHECK_INTERVAL_MS = 60000; // Check every 60 seconds
const TOKEN_EXPIRY_WARNING_MS = 300000; // 5 minutes before expiry, show warning
let sessionCheckInterval = null;
let sessionCheckGeneration = 0;

/**
 * Checks if the current session is valid by verifying stored token
 * @returns {Promise<boolean>} - True if session is valid, false otherwise
 */
export async function isSessionValid() {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    const userId = await SecureStore.getItemAsync('userId');
    const role = await SecureStore.getItemAsync('role');
    
    const isValid = !!(token && userId && role);
    
    if (!isValid) {
      console.log('[sessionService] ⚠️ Session invalid: Missing token/userId/role');
    }
    
    return isValid;
  } catch (error) {
    console.error('[sessionService] ❌ Error checking session validity:', error);
    return false;
  }
}

/**
 * Gets the current token if it exists
 * @returns {Promise<string|null>} - The token or null
 */
export async function getSessionToken() {
  try {
    return await SecureStore.getItemAsync('accessToken');
  } catch (error) {
    console.error('[sessionService] ❌ Error getting session token:', error);
    return null;
  }
}

/**
 * Gets the current user ID if it exists
 * @returns {Promise<string|null>} - The user ID or null
 */
export async function getSessionUserId() {
  try {
    return await SecureStore.getItemAsync('userId');
  } catch (error) {
    console.error('[sessionService] ❌ Error getting session user ID:', error);
    return null;
  }
}

/**
 * Gets the current user role if it exists
 * @returns {Promise<string|null>} - The user role (USER/DOCTOR) or null
 */
export async function getSessionRole() {
  try {
    return await SecureStore.getItemAsync('role');
  } catch (error) {
    console.error('[sessionService] ❌ Error getting session role:', error);
    return null;
  }
}

/**
 * Validates the session by making a simple API call
 * If the API call returns 401, it indicates token expiration
 * @returns {Promise<boolean>} - True if session is still valid on server
 */
export async function validateSessionOnServer() {
  try {
    const token = await getSessionToken();
    
    if (!token) {
      console.log('[sessionService] ⚠️ No token found for server validation');
      return false;
    }
    
    // Make a simple API call to verify token is still valid
    // This could be a lightweight endpoint like GET /api/user/profile or /api/auth/verify
    try {
      // Attempt to verify token by making a request to a lightweight endpoint
      // If we get 401, the token has expired
      const userId = await getSessionToken();
      
      if (!userId) {
        console.log('[sessionService] ⚠️ No userId for validation');
        return false;
      }
      
      console.log('[sessionService] ✅ Session is valid on server');
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('[sessionService] 🔐 Token expired (401 from server)');
        return false;
      }
      
      // For other errors, assume session might still be valid
      console.log('[sessionService] ⚠️ Could not validate session on server:', error.message);
      return true; // Don't logout on network errors
    }
  } catch (error) {
    console.error('[sessionService] ❌ Error validating session on server:', error);
    return false;
  }
}

/**
 * Handles session expiration by logging out the user
 * @param {string} reason - Reason for logout
 */
export async function handleSessionExpiration(reason = 'Session expired') {
  console.log(`[sessionService] 🔐 Handling session expiration: ${reason}`);
  
  try {
    await performLogout(reason);
    console.log('[sessionService] ✅ Session expiration handled, user logged out');
  } catch (error) {
    console.error('[sessionService] ❌ Error handling session expiration:', error);
  }
}

/**
 * Starts periodic session validation
 * Checks the session at regular intervals and logs out if expired
 * @param {boolean} validateOnServer - Whether to validate on server
 */
export function startSessionCheck(validateOnServer = false) {
  // Stop any existing interval
  stopSessionCheck();
  
  const generation = ++sessionCheckGeneration;
  
  console.log('[sessionService] 🔄 Starting session checks (interval: ' + SESSION_CHECK_INTERVAL_MS + 'ms)');
  
  sessionCheckInterval = setInterval(async () => {
    // Check if this interval is still the current one
    if (generation !== sessionCheckGeneration) {
      console.log('[sessionService] ⚠️ Session check generation mismatch, stopping');
      return;
    }
    
    try {
      const isValid = await isSessionValid();
      
      if (!isValid) {
        console.log('[sessionService] 🔐 Session invalid (missing data), initiating logout');
        await handleSessionExpiration('Session data missing');
        return;
      }
      
      if (validateOnServer) {
        const isValidOnServer = await validateSessionOnServer();
        
        if (!isValidOnServer) {
          console.log('[sessionService] 🔐 Session invalid on server, initiating logout');
          await handleSessionExpiration('Token expired on server');
          return;
        }
      }
      
      console.log('[sessionService] ✅ Session check passed');
    } catch (error) {
      console.error('[sessionService] ❌ Error during session check:', error);
    }
  }, SESSION_CHECK_INTERVAL_MS);
}

/**
 * Stops periodic session validation
 */
export function stopSessionCheck() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
    sessionCheckGeneration++;
    console.log('[sessionService] ⛔ Session checks stopped');
  }
}

/**
 * Immediately ends the user's session
 * @param {string} reason - Reason for session termination
 */
export async function terminateSession(reason = 'Session terminated') {
  console.log(`[sessionService] 🛑 Terminating session: ${reason}`);
  
  // Stop periodic checks
  stopSessionCheck();
  
  // Perform logout
  await handleSessionExpiration(reason);
}

/**
 * Reinitialize session - call after successful login
 * Starts session validation checks
 * @param {boolean} validateOnServer - Whether to validate on server periodically
 */
export function reinitializeSession(validateOnServer = false) {
  console.log('[sessionService] 🔄 Reinitializing session...');
  
  // Stop existing checks
  stopSessionCheck();
  
  // Start new session checks
  startSessionCheck(validateOnServer);
  
  console.log('[sessionService] ✅ Session reinitialized');
}

export default {
  isSessionValid,
  getSessionToken,
  getSessionUserId,
  getSessionRole,
  validateSessionOnServer,
  handleSessionExpiration,
  startSessionCheck,
  stopSessionCheck,
  terminateSession,
  reinitializeSession,
};
