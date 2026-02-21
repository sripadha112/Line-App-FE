import fcmService from './fcmService';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import API_BASE_URL from '../config';

/**
 * User Notification Service
 * Handles all notifications sent TO USERS ONLY
 * Doctors do not receive any notifications
 */
class UserNotificationService {
    
    /**
     * Check if current user should receive notifications (only users, not doctors)
     */
    static async shouldReceiveNotifications() {
        try {
            // Check both 'role' and 'userRole' keys since app uses both
            const role = await SecureStore.getItemAsync('role');
            const userRole = await SecureStore.getItemAsync('userRole');
            const effectiveRole = role || userRole;
            
            // Users should receive notifications (role is USER or user), doctors should not
            const isUser = effectiveRole && effectiveRole.toUpperCase() === 'USER';
            
            console.log('🔍 [UserNotification] Role:', effectiveRole, 'Should receive:', isUser);
            return isUser;
        } catch (error) {
            console.error('❌ [UserNotification] Error checking user role:', error);
            return false;
        }
    }

    /**
     * Register user for push notifications (only for users, not doctors)
     * This should be called after user login/registration
     */
    static async registerUserForNotifications() {
        try {
            // Initialize Expo Push service first
            console.log('🔔 [UserNotification] Initializing Expo Push service...');
            const result = await fcmService.initialize();
            
            if (result.success) {
                console.log('✅ [UserNotification] Expo Push initialized with token:', result.token?.substring(0, 30) + '...');
                
                // Check if user should receive notifications
                const shouldReceive = await this.shouldReceiveNotifications();
                if (shouldReceive) {
                    console.log('📤 [UserNotification] Sending token to backend...');
                    const backendResult = await this.updateUserTokenOnBackend(result.token);
                    return { ...result, backendRegistered: backendResult.success };
                } else {
                    console.log('🚫 [UserNotification] Doctor or unknown role - skipping backend registration');
                    return { ...result, backendRegistered: false, message: 'Not a user role' };
                }
            }
            
            return result;
        } catch (error) {
            console.error('❌ [UserNotification] Registration failed:', error);
            return { success: false, message: error.message };
        }
    }
    
