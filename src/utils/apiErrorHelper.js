/**
 * API Error Helper
 * 
 * Provides user-friendly error messages for different API error scenarios
 */

export class APIErrorHelper {
  /**
   * Get a user-friendly error message based on the error type
   */
  static getUserFriendlyMessage(error) {
    // No response - network error
    if (!error.response) {
      // Check specific error codes
      if (error.code === 'ECONNABORTED') {
        return {
          title: 'Server Starting',
          message: 'The server is waking up. This may take up to 30 seconds. Please wait...',
          canRetry: true,
          isTemporary: true,
        };
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return {
          title: 'Connection Failed',
          message: 'Unable to reach the server. Please check your internet connection and try again.',
          canRetry: true,
          isTemporary: true,
        };
      }
      
      if (error.code === 'ERR_NETWORK') {
        return {
          title: 'Network Error',
          message: 'Please check your internet connection and try again.',
          canRetry: true,
          isTemporary: true,
        };
      }
      
      // Generic network error
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        canRetry: true,
        isTemporary: true,
      };
    }
    
    // Has response - server error
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        return {
          title: 'Invalid Request',
          message: data?.message || 'The request contains invalid data. Please check and try again.',
          canRetry: false,
          isTemporary: false,
        };
      
      case 401:
        return {
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again.',
          canRetry: false,
          isTemporary: false,
          requiresAuth: true,
        };
      
      case 403:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to access this resource.',
          canRetry: false,
          isTemporary: false,
        };
      
      case 404:
        return {
          title: 'Not Found',
          message: data?.message || 'The requested resource was not found.',
          canRetry: false,
          isTemporary: false,
        };
      
      case 408:
        return {
          title: 'Request Timeout',
          message: 'The request took too long. Please try again.',
          canRetry: true,
          isTemporary: true,
        };
      
      case 429:
        return {
          title: 'Too Many Requests',
          message: 'You are making too many requests. Please wait a moment and try again.',
          canRetry: true,
          isTemporary: true,
        };
      
      case 500:
        return {
          title: 'Server Error',
          message: 'An error occurred on the server. Please try again later.',
          canRetry: true,
          isTemporary: true,
        };
      
      case 502:
        return {
          title: 'Bad Gateway',
          message: 'The server is temporarily unavailable. Please try again in a moment.',
          canRetry: true,
          isTemporary: true,
        };
      
      case 503:
        return {
          title: 'Service Unavailable',
          message: 'The server is temporarily unavailable. Please try again in a moment.',
          canRetry: true,
          isTemporary: true,
        };
      
      case 504:
        return {
          title: 'Gateway Timeout',
          message: 'The server took too long to respond. Please try again.',
          canRetry: true,
          isTemporary: true,
        };
      
      default:
        return {
          title: 'Error',
          message: data?.message || `An error occurred (${status}). Please try again.`,
          canRetry: true,
          isTemporary: true,
        };
    }
  }
  
  /**
   * Log error details for debugging
   */
  static logError(context, error) {
    console.group(`[APIError] ${context}`);
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('URL:', error.config?.url);
    console.log('Method:', error.config?.method);
    console.groupEnd();
  }
  
  /**
   * Check if error is retryable
   */
  static isRetryable(error) {
    // Network errors
    if (!error.response) {
      return ['ECONNABORTED', 'ECONNREFUSED', 'ETIMEDOUT', 'ERR_NETWORK'].includes(error.code);
    }
    
    // Server errors that are retryable
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.response.status);
  }
  
  /**
   * Get suggested wait time before retry (in milliseconds)
   */
  static getRetryDelay(error, attemptNumber = 1) {
    // For rate limiting (429), wait longer
    if (error.response?.status === 429) {
      return 5000; // 5 seconds
    }
    
    // For cold starts (ECONNABORTED), wait progressively longer
    if (error.code === 'ECONNABORTED') {
      return Math.min(2000 * Math.pow(2, attemptNumber - 1), 10000); // Max 10s
    }
    
    // Default exponential backoff
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 8000); // Max 8s
  }
  
  /**
   * Format error for display in Alert
   */
  static formatForAlert(error) {
    const friendly = this.getUserFriendlyMessage(error);
    return {
      title: friendly.title,
      message: friendly.message,
      buttons: friendly.canRetry 
        ? [{ text: 'Cancel' }, { text: 'Retry' }]
        : [{ text: 'OK' }],
    };
  }
}

export default APIErrorHelper;
