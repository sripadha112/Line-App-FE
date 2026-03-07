import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import SecureStore from '../utils/secureStorage';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import API_BASE_URL from '../config';

/**
 * Expo Push Notification Service for React Native
 * Handles push notifications using Expo's Push Notification service
 * 
 * This service is named fcmService for backward compatibility but uses Expo Push
 */
class ExpoPushService {
    constructor() {
        this.expoPushToken = null;
        this.notificationListener = null;
        this.responseListener = null;
        this.isInitialized = false;
        this.baseURL = API_BASE_URL;
        
        // Only configure notifications on native platforms
        if (Platform.OS !== 'web') {
            this.setupNotificationBehavior();
        }
        
        console.log('🔧 [ExpoPush] Initialized with backend URL:', this.baseURL);
    }

    /**
     * Configure how notifications are handled when received
     */
    setupNotificationBehavior() {
        if (Platform.OS === 'web') {
            console.log('⚠️ [ExpoPush] Notifications not supported on web');
            return;
        }
        
        Notifications.setNotificationHandler({
            handleNotification: async (notification) => {
                console.log('📬 [ExpoPush] Notification received:', notification.request.content.title);
                return {
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                };
            },
        });
        console.log('✅ [ExpoPush] Notification handler configured');
    }

    /**
     * Initialize Expo Push service - call this on app startup
     */
    async initialize() {
        if (Platform.OS === 'web') {
            console.log('⚠️ [ExpoPush] Skipping initialization on web platform');
            return { success: false, message: 'Web platform not supported' };
        }
        
        try {
            console.log('🔔 [ExpoPush] Initializing Expo Push Service...');
            
            // Check if running on physical device
            if (!Device.isDevice) {
                console.warn('⚠️ [ExpoPush] Push notifications only work on physical devices');
                // Return a dev token for testing in emulator
                const devToken = `ExponentPushToken[DEV-${Date.now()}]`;
                this.expoPushToken = devToken;
                return { success: true, token: devToken, isDevelopment: true, message: 'Development mode - emulator detected' };
            }

            // Setup Android notification channel first (important for Android 8+)
            if (Platform.OS === 'android') {
                await this.setupAndroidNotificationChannel();
            }

            // Request permissions
            const permissionResult = await this.requestPermissions();
            if (!permissionResult.success) {
                return permissionResult;
            }

            // Get Expo Push Token
            const tokenResult = await this.getExpoPushToken();
            if (!tokenResult.success) {
                return tokenResult;
            }

            // Setup notification listeners
            this.setupNotificationListeners();

            this.isInitialized = true;
            console.log('✅ [ExpoPush] Service initialized successfully');
            console.log('📱 [ExpoPush] Token:', this.expoPushToken);
            
            return { 
                success: true, 
                message: 'Expo Push initialized successfully',
                token: this.expoPushToken,
                isExpoToken: true
            };

        } catch (error) {
            console.error('❌ [ExpoPush] Initialization failed:', error);
            return { 
                success: false, 
                message: `Expo Push initialization failed: ${error.message}` 
            };
        }
    }

    /**
     * Setup Android notification channels (required for Android 8.0+)
     */
    async setupAndroidNotificationChannel() {
        try {
            console.log('📱 [ExpoPush] Setting up Android notification channels...');
            
            // Default channel for general notifications
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                sound: 'default',
                enableLights: true,
                enableVibrate: true,
                showBadge: true,
            });

            // Appointment updates channel
            await Notifications.setNotificationChannelAsync('appointment_updates', {
                name: 'Appointment Updates',
                description: 'Notifications about your appointment bookings, cancellations, and reschedules',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#2196F3',
                sound: 'default',
                enableLights: true,
                enableVibrate: true,
                showBadge: true,
            });

            // Appointment reminders channel
            await Notifications.setNotificationChannelAsync('appointment_reminders', {
                name: 'Appointment Reminders',
                description: 'Reminders for upcoming appointments',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#4CAF50',
                sound: 'default',
                enableLights: true,
                enableVibrate: true,
                showBadge: true,
            });

