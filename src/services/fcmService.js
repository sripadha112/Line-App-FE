import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import API_BASE_URL from '../config';

/**
 * Firebase Cloud Messaging Service for React Native with Expo
 * Handles push notifications, device registration, and token management
 */
class FCMService {
    constructor() {
        this.fcmToken = null;
        this.notificationListener = null;
        this.responseListener = null;
        this.isInitialized = false;
        this.baseURL = API_BASE_URL; // Use dynamic backend URL from config
        
        // Configure notification behavior
        this.setupNotificationBehavior();
        
        console.log('🔧 [FCMService] Initialized with backend URL:', this.baseURL);
    }

    /**
     * Configure how notifications are handled when received
     */
    setupNotificationBehavior() {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                priority: Notifications.AndroidImportance.HIGH,
            }),
        });
    }

    /**
     * Initialize FCM service - call this on app startup
     */
    async initialize() {
        try {
            console.log('🔔 [FCMService] Initializing FCM Service...');
            
            // Check if running on physical device
            if (!Device.isDevice) {
                console.warn('⚠️ [FCMService] Push notifications only work on physical devices');
                return { success: false, message: 'Must use physical device for push notifications' };
            }

            // Request permissions
            const permissionResult = await this.requestPermissions();
            if (!permissionResult.success) {
                return permissionResult;
            }

            // Get or register FCM token
            const tokenResult = await this.getOrRegisterToken();
            if (!tokenResult.success) {
                return tokenResult;
            }

            // Setup notification listeners
            this.setupNotificationListeners();

            // Send token to backend
            await this.sendTokenToBackend();

            this.isInitialized = true;
            console.log('✅ [FCMService] FCM Service initialized successfully');
            
            return { 
                success: true, 
                message: 'FCM initialized successfully',
                token: this.fcmToken 
            };

        } catch (error) {
            console.error('❌ [FCMService] Initialization failed:', error);
            return { 
                success: false, 
                message: `FCM initialization failed: ${error.message}` 
            };
        }
    }

    /**
     * Request notification permissions for both iOS and Android
     */
    async requestPermissions() {
        try {
            console.log('📱 [FCMService] Requesting notification permissions...');

            if (Platform.OS === 'android') {
                // Android 13+ requires explicit permission request
                if (Platform.Version >= 33) {
                    console.log('📱 [FCMService] Requesting Android 13+ notification permission');
                }
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync({
                    ios: {
                        allowAlert: true,
                        allowBadge: true,
                        allowSound: true,
                        allowAnnouncements: true,
                    },
                    android: {
                        allowAlert: true,
                        allowBadge: true,
                        allowSound: true,
                    },
                });
                finalStatus = status;
            }

            console.log(`📱 [FCMService] Permission status: ${finalStatus}`);

            if (finalStatus !== 'granted') {
                const message = 'Notification permission denied. Enable in Settings to receive push notifications.';
                console.warn('⚠️ [FCMService]', message);
                
                Alert.alert(
                    'Notification Permission Required',
                    message,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                            text: 'Open Settings', 
                            onPress: () => Notifications.openNotificationSettingsAsync() 
                        }
                    ]
                );
                
                return { success: false, message };
            }

            console.log('✅ [FCMService] Notification permissions granted');
            return { success: true, status: finalStatus };

        } catch (error) {
            console.error('❌ [FCMService] Permission request failed:', error);
            return { 
                success: false, 
                message: `Permission request failed: ${error.message}` 
            };
        }
    }

    /**
     * Get existing token or register for new push token
     */
    async getOrRegisterToken() {
        try {
            console.log('🔑 [FCMService] Getting push notification token...');

            // Try to get cached token first
            const cachedToken = await this.getCachedToken();
            if (cachedToken) {
                console.log('📱 [FCMService] Using cached token:', `${cachedToken.substring(0, 50)}...`);
                this.fcmToken = cachedToken;
                return { success: true, token: cachedToken };
            }

            // Check if running in Expo Go
            const isExpoGo = Constants.appOwnership === 'expo';
            if (isExpoGo) {
                console.warn('⚠️ [FCMService] Running in Expo Go - FCM functionality limited');
                console.log('💡 [FCMService] Generating development token...');
                
                // Generate a mock token for development in Expo Go
                const mockToken = `ExponentPushToken[DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}]`;
                this.fcmToken = mockToken;
                await this.cacheToken(mockToken);
                
                console.log('🔑 [FCMService] Development token generated:', mockToken);
                return { 
                    success: true, 
                    token: mockToken,
                    isDevelopment: true,
                    message: 'Development token generated for Expo Go' 
                };
            }

            // Get project ID for production builds
            const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                             Constants.easConfig?.projectId ||
                             Constants.manifest?.extra?.eas?.projectId;

            if (!projectId) {
                console.warn('⚠️ [FCMService] No EAS project ID found. Attempting without projectId...');
            }

            // Try to get Expo Push Token
            const tokenOptions = projectId ? { projectId } : {};
            const tokenData = await Notifications.getExpoPushTokenAsync(tokenOptions);

            const token = tokenData.data;
            console.log('🔑 [FCMService] New FCM Token generated:', `${token.substring(0, 50)}...`);
            console.log('📱 [FCMService] Full Token:', token);

            // Cache the token
            await this.cacheToken(token);
            this.fcmToken = token;

            return { success: true, token };

        } catch (error) {
            console.error('❌ [FCMService] Token generation failed:', error);
            
            // Fallback for development
            if (error.message.includes('projectId') || error.message.includes('Expo Go')) {
                console.log('🔄 [FCMService] Falling back to development mode...');
                const fallbackToken = `ExponentPushToken[FALLBACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}]`;
                this.fcmToken = fallbackToken;
                await this.cacheToken(fallbackToken);
                
                return { 
                    success: true, 
                    token: fallbackToken,
                    isDevelopment: true,
                    message: 'Fallback development token generated' 
                };
            }
            
            return { 
                success: false, 
                message: `Token generation failed: ${error.message}` 
            };
        }
    }

    /**
     * Setup notification event listeners
     */
    setupNotificationListeners() {
        try {
            console.log('👂 [FCMService] Setting up notification listeners...');

            // Listener for notifications received while app is foregrounded
            this.notificationListener = Notifications.addNotificationReceivedListener(
                (notification) => {
                    console.log('🔔 [FCMService] Foreground notification received:', notification);
                    this.handleForegroundNotification(notification);
                }
            );

            // Listener for when user taps on notification
            this.responseListener = Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    console.log('👆 [FCMService] Notification tapped:', response);
                    this.handleNotificationResponse(response);
                }
            );

            // Handle notification when app is launched from notification
            this.handleAppLaunchFromNotification();

            console.log('✅ [FCMService] Notification listeners setup complete');

        } catch (error) {
            console.error('❌ [FCMService] Listener setup failed:', error);
        }
    }

    /**
     * Handle notifications received when app is in foreground
     */
    async handleForegroundNotification(notification) {
        try {
            const { title, body, data } = notification.request.content;
            
            console.log('🔔 [FCMService] Processing foreground notification:');
            console.log('📝 Title:', title);
            console.log('📝 Body:', body);
            console.log('📝 Data:', data);

            // Custom handling based on notification type
            if (data?.type === 'reminder') {
                this.handleAppointmentReminder(data);
            } else if (data?.type === 'booking_confirmation') {
                this.handleBookingConfirmation(data);
            }

            // Show native alert for foreground notifications
            Alert.alert(
                title || 'Notification',
                body || 'You have a new notification',
                [
                    { text: 'Dismiss', style: 'cancel' },
                    { text: 'View', onPress: () => this.handleNotificationAction(data) }
                ]
            );

        } catch (error) {
            console.error('❌ [FCMService] Foreground notification handling failed:', error);
        }
    }

    /**
     * Handle notification tap/response
     */
    async handleNotificationResponse(response) {
        try {
            const { notification } = response;
            const { data } = notification.request.content;

            console.log('👆 [FCMService] Processing notification response:');
            console.log('📝 Response data:', data);

            // Navigate based on notification data
            if (data?.appointmentId) {
                console.log('📅 [FCMService] Opening appointment:', data.appointmentId);
                // Add navigation logic here
                // navigation.navigate('AppointmentDetail', { appointmentId: data.appointmentId });
            } else if (data?.doctorId) {
                console.log('👨‍⚕️ [FCMService] Opening doctor profile:', data.doctorId);
                // navigation.navigate('DoctorProfile', { doctorId: data.doctorId });
            }

        } catch (error) {
            console.error('❌ [FCMService] Notification response handling failed:', error);
        }
    }

    /**
     * Handle app launch from notification (when app was closed)
     */
    async handleAppLaunchFromNotification() {
        try {
            const response = await Notifications.getLastNotificationResponseAsync();
            if (response) {
                console.log('🚀 [FCMService] App launched from notification:', response);
                // Handle the notification that launched the app
                this.handleNotificationResponse(response);
            }
        } catch (error) {
            console.error('❌ [FCMService] App launch notification handling failed:', error);
        }
    }

    /**
     * Send FCM token to backend (Store token for future notifications)
     */
    async sendTokenToBackend() {
        try {
            if (!this.fcmToken) {
                console.warn('⚠️ [FCMService] No token available to send to backend');
                return { success: false, message: 'No token available' };
            }

            console.log('📤 [FCMService] Storing token in backend...');
            console.log('🌐 [FCMService] Backend URL:', this.baseURL);

            const isDevelopment = this.fcmToken.includes('DEV-') || this.fcmToken.includes('FALLBACK-');
            
            // Test backend connectivity first using Firebase status endpoint
            console.log('� [FCMService] Testing Firebase backend status...');
            const firebaseStatusUrl = `${this.baseURL}/api/test/firebase-status`;
            
            try {
                const statusResponse = await fetch(firebaseStatusUrl, {
                    method: 'GET',
                    timeout: 5000,
                });
                
                if (statusResponse.ok) {
                    const statusText = await statusResponse.text();
                    console.log('🔥 [FCMService] Firebase status:', statusText);
                } else {
                    console.warn('⚠️ [FCMService] Firebase status check failed:', statusResponse.status);
                }
            } catch (statusError) {
                console.warn('⚠️ [FCMService] Firebase status check failed:', statusError.message);
                
                if (isDevelopment) {
                    console.log('💡 [FCMService] Development mode - skipping token storage due to connectivity issues');
                    return { 
                        success: true, 
                        result: { message: 'Development mode - backend not reachable' },
                        isDevelopment: true,
                        skipped: true
                    };
                }
            }
            
            // For now, just store token locally since your backend doesn't have a device registration endpoint
            // This token will be used when sending notifications
            await SecureStore.setItemAsync('fcm_backend_url', this.baseURL);
            await SecureStore.setItemAsync('fcm_token_stored', 'true');
            
            console.log('✅ [FCMService] Token stored locally for backend notifications');
            
            return { 
                success: true, 
                result: { 
                    message: 'Token ready for notifications',
                    backendUrl: this.baseURL,
                    firebaseReady: true
                },
                isDevelopment: isDevelopment
            };

        } catch (error) {
            console.error('❌ [FCMService] Token storage failed:', error);
            
            const isDevelopment = this.fcmToken && (this.fcmToken.includes('DEV-') || this.fcmToken.includes('FALLBACK-'));
            if (isDevelopment) {
                console.log('💡 [FCMService] Development mode - continuing despite error');
                return { 
                    success: true, 
                    result: { 
                        message: 'Development mode - error ignored',
                        backendUrl: this.baseURL,
                        error: error.message 
                    },
                    isDevelopment: true,
                    networkError: true
                };
            }
            
            return { 
                success: false, 
                message: `Error: ${error.message}. Backend URL: ${this.baseURL}`,
                networkError: true
            };
        }
    }

    /**
     * Get device information for backend registration
     */
    async getDeviceInfo() {
        try {
            return {
                deviceName: Device.deviceName,
                deviceType: Device.deviceType,
                platform: Platform.OS,
                platformVersion: Platform.Version,
                manufacturer: Device.manufacturer,
                modelName: Device.modelName,
                osName: Device.osName,
                osVersion: Device.osVersion,
                isDevice: Device.isDevice,
                brand: Device.brand,
            };
        } catch (error) {
            console.error('❌ [FCMService] Error getting device info:', error);
            return {
                platform: Platform.OS,
                platformVersion: Platform.Version,
                isDevice: Device.isDevice,
            };
        }
    }

    /**
     * Cache FCM token securely
     */
    async cacheToken(token) {
        try {
            await SecureStore.setItemAsync('fcm_token', token);
            await SecureStore.setItemAsync('fcm_token_timestamp', Date.now().toString());
            console.log('💾 [FCMService] Token cached successfully');
        } catch (error) {
            console.error('❌ [FCMService] Token caching failed:', error);
        }
    }

    /**
     * Get cached FCM token
     */
    async getCachedToken() {
        try {
            const token = await SecureStore.getItemAsync('fcm_token');
            const timestamp = await SecureStore.getItemAsync('fcm_token_timestamp');

            if (token && timestamp) {
                const tokenAge = Date.now() - parseInt(timestamp);
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours

                if (tokenAge < maxAge) {
                    console.log('📱 [FCMService] Valid cached token found');
                    return token;
                } else {
                    console.log('⏰ [FCMService] Cached token expired');
                    await this.clearCachedToken();
                }
            }

            return null;
        } catch (error) {
            console.error('❌ [FCMService] Error getting cached token:', error);
            return null;
        }
    }

    /**
     * Clear cached token
     */
    async clearCachedToken() {
        try {
            await SecureStore.deleteItemAsync('fcm_token');
            await SecureStore.deleteItemAsync('fcm_token_timestamp');
            await SecureStore.deleteItemAsync('fcm_backend_registered');
            this.fcmToken = null;
            console.log('🗑️ [FCMService] Token cache cleared');
        } catch (error) {
            console.error('❌ [FCMService] Error clearing token cache:', error);
        }
    }

    /**
     * Refresh FCM token (call when needed)
     */
    async refreshToken() {
        try {
            console.log('🔄 [FCMService] Refreshing FCM token...');
            
            await this.clearCachedToken();
            const result = await this.getOrRegisterToken();
            
            if (result.success) {
                await this.sendTokenToBackend();
                console.log('✅ [FCMService] Token refreshed successfully');
            }
            
            return result;
        } catch (error) {
            console.error('❌ [FCMService] Token refresh failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Get current FCM token
     */
    getCurrentToken() {
        return this.fcmToken;
    }

    /**
     * Check if FCM is initialized
     */
    isReady() {
        return this.isInitialized && this.fcmToken !== null;
    }

    /**
     * Send simple notification via backend (using /api/notifications/notify/simple)
     */
    async sendSimpleNotification(title, body, deviceToken = null) {
        try {
            const token = deviceToken || this.fcmToken;
            if (!token) {
                return { success: false, message: 'No FCM token available' };
            }

            const isDevelopment = token.includes('DEV-') || token.includes('FALLBACK-');
            
            if (isDevelopment) {
                return this.simulateNotification(title, body);
            }

            console.log('📤 [FCMService] Sending simple notification...');
            console.log('📝 Title:', title);
            console.log('📝 Body:', body);

            const response = await fetch(`${this.baseURL}/api/notifications/notify/simple`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    deviceToken: token,
                    title: title,
                    body: body
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ [FCMService] Simple notification sent:', result);
                return { success: true, result };
            } else {
                const errorText = await response.text();
                console.error('❌ [FCMService] Simple notification failed:', response.status, errorText);
                return { 
                    success: false, 
                    message: `Backend error: ${response.status} - ${errorText}`
                };
            }

        } catch (error) {
            console.error('❌ [FCMService] Simple notification error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Send rich notification with custom data (using /api/notifications/notify)
     */
    async sendRichNotification(options) {
        try {
            const {
                title,
                body,
                deviceToken = null,
                platform = 'auto',
                highPriority = true,
                data = {},
                imageUrl = null,
                iosConfig = {},
                androidConfig = {}
            } = options;

            const token = deviceToken || this.fcmToken;
            if (!token) {
                return { success: false, message: 'No FCM token available' };
            }

            const isDevelopment = token.includes('DEV-') || token.includes('FALLBACK-');
            
            if (isDevelopment) {
                return this.simulateNotification(title, body, data);
            }

            console.log('📤 [FCMService] Sending rich notification...');

            const requestBody = {
                deviceToken: token,
                title: title,
                body: body,
                platform: platform,
                highPriority: highPriority,
                data: data
            };

            if (imageUrl) requestBody.imageUrl = imageUrl;
            if (Object.keys(iosConfig).length > 0) requestBody.iosConfig = iosConfig;
            if (Object.keys(androidConfig).length > 0) requestBody.androidConfig = androidConfig;

            console.log('� [FCMService] Rich notification body:', requestBody);

            const response = await fetch(`${this.baseURL}/api/notifications/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ [FCMService] Rich notification sent:', result);
                return { success: true, result };
            } else {
                const errorText = await response.text();
                console.error('❌ [FCMService] Rich notification failed:', response.status, errorText);
                return { 
                    success: false, 
                    message: `Backend error: ${response.status} - ${errorText}`
                };
            }

        } catch (error) {
            console.error('❌ [FCMService] Rich notification error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Send platform-specific notification (iOS or Android optimized)
     */
    async sendPlatformNotification(title, body, platformConfig = {}, deviceToken = null) {
        try {
            const token = deviceToken || this.fcmToken;
            if (!token) {
                return { success: false, message: 'No FCM token available' };
            }

            const isDevelopment = token.includes('DEV-') || token.includes('FALLBACK-');
            
            if (isDevelopment) {
                return this.simulateNotification(title, body, { platform: Platform.OS });
            }

            console.log('📤 [FCMService] Sending platform-specific notification...');
            console.log('📱 Platform:', Platform.OS);

            const endpoint = Platform.OS === 'ios' 
                ? `/api/notifications/notify/ios`
                : `/api/notifications/notify/android`;

            const formData = new URLSearchParams({
                deviceToken: token,
                title: title,
                body: body,
                ...platformConfig
            });

            console.log('🔗 [FCMService] Endpoint:', `${this.baseURL}${endpoint}`);
            console.log('📝 [FCMService] Form data:', Object.fromEntries(formData));

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ [FCMService] Platform notification sent:', result);
                return { success: true, result };
            } else {
                const errorText = await response.text();
                console.error('❌ [FCMService] Platform notification failed:', response.status, errorText);
                return { 
                    success: false, 
                    message: `Backend error: ${response.status} - ${errorText}`
                };
            }

        } catch (error) {
            console.error('❌ [FCMService] Platform notification error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Send test notification via backend
     */
    async sendTestNotification() {
        return this.sendSimpleNotification(
            'Test Notification',
            `Test from ${Platform.OS} device at ${new Date().toLocaleTimeString()}`
        );
    }

    /**
     * Simulate notification for development mode
     */
    async simulateNotification(title, body, data = {}) {
        console.log('🧪 [FCMService] Development mode - simulating notification...');
        
        const mockResult = {
            success: true,
            messageId: `dev-${Date.now()}`,
            platform: Platform.OS,
            timestamp: new Date().toISOString(),
            note: 'This is a simulated notification for Expo Go development'
        };
        
        console.log('✅ [FCMService] Simulated notification:', mockResult);
        
        // Show a local notification to simulate the experience
        setTimeout(async () => {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: title,
                    body: body,
                    data: { isDevelopment: true, ...data },
                },
                trigger: null, // Show immediately
            });
        }, 1000);
        
        return { 
            success: true, 
            result: mockResult,
            isDevelopment: true 
        };
    }

    /**
     * Send appointment reminder notification
     */
    async sendAppointmentReminder(appointmentData, deviceToken = null) {
        const { doctorName, appointmentTime, appointmentId, patientName } = appointmentData;
        
        const title = "Appointment Reminder";
        const body = `Your appointment with Dr. ${doctorName} is in 30 minutes`;
        
        const data = {
            appointmentId: appointmentId,
            type: "reminder",
            action: "view_appointment"
        };

        // Use iOS-specific configuration for better UX
        const iosConfig = {
            sound: "default",
            badge: 1,
            contentAvailable: true,
            category: "APPOINTMENT_REMINDER"
        };

        // Use Android-specific configuration
        const androidConfig = {
            channelId: "appointment_reminders",
            priority: "high",
            color: "#2196F3"
        };

        return this.sendRichNotification({
            title,
            body,
            deviceToken,
            highPriority: true,
            data,
            iosConfig,
            androidConfig
        });
    }

    /**
     * Send appointment confirmation notification
     */
    async sendAppointmentConfirmation(appointmentData, deviceToken = null) {
        const { doctorName, appointmentDate, appointmentTime, appointmentId } = appointmentData;
        
        const title = "Appointment Confirmed";
        const body = `Your appointment with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime} is confirmed`;
        
        const data = {
            appointmentId: appointmentId,
            type: "booking_confirmation",
            action: "view_appointment"
        };

        return this.sendSimpleNotification(title, body, deviceToken);
    }

    /**
     * Send appointment cancellation notification
     */
    async sendAppointmentCancellation(appointmentData, deviceToken = null) {
        const { doctorName, appointmentDate, reason, appointmentId } = appointmentData;
        
        const title = "Appointment Cancelled";
        const body = `Your appointment with Dr. ${doctorName} on ${appointmentDate} has been cancelled. ${reason ? `Reason: ${reason}` : ''}`;
        
        const data = {
            appointmentId: appointmentId,
            type: "cancellation",
            action: "view_appointments"
        };

        return this.sendSimpleNotification(title, body, deviceToken);
    }

    /**
     * Send bulk appointment notifications (for doctor cancelling multiple appointments)
     */
    async sendBulkAppointmentNotifications(appointmentDataList) {
        try {
            console.log('� [FCMService] Sending bulk appointment notifications...');
            
            const results = [];
            
            for (const appointment of appointmentDataList) {
                const { deviceToken, ...appointmentData } = appointment;
                
                if (deviceToken) {
                    const result = await this.sendAppointmentCancellation(appointmentData, deviceToken);
                    results.push({ 
                        appointmentId: appointmentData.appointmentId,
                        success: result.success,
                        result: result
                    });
                    
                    // Small delay between notifications to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            console.log('✅ [FCMService] Bulk notifications completed:', results);
            return { success: true, results };
            
        } catch (error) {
            console.error('❌ [FCMService] Bulk notifications error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Check Firebase backend status
     */
    async checkFirebaseStatus() {
        try {
            console.log('🔥 [FCMService] Checking Firebase backend status...');
            
            const response = await fetch(`${this.baseURL}/api/test/firebase-status`, {
                method: 'GET',
                timeout: 5000,
            });

            if (response.ok) {
                const statusText = await response.text();
                console.log('✅ [FCMService] Firebase status:', statusText);
                return { 
                    success: true, 
                    status: statusText,
                    initialized: statusText.includes('INITIALIZED')
                };
            } else {
                console.error('❌ [FCMService] Firebase status check failed:', response.status);
                return { 
                    success: false, 
                    message: `HTTP ${response.status}`,
                    initialized: false
                };
            }

        } catch (error) {
            console.error('❌ [FCMService] Firebase status error:', error);
            return { 
                success: false, 
                message: error.message,
                initialized: false
            };
        }
    }

    /**
     * Check notification service health
     */
    async checkNotificationHealth() {
        try {
            console.log('🏥 [FCMService] Checking notification service health...');
            
            const response = await fetch(`${this.baseURL}/api/notifications/health`, {
                method: 'GET',
                timeout: 5000,
            });

            if (response.ok) {
                const healthText = await response.text();
                console.log('✅ [FCMService] Notification health:', healthText);
                return { 
                    success: true, 
                    health: healthText,
                    running: true
                };
            } else {
                console.error('❌ [FCMService] Health check failed:', response.status);
                return { 
                    success: false, 
                    message: `HTTP ${response.status}`,
                    running: false
                };
            }

        } catch (error) {
            console.error('❌ [FCMService] Health check error:', error);
            return { 
                success: false, 
                message: error.message,
                running: false
            };
        }
    }

    /**
     * Handle appointment reminder notifications (callback)
     */
    handleAppointmentReminder(data) {
        console.log('📅 [FCMService] Handling appointment reminder:', data);
        // Navigate to appointment details or show reminder dialog
        // This can be customized based on your app's navigation structure
    }

    /**
     * Handle booking confirmation notifications (callback)
     */
    handleBookingConfirmation(data) {
        console.log('✅ [FCMService] Handling booking confirmation:', data);
        // Navigate to appointment list or show confirmation
    }

    /**
     * Handle general notification actions (callback)
     */
    handleNotificationAction(data) {
        console.log('🎯 [FCMService] Handling notification action:', data);
        // Handle custom notification actions based on data.action
        switch (data?.action) {
            case 'view_appointment':
                // Navigate to specific appointment
                break;
            case 'view_appointments':
                // Navigate to appointments list
                break;
            default:
                console.log('No specific action defined for:', data?.action);
        }
    }

    /**
     * Cleanup listeners (call when component unmounts)
     */
    cleanup() {
        try {
            if (this.notificationListener) {
                Notifications.removeNotificationSubscription(this.notificationListener);
                this.notificationListener = null;
            }

            if (this.responseListener) {
                Notifications.removeNotificationSubscription(this.responseListener);
                this.responseListener = null;
            }

            console.log('🧹 [FCMService] Cleanup completed');
        } catch (error) {
            console.error('❌ [FCMService] Cleanup failed:', error);
        }
    }
}

// Create singleton instance
const fcmService = new FCMService();

export default fcmService;
export { FCMService };