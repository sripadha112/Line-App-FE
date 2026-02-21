/**
 * Appointment Notification Service
 * 
 * NOTE: Push notifications for appointments are sent from the BACKEND (Java)
 * when doctors cancel or reschedule appointments.
 * 
 * This file is kept for potential future client-side notification needs.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

class AppointmentNotificationService {
    
    /**
     * Schedule a local reminder notification for an appointment
     * @param {Object} appointmentData - Appointment details
     * @param {Date} reminderTime - When to show the reminder
     */
    static async scheduleAppointmentReminder(appointmentData, reminderTime) {
        try {
            const {
                appointmentId,
                doctorName,
                appointmentTime,
                clinicName
            } = appointmentData;

            // Check if reminder time is in the future
            if (reminderTime <= new Date()) {
                console.log('⏰ [AppointmentNotification] Reminder time already passed');
                return { success: false, message: 'Reminder time already passed' };
            }

            const notificationContent = {
                title: 'Appointment Reminder',
                body: `Your appointment with Dr. ${doctorName} is coming up at ${appointmentTime}`,
                data: {
                    appointmentId: appointmentId.toString(),
                    type: 'appointment_reminder',
                    doctorName,
                    clinicName
                },
                sound: true,
            };

            // Add channel for Android
            if (Platform.OS === 'android') {
                notificationContent.channelId = 'appointment_reminders';
            }

            const id = await Notifications.scheduleNotificationAsync({
                content: notificationContent,
                trigger: {
                    date: reminderTime
                }
            });

            console.log('⏰ [AppointmentNotification] Reminder scheduled:', id);
            return { success: true, notificationId: id, reminderTime };

        } catch (error) {
            console.error('❌ [AppointmentNotification] Schedule reminder failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Cancel a scheduled appointment reminder
     * @param {string} notificationId - The notification ID to cancel
     */
    static async cancelReminder(notificationId) {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            console.log('🗑️ [AppointmentNotification] Reminder cancelled:', notificationId);
            return { success: true };
        } catch (error) {
            console.error('❌ [AppointmentNotification] Cancel reminder failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Cancel all scheduled reminders for a specific appointment
     * @param {string} appointmentId - The appointment ID
     */
    static async cancelAppointmentReminders(appointmentId) {
        try {
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
            
            const appointmentReminders = scheduledNotifications.filter(notification => 
                notification.content?.data?.appointmentId === appointmentId.toString() &&
                notification.content?.data?.type === 'appointment_reminder'
            );

            for (const notification of appointmentReminders) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            }

            console.log('🗑️ [AppointmentNotification] Cancelled', appointmentReminders.length, 'reminders for appointment:', appointmentId);
            return { success: true, cancelledCount: appointmentReminders.length };

        } catch (error) {
            console.error('❌ [AppointmentNotification] Cancel reminders failed:', error);
            return { success: false, message: error.message };
        }
    }
}

export default AppointmentNotificationService;
