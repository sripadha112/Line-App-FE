/**
 * Backend Warmup Service
 * 
 * Handles warming up the Render backend server on app start to reduce cold start delays.
 * Render free tier spins down after 15 minutes of inactivity and takes 30-60 seconds to wake up.
 */

import API_BASE_URL from '../config';

class WarmupService {
  constructor() {
    this.isWarmedUp = false;
    this.warmupInProgress = false;
    this.lastWarmupTime = null;
    this.WARMUP_COOLDOWN = 5 * 60 * 1000; // 5 minutes - don't warmup again within this time
  }

  /**
   * Ping the backend server to wake it up from cold start
   * Uses a simple health check endpoint that doesn't require authentication
   */
  async warmupBackend() {
    // Skip if already warmed up recently
    if (this.isWarmedUp && this.lastWarmupTime) {
      const timeSinceWarmup = Date.now() - this.lastWarmupTime;
      if (timeSinceWarmup < this.WARMUP_COOLDOWN) {
        console.log('[warmup] ✅ Backend already warm (last warmup:', Math.round(timeSinceWarmup / 1000), 'seconds ago)');
        return { success: true, cached: true };
      }
    }

    // Skip if warmup already in progress
    if (this.warmupInProgress) {
      console.log('[warmup] ⏳ Warmup already in progress');
      return { success: false, message: 'Warmup in progress' };
    }

    this.warmupInProgress = true;
    const startTime = Date.now();

    try {
      console.log('[warmup] 🚀 Starting backend warmup...');
      console.log('[warmup] Target URL:', API_BASE_URL);

      // Use native fetch for warmup to avoid axios interceptors
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (response.ok) {
        this.isWarmedUp = true;
        this.lastWarmupTime = Date.now();
        console.log(`[warmup] ✅ Backend warmup successful (${duration}ms)`);
        return { success: true, duration };
      } else {
        console.log(`[warmup] ⚠️ Backend responded with status ${response.status} (${duration}ms)`);
        // Still consider it warmed up if we got a response
        this.isWarmedUp = true;
        this.lastWarmupTime = Date.now();
        return { success: true, duration, status: response.status };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        console.log('[warmup] ⏰ Warmup timeout after 45 seconds - server may still be starting');
        // Don't mark as warmed up on timeout
        return { success: false, error: 'timeout', duration };
      }
      
      console.log('[warmup] ❌ Warmup failed:', error.message);
      return { success: false, error: error.message, duration };
    } finally {
      this.warmupInProgress = false;
    }
  }

  /**
   * Warmup with silent error handling - suitable for app startup
   */
  async warmupSilently() {
    try {
      const result = await this.warmupBackend();
      return result;
    } catch (error) {
      console.log('[warmup] Silent warmup failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if backend is currently warm
   */
  isBackendWarm() {
    if (!this.lastWarmupTime) return false;
    
    const timeSinceWarmup = Date.now() - this.lastWarmupTime;
    return timeSinceWarmup < this.WARMUP_COOLDOWN;
  }

  /**
   * Reset warmup state (useful for testing or manual refresh)
   */
  reset() {
    this.isWarmedUp = false;
    this.lastWarmupTime = null;
    this.warmupInProgress = false;
    console.log('[warmup] State reset');
  }
}

// Export singleton instance
export default new WarmupService();
