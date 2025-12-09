import * as SecureStore from 'expo-secure-store';
import { Linking, Platform } from 'react-native';
import API_BASE_URL from '../config';

/**
 * Calendar Service for Google Calendar Integration
 * Handles OAuth2 flow, token management, and calendar operations
 */
class CalendarService {
    constructor(baseURL) {
        this.baseURL = baseURL || API_BASE_URL || 'http://localhost:8080'; // ✅ FIXED: Changed from 192.168.1.74 to localhost
        this.accessToken = null;
        this.refreshToken = null;
        this.initializeTokens();
    }

    /**
     * Initialize tokens from secure storage
     */
    async initializeTokens() {
        try {
            this.accessToken = await SecureStore.getItemAsync('google_calendar_token');
            this.refreshToken = await SecureStore.getItemAsync('google_calendar_refresh_token');
            
            console.log('🔐 [CalendarService] Tokens initialized:');
            console.log('📱 Access Token:', this.accessToken ? `${this.accessToken.substring(0, 20)}...` : 'null');
            console.log('🔄 Refresh Token:', this.refreshToken ? `${this.refreshToken.substring(0, 20)}...` : 'null');
        } catch (error) {
            console.error('[CalendarService] Error initializing tokens:', error);
        }
    }

    /**
     * Start Google Calendar OAuth2 flow
     */
    async initializeGoogleCalendar() {
        try {
            console.log('🔗 [CalendarService] Requesting Google auth URL...');
            console.log('🌐 [CalendarService] Backend URL:', this.baseURL);
            
            // Get OAuth2 authorization URL from backend
            const response = await fetch(`${this.baseURL}/api/oauth2/google/auth-url`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': Platform.OS === 'web' ? window.location.origin : 'http://localhost'
                },
                mode: 'cors',
                credentials: 'same-origin'
            });

            console.log('📡 [CalendarService] Auth URL response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [CalendarService] Auth URL request failed:', errorText);
                
                if (response.status === 401) {
                    throw new Error('Calendar service authentication not configured on server');
                } else if (response.status === 404) {
                    throw new Error('Calendar service not available on server');
                }
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const text = await response.text();
            if (!text) {
                throw new Error('Empty response from server');
            }

            const data = JSON.parse(text);
            console.log('[CalendarService] Auth URL response:', data);