            console.log('✅ [ExpoPush] Android notification channels created');
        } catch (error) {
            console.error('❌ [ExpoPush] Error setting up Android channels:', error);
        }
    }

    /**
     * Request notification permissions for both iOS and Android
     */
    async requestPermissions() {
        try {
            console.log('📱 [ExpoPush] Requesting notification permissions...');

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync({
                    ios: {
                        allowAlert: true,
                        allowBadge: true,
                        allowSound: true,
                    },
                    android: {},
                });
                finalStatus = status;
            }

            console.log(`📱 [ExpoPush] Permission status: ${finalStatus}`);

            if (finalStatus !== 'granted') {
                const message = 'Notification permission denied. Enable in Settings to receive push notifications.';
                console.warn('⚠️ [ExpoPush]', message);
                
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

            console.log('✅ [ExpoPush] Notification permissions granted');
            return { success: true, status: finalStatus };

        } catch (error) {
            console.error('❌ [ExpoPush] Permission request failed:', error);
            return { 
                success: false, 
                message: `Permission request failed: ${error.message}` 
            };
        }
    }

    /**
     * Get Expo Push Token - the key function for production APK
     */
    async getExpoPushToken() {
        try {
            console.log('🔑 [ExpoPush] Getting Expo Push Token...');

            // Get project ID from app config
            const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                             Constants.easConfig?.projectId;

            console.log('📱 [ExpoPush] Project ID:', projectId || 'not found');

            if (!projectId) {
                console.error('❌ [ExpoPush] No EAS project ID found in app.json');
                return { 
                    success: false, 
                    message: 'EAS project ID not configured in app.json' 
                };
            }

            // Get Expo Push Token
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: projectId
            });
            
            const token = tokenData.data;
            console.log('🔑 [ExpoPush] Token obtained:', token);

            // Validate token format
            if (!token || !token.startsWith('ExponentPushToken[')) {
                console.error('❌ [ExpoPush] Invalid token format:', token);
                return { success: false, message: 'Invalid Expo Push Token format' };
            }

            // Cache the token
            await this.cacheToken(token);
            this.expoPushToken = token;

            return { 
                success: true, 
                token,
                isExpoToken: true
            };

        } catch (error) {
            console.error('❌ [ExpoPush] Failed to get Expo Push Token:', error);
            
            // Check for specific errors
            if (error.message?.includes('project')) {
                return { 
                    success: false, 
                    message: 'EAS project ID configuration error. Please check app.json' 
                };
            }
            
            return { 
                success: false, 
                message: `Failed to get push token: ${error.message}` 
            };
        }
    }

    /**
     * Setup notification event listeners
     */
    setupNotificationListeners() {
        try {
            console.log('👂 [ExpoPush] Setting up notification listeners...');

            // Listener for notifications received while app is foregrounded
            this.notificationListener = Notifications.addNotificationReceivedListener(
                (notification) => {
                    console.log('🔔 [ExpoPush] Foreground notification:', notification.request.content);
                }
            );

            // Listener for when user taps on notification
            this.responseListener = Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    console.log('👆 [ExpoPush] Notification tapped:', response.notification.request.content);
                    this.handleNotificationResponse(response);
                }
            );

            // Handle notification when app is launched from notification
            this.handleAppLaunchFromNotification();

            console.log('✅ [ExpoPush] Notification listeners setup complete');

        } catch (error) {
            console.error('❌ [ExpoPush] Listener setup failed:', error);
        }
    }

    /**
     * Handle notification tap/response
     */
    handleNotificationResponse(response) {
        try {
            const data = response.notification.request.content.data;
            console.log('👆 [ExpoPush] Processing notification tap, data:', data);

            // Navigate based on notification data
            if (data?.appointmentId) {
                console.log('📅 [ExpoPush] Should navigate to appointment:', data.appointmentId);
            }
        } catch (error) {
            console.error('❌ [ExpoPush] Error handling notification response:', error);
        }
    }

    /**
     * Handle app launch from notification (when app was closed)
     */
    async handleAppLaunchFromNotification() {
        try {
            const response = await Notifications.getLastNotificationResponseAsync();
            if (response) {
                console.log('🚀 [ExpoPush] App launched from notification:', response);
                this.handleNotificationResponse(response);
            }
        } catch (error) {
            console.error('❌ [ExpoPush] App launch notification handling failed:', error);
        }
    }

    /**
     * Cache Expo Push token securely
     */
    async cacheToken(token) {
        try {
            await SecureStore.setItemAsync('expo_push_token', token);
            await SecureStore.setItemAsync('expo_push_token_timestamp', Date.now().toString());
            console.log('💾 [ExpoPush] Token cached successfully');
        } catch (error) {
            console.error('❌ [ExpoPush] Token caching failed:', error);
        }
    }

    /**
     * Get cached Expo Push token
     */
    async getCachedToken() {
        try {
            const token = await SecureStore.getItemAsync('expo_push_token');
            if (token && token.startsWith('ExponentPushToken[')) {
                console.log('📱 [ExpoPush] Valid cached token found');
                return token;
            }
            return null;
        } catch (error) {
            console.error('❌ [ExpoPush] Error getting cached token:', error);
            return null;
        }
    }

    /**
     * Clear cached token
     */
    async clearCachedToken() {
        try {
            await SecureStore.deleteItemAsync('expo_push_token');
            await SecureStore.deleteItemAsync('expo_push_token_timestamp');
            // Also clear old fcm_token keys for cleanup
            await SecureStore.deleteItemAsync('fcm_token');
            await SecureStore.deleteItemAsync('fcm_token_timestamp');
            this.expoPushToken = null;
            console.log('🗑️ [ExpoPush] Token cache cleared');
        } catch (error) {
            console.error('❌ [ExpoPush] Error clearing token cache:', error);
        }
    }

    /**
     * Get current Expo Push token
     */
    getCurrentToken() {
        return this.expoPushToken;
    }

    /**
     * Check if service is initialized
     */
    isReady() {
        return this.isInitialized && this.expoPushToken !== null;
    }

    /**
     * Refresh Expo Push token
     */
    async refreshToken() {
        try {
            console.log('🔄 [ExpoPush] Refreshing token...');
            await this.clearCachedToken();
            const result = await this.getExpoPushToken();
            if (result.success) {
                console.log('✅ [ExpoPush] Token refreshed successfully');
            }
            return result;
        } catch (error) {
            console.error('❌ [ExpoPush] Token refresh failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Send test local notification to verify notifications work on device
     */
    async sendTestNotification() {
        try {
            console.log('🧪 [ExpoPush] Sending test notification...');
            
            const notificationContent = {
                title: '✅ Test Notification',
                body: `Test at ${new Date().toLocaleTimeString()} - Notifications are working!`,
                data: { test: true },
                sound: true,
            };

            // Add channel for Android
            if (Platform.OS === 'android') {
                notificationContent.channelId = 'default';
            }

            const id = await Notifications.scheduleNotificationAsync({
                content: notificationContent,
                trigger: null, // Show immediately
            });

            console.log('✅ [ExpoPush] Test notification sent with id:', id);
            return { success: true, notificationId: id };
        } catch (error) {
            console.error('❌ [ExpoPush] Test notification failed:', error);
            return { success: false, message: error.message };
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

            console.log('🧹 [ExpoPush] Cleanup completed');
        } catch (error) {
            console.error('❌ [ExpoPush] Cleanup failed:', error);
        }
    }
}

// Create singleton instance (named fcmService for backward compatibility)
const fcmService = new ExpoPushService();

export default fcmService;
export { ExpoPushService };