    /**
     * Force register Expo Push token for user (call this after successful login/registration)
     * This bypasses the role check for immediate registration
     */
    static async forceRegisterFcmToken() {
        try {
            console.log('🔔 [UserNotification] Force registering Expo Push token...');
            
            // Initialize Expo Push service
            const result = await fcmService.initialize();
            
            if (result.success && result.token) {
                // Skip dev tokens from backend registration
                if (result.isDevelopment) {
                    console.log('💡 [UserNotification] Development token - skipping backend registration');
                    return { ...result, backendRegistered: false, message: 'Development token' };
                }
                
                // Send to backend immediately
                const backendResult = await this.updateUserTokenOnBackend(result.token);
                console.log('📤 [UserNotification] Force registration result:', backendResult);
                return { ...result, backendRegistered: backendResult.success };
            }
            
            return result;
        } catch (error) {
            console.error('❌ [UserNotification] Force registration failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Update user's Expo Push token on backend
     */
    static async updateUserTokenOnBackend(token) {
        try {
            const userId = await SecureStore.getItemAsync('userId');
            if (!userId) {
                console.warn('⚠️ [UserNotification] No user ID found');
                return { success: false, message: 'No user ID found' };
            }

            // Skip development tokens
            if (token && token.includes('DEV-')) {
                console.log('💡 [UserNotification] Development token detected - skipping backend registration');
                return { success: true, message: 'Development token - skipped backend registration' };
            }

            const accessToken = await SecureStore.getItemAsync('accessToken');
            const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
            
            console.log('📤 [UserNotification] Registering Expo Push token for user:', userId);
            console.log('📱 [UserNotification] Device type:', deviceType);
            console.log('🔑 [UserNotification] Token preview:', token ? token.substring(0, 30) + '...' : 'null');

            // Send token to backend API
            const response = await fetch(`${API_BASE_URL}/api/user/${userId}/fcm-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': accessToken ? `Bearer ${accessToken}` : ''
                },
                body: JSON.stringify({
                    fcmToken: token,
                    deviceType: deviceType
                })
            });

            const responseText = await response.text();
            console.log('📥 [UserNotification] Response status:', response.status);
            console.log('📥 [UserNotification] Response body:', responseText);

            if (response.ok) {
                console.log('✅ [UserNotification] Expo Push token updated on backend successfully');
                return { success: true, message: 'Token registered successfully' };
            } else {
                console.error('❌ [UserNotification] Failed to update token on backend:', responseText);
                return { success: false, message: responseText };
            }
        } catch (error) {
            console.error('❌ [UserNotification] Backend token update failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Send appointment notification to user (called from backend when doctor makes changes)
     */
    static async notifyAppointmentUpdated(appointmentData) {
        try {
            const {
                userId,
                appointmentId,
                action, // 'cancelled', 'rescheduled', 'confirmed', 'reminder'
                doctorName,
                appointmentDate,
                appointmentTime,
                newDate, // for rescheduled appointments
                newTime, // for rescheduled appointments
                reason,
                clinicName
            } = appointmentData;

            let title, body, data;

            switch (action) {
                case 'cancelled':
                    title = 'Appointment Cancelled';
                    body = `Dr. ${doctorName} has cancelled your appointment scheduled for ${appointmentDate} at ${appointmentTime}`;
                    if (reason) {
                        body += `\nReason: ${reason}`;
                    }
                    break;

                case 'rescheduled':
                    title = 'Appointment Rescheduled';
                    body = `Dr. ${doctorName} has rescheduled your appointment from ${appointmentDate} ${appointmentTime} to ${newDate} ${newTime}`;
                    break;

                case 'confirmed':
                    title = 'Appointment Confirmed';
                    body = `Your appointment with Dr. ${doctorName} is confirmed for ${appointmentDate} at ${appointmentTime}`;
                    break;

                case 'reminder':
                    title = 'Appointment Reminder';
                    body = `Your appointment with Dr. ${doctorName} is tomorrow at ${appointmentTime}`;
                    break;

                default:
                    title = 'Appointment Update';
                    body = `Your appointment with Dr. ${doctorName} has been updated`;
            }

            data = {
                appointmentId: appointmentId.toString(),
                action,
                doctorName,
                clinicName,
                type: 'appointment_update'
            };

            // This would typically be called from your backend, not directly from the app
            console.log('📤 [UserNotification] Would send notification:', { title, body, data });
            
            return {
                success: true,
                notification: { title, body, data }
            };

        } catch (error) {
            console.error('❌ [UserNotification] Notification failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Schedule appointment reminder (24 hours before)
     */
    static async scheduleAppointmentReminder(appointmentData) {
        try {
            const shouldReceive = await this.shouldReceiveNotifications();
            if (!shouldReceive) {
                return { success: false, message: 'User not eligible for notifications' };
            }

            const {
                appointmentId,
                appointmentDate,
                appointmentTime,
                doctorName,
                clinicName
            } = appointmentData;

            // Calculate reminder time (24 hours before appointment)
            const appointmentDateTime = new Date(`${appointmentDate} ${appointmentTime}`);
            const reminderTime = new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000)); // 24 hours before

            // Check if reminder time is in the future
            if (reminderTime < new Date()) {
                console.log('⏰ [UserNotification] Reminder time already passed, skipping');
                return { success: false, message: 'Reminder time already passed' };
            }

            const notificationContent = {
                title: 'Appointment Reminder',
                body: `Tomorrow: Appointment with Dr. ${doctorName} at ${appointmentTime}`,
                data: {
                    appointmentId: appointmentId.toString(),
                    type: 'appointment_reminder',
                    doctorName,
                    clinicName
                }
            };

            // Schedule local notification
            await Notifications.scheduleNotificationAsync({
                content: notificationContent,
                trigger: {
                    date: reminderTime
                }
            });

            console.log('⏰ [UserNotification] Reminder scheduled for:', reminderTime);
            return { success: true, reminderTime };

        } catch (error) {
            console.error('❌ [UserNotification] Reminder scheduling failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Cancel scheduled reminder
     */
    static async cancelAppointmentReminder(appointmentId) {
        try {
            // Get all scheduled notifications
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
            
            // Find notifications for this appointment
            const reminderNotifications = scheduledNotifications.filter(notification => 
                notification.content?.data?.appointmentId === appointmentId.toString() &&
                notification.content?.data?.type === 'appointment_reminder'
            );

            // Cancel the reminders
            for (const notification of reminderNotifications) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                console.log('🗑️ [UserNotification] Cancelled reminder for appointment:', appointmentId);
            }

            return { success: true, cancelledCount: reminderNotifications.length };

        } catch (error) {
            console.error('❌ [UserNotification] Reminder cancellation failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Check if user has a valid Expo Push token
     */
    static async hasValidFcmToken() {
        const token = fcmService.getCurrentToken();
        if (!token) return false;
        
        // Development tokens are not valid for production
        if (token.includes('DEV-')) {
            return false;
        }
        
        // Valid Expo Push token format
        return token.startsWith('ExponentPushToken[');
    }

    /**
     * Get current token status for debugging
     */
    static async getTokenStatus() {
        const token = fcmService.getCurrentToken();
        const userId = await SecureStore.getItemAsync('userId');
        const role = await SecureStore.getItemAsync('role');
        
        return {
            hasToken: !!token,
            tokenPreview: token ? `${token.substring(0, 30)}...` : 'No token',
            tokenType: !token ? 'none' : 
                       token.includes('DEV-') ? 'development' :
                       token.startsWith('ExponentPushToken') ? 'expo' : 'unknown',
            userId,
            role,
            isInitialized: fcmService.isReady(),
        };
    }
}

export default UserNotificationService;