            if (data.authUrl) {
                // Open the authorization URL in the system browser
                const supported = await Linking.canOpenURL(data.authUrl);
                if (supported) {
                    await Linking.openURL(data.authUrl);
                    return true;
                } else {
                    throw new Error('Cannot open authorization URL');
                }
            } else {
                throw new Error(data.error || 'Failed to get authorization URL');
            }
        } catch (error) {
            console.error('[CalendarService] Failed to initialize Google Calendar:', error);
            throw error;
        }
    }

    /**
     * Handle OAuth callback with authorization code
     * @param {string} authorizationCode - Authorization code from Google
     */
    async handleOAuthCallback(authorizationCode) {
        try {
            console.log('🔄 [CalendarService] Processing OAuth callback...');
            console.log('📝 Authorization code present:', !!authorizationCode);
            console.log('🌐 Backend URL:', this.baseURL);
            
            // Exchange authorization code for access token
            const response = await fetch(`${this.baseURL}/api/oauth2/google/callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': Platform.OS === 'web' ? window.location.origin : 'http://localhost'
                },
                body: JSON.stringify({ 
                    code: authorizationCode,
                    deviceType: this.detectDeviceType()
                }),
                mode: 'cors',
                credentials: 'same-origin'
            });

            console.log('📡 [CalendarService] Token exchange response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [CalendarService] Token exchange failed:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const text = await response.text();
            if (!text) {
                throw new Error('Empty response from server');
            }

            const data = JSON.parse(text);
            console.log('[CalendarService] Callback response:', data);

            if (data.accessToken) {
                // Store tokens securely
                await this.storeTokens(data.accessToken, data.refreshToken, data.expiresIn);
                return true;
            } else {
                throw new Error(data.error || 'Failed to get access token');
            }
        } catch (error) {
            console.error('[CalendarService] OAuth callback failed:', error);
            throw error;
        }
    }

    /**
     * Store tokens securely
     */
    async storeTokens(accessToken, refreshToken, expiresIn) {
        try {
            console.log('💾 [CalendarService] Storing new tokens:');
            console.log('📱 New Access Token:', accessToken ? `${accessToken.substring(0, 30)}...` : 'null');
            console.log('🔄 New Refresh Token:', refreshToken ? `${refreshToken.substring(0, 30)}...` : 'null');
            console.log('⏰ Expires In:', expiresIn, 'seconds');
            console.log('📅 Expires At:', new Date(Date.now() + (expiresIn * 1000)).toISOString());
            
            await SecureStore.setItemAsync('google_calendar_token', accessToken);
            await SecureStore.setItemAsync('google_calendar_refresh_token', refreshToken);
            await SecureStore.setItemAsync('calendar_token_expires', 
                (Date.now() + (expiresIn * 1000)).toString()
            );

            this.accessToken = accessToken;
            this.refreshToken = refreshToken;

            console.log('✅ [CalendarService] Tokens stored successfully');
        } catch (error) {
            console.error('[CalendarService] Error storing tokens:', error);
            throw error;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            console.log('🔄 [CalendarService] Refreshing access token...');
            console.log('🔑 Refresh token:', this.refreshToken ? `${this.refreshToken.substring(0, 30)}...` : 'null');
            
            const response = await fetch(`${this.baseURL}/api/oauth2/google/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': Platform.OS === 'web' ? window.location.origin : 'http://localhost'
                },
                body: JSON.stringify({ 
                    refreshToken: this.refreshToken,
                    deviceType: this.detectDeviceType()
                }),
                mode: 'cors',
                credentials: 'same-origin'
            });

            console.log('📡 [CalendarService] Refresh response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [CalendarService] Refresh request failed:', errorText);
                
                // Handle 401 - invalid refresh token
                if (response.status === 401) {
                    console.log('🗑️ Invalid refresh token, clearing all tokens...');
                    await this.clearTokens();
                    throw new Error('Refresh token expired - please re-authenticate');
                }
                
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const text = await response.text();
            if (!text) {
                throw new Error('Empty response from server');
            }

            const data = JSON.parse(text);
            console.log('✅ [CalendarService] Token refreshed successfully');

            if (data.accessToken) {
                await SecureStore.setItemAsync('google_calendar_token', data.accessToken);
                await SecureStore.setItemAsync('calendar_token_expires', 
                    (Date.now() + (data.expiresIn * 1000)).toString()
                );
                
                this.accessToken = data.accessToken;
                console.log('💾 [CalendarService] New token stored');
                return data.accessToken;
            } else {
                throw new Error(data.error || 'Failed to refresh token');
            }
        } catch (error) {
            console.error('❌ [CalendarService] Token refresh failed:', error);
            
            // Clear invalid tokens for 401 errors
            if (error.message.includes('401') || error.message.includes('expired')) {
                console.log('🗑️ Clearing invalid tokens...');
                await this.clearTokens();
            }
            
            throw error;
        }
    }

    /**
     * Get valid access token (refresh if needed)
     */
    async getValidAccessToken() {
        try {
            console.log('🔍 [CalendarService] Getting valid access token...');
            
            // Ensure tokens are loaded
            if (!this.accessToken) {
                console.log('📱 No access token in memory, loading from storage...');
                await this.initializeTokens();
            }

            if (!this.accessToken) {
                console.log('❌ No access token available');
                return null; // No token available
            }

            // Check if token is expired
            const expiresAt = await SecureStore.getItemAsync('calendar_token_expires');
            const now = Date.now();
            
            console.log('⏰ Token expiry check:');
            console.log('📅 Current time:', new Date(now).toISOString());
            console.log('📅 Token expires at:', expiresAt ? new Date(parseInt(expiresAt)).toISOString() : 'unknown');

            if (expiresAt && now >= parseInt(expiresAt)) {
                console.log('🔄 Token expired, refreshing...');
                try {
                    return await this.refreshAccessToken();
                } catch (error) {
                    console.log('❌ Refresh failed:', error);
                    return null;
                }
            }

            console.log('✅ Using existing valid token:', this.accessToken ? `${this.accessToken.substring(0, 30)}...` : 'null');
            return this.accessToken;
        } catch (error) {
            console.error('[CalendarService] Error getting valid token:', error);
            return null;
        }
    }

    /**
     * Check if calendar is connected
     */
    async isCalendarConnected() {
        const token = await this.getValidAccessToken();
        return !!token;
    }

    /**
     * Clear all stored tokens
     */
    async clearTokens() {
        try {
            await SecureStore.deleteItemAsync('google_calendar_token');
            await SecureStore.deleteItemAsync('google_calendar_refresh_token');
            await SecureStore.deleteItemAsync('calendar_token_expires');
            
            this.accessToken = null;
            this.refreshToken = null;
            
            console.log('[CalendarService] Tokens cleared successfully');
        } catch (error) {
            console.error('[CalendarService] Error clearing tokens:', error);
        }
    }

    /**
     * Detect device type for calendar integration
     */
    detectDeviceType() {
        return Platform.OS === 'ios' ? 'ios' : 'android';
    }

    /**
     * Get calendar integration headers for API requests
     */
    async getCalendarHeaders() {
        const token = await this.getValidAccessToken();
        console.log('📡 [CalendarService] Generating calendar headers:');
        console.log('🔑 Token for headers:', token ? `${token.substring(0, 30)}...` : 'null');
        console.log('📱 Device type:', this.detectDeviceType());
        
        if (!token) {
            console.log('❌ No token available for headers');
            return {};
        }

        const headers = {
            'X-Calendar-Token': token,
            'X-Device-Type': this.detectDeviceType()
        };
        
        console.log('📤 Calendar headers generated:', headers);
        return headers;
    }

    /**
     * Get calendar integration data for API request body
     */
    async getCalendarData() {
        const token = await this.getValidAccessToken();
        console.log('📦 [CalendarService] Generating calendar data:');
        console.log('🔑 Token for body:', token ? `${token.substring(0, 30)}...` : 'null');
        console.log('📱 Device type:', this.detectDeviceType());
        
        if (!token) {
            console.log('❌ No token available for request body');
            return {};
        }

        const data = {
            userCalendarAccessToken: token,
            deviceType: this.detectDeviceType()
        };
        
        console.log('📤 Calendar data generated:', { ...data, userCalendarAccessToken: `${token.substring(0, 30)}...` });
        return data;
    }

    /**
     * Handle deep linking for OAuth callback
     */
    async handleDeepLink(url) {
        try {
            console.log('[CalendarService] Handling deep link:', url);
            
            if (url && url.includes('code=')) {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const authorizationCode = urlParams.get('code');
                const error = urlParams.get('error');

                if (error) {
                    throw new Error(`OAuth error: ${error}`);
                }

                if (authorizationCode) {
                    await this.handleOAuthCallback(authorizationCode);
                    return { success: true, message: 'Calendar connected successfully!' };
                }
            }
            
            return { success: false, message: 'Invalid callback URL' };
        } catch (error) {
            console.error('[CalendarService] Deep link handling failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Test calendar connection
     */
    async testConnection() {
        try {
            console.log('🧪 [CalendarService] Testing calendar connection...');
            const token = await this.getValidAccessToken();
            if (!token) {
                console.log('❌ No calendar token available for testing');
                return { connected: false, message: 'No calendar token available' };
            }

            // Test the connection by making a simple API call
            const calendarHeaders = await this.getCalendarHeaders();
            const response = await fetch(`${this.baseURL}/api/calendar/test`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': Platform.OS === 'web' ? window.location.origin : 'http://localhost',
                    ...calendarHeaders
                },
                mode: 'cors',
                credentials: 'same-origin'
            });

            console.log('📡 [CalendarService] Test response status:', response.status);

            if (response.ok) {
                console.log('✅ [CalendarService] Calendar connection active');
                return { connected: true, message: 'Calendar connection active' };
            } else if (response.status === 401) {
                console.log('🔄 [CalendarService] Token expired during test, clearing tokens...');
                await this.clearTokens();
                return { connected: false, message: 'Calendar token expired - please re-authenticate' };
            } else {
                const errorText = await response.text();
                console.log('❌ [CalendarService] Connection test failed:', errorText);
                return { connected: false, message: `Calendar connection failed: ${errorText}` };
            }
        } catch (error) {
            console.error('❌ [CalendarService] Connection test failed:', error);
            
            // Handle 401 errors by clearing tokens
            if (error.message.includes('401')) {
                console.log('🗑️ Clearing tokens due to 401 error...');
                await this.clearTokens();
            }
            
            return { connected: false, message: error.message };
        }
    }
}

// Create singleton instance
const calendarService = new CalendarService();

export default calendarService;
export { CalendarService };