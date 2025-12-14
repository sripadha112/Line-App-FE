import fcmService from './fcmService';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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
            const userRole = await SecureStore.getItemAsync('userRole');
            const isUser = userRole === 'user';
            
            console.log('🔍 [UserNotification] User role:', userRole, 'Should receive:', isUser);
            return isUser;
        } catch (error) {
            console.error('❌ [UserNotification] Error checking user role:', error);
            return false;
        }
    }

    /**
     * Register user for push notifications (only for users, not doctors)
     */
    static async registerUserForNotifications() {
        try {
            const shouldReceive = await this.shouldReceiveNotifications();
            if (!shouldReceive) {
                console.log('🚫 [UserNotification] Doctor detected - skipping notification registration');
                return { success: false, message: 'Doctors do not receive notifications' };
            }

            // Initialize FCM service for user
            const result = await fcmService.initialize();
            if (result.success) {
                console.log('✅ [UserNotification] User registered for notifications');
                
                // Send token to backend for user notifications
                await this.updateUserTokenOnBackend(result.token);
            }
            
            return result;
        } catch (error) {
            console.error('❌ [UserNotification] Registration failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Update user's FCM token on backend
     */
    static async updateUserTokenOnBackend(token) {
        try {
            const userId = await SecureStore.getItemAsync('userId');
            if (!userId) {
                console.warn('⚠️ [UserNotification] No user ID found');
                return;
            }

            // Send token to your backend API
            const response = await fetch(`${fcmService.baseURL}/api/user/${userId}/fcm-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': await SecureStore.getItemAsync('authToken')
                },
                body: JSON.stringify({
                    fcmToken: token,
                    deviceInfo: {
                        platform: Platform.OS,
                        appVersion: Constants.expoConfig?.version
                    }
                })
            });

            if (response.ok) {
                console.log('✅ [UserNotification] FCM token updated on backend');
            } else {
                console.error('❌ [UserNotification] Failed to update token on backend');
            }
        } catch (error) {
            console.error('❌ [UserNotification] Backend token update failed:', error);
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
}

export default UserNotificationService;