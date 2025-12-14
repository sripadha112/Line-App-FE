import fcmService from './fcmService';

/**
 * Appointment Notification Service
 * Integrates FCM with your appointment system
 * Handles all appointment-related notifications
 */
class AppointmentNotificationService {
    
    /**
     * Send notification when appointment is booked
     */
    static async notifyAppointmentBooked(appointmentData) {
        try {
            console.log('📅 [AppointmentNotification] Sending booking confirmation...');
            
            const {
                userFcmToken,
                doctorName,
                appointmentDate,
                appointmentTime,
                appointmentId,
                clinicName
            } = appointmentData;

            if (!userFcmToken) {
                console.warn('⚠️ [AppointmentNotification] No FCM token for user');
                return { success: false, message: 'No FCM token available' };
            }

            const confirmationData = {
                doctorName,
                appointmentDate,
                appointmentTime,
                appointmentId,
                clinicName
            };

            const result = await fcmService.sendAppointmentConfirmation(confirmationData, userFcmToken);
            
            if (result.success) {
                console.log('✅ [AppointmentNotification] Booking confirmation sent');
            } else {
                console.error('❌ [AppointmentNotification] Booking confirmation failed:', result.message);
            }

            return result;

        } catch (error) {
            console.error('❌ [AppointmentNotification] Booking notification error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Send notification when appointment is cancelled by doctor
     */
    static async notifyAppointmentCancelledByDoctor(appointmentData) {
        try {
            console.log('📅 [AppointmentNotification] Sending doctor cancellation notice...');
            
            const {
                userFcmToken,
                doctorName,
                appointmentDate,
                reason,
                appointmentId
            } = appointmentData;

            if (!userFcmToken) {
                console.warn('⚠️ [AppointmentNotification] No FCM token for user');
                return { success: false, message: 'No FCM token available' };
            }

            const cancellationData = {
                doctorName,
                appointmentDate,
                reason: reason || 'Doctor unavailable',
                appointmentId
            };

            const result = await fcmService.sendAppointmentCancellation(cancellationData, userFcmToken);
            
            if (result.success) {
                console.log('✅ [AppointmentNotification] Cancellation notice sent');
            } else {
                console.error('❌ [AppointmentNotification] Cancellation notice failed:', result.message);
            }

            return result;

        } catch (error) {
            console.error('❌ [AppointmentNotification] Cancellation notification error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Send notification when appointment is rescheduled
     */
    static async notifyAppointmentRescheduled(appointmentData) {
        try {
            console.log('📅 [AppointmentNotification] Sending reschedule notice...');
            
            const {
                userFcmToken,
                doctorName,
                oldDate,
                oldTime,
                newDate,
                newTime,
                appointmentId,
                reason
            } = appointmentData;

            if (!userFcmToken) {
                console.warn('⚠️ [AppointmentNotification] No FCM token for user');
                return { success: false, message: 'No FCM token available' };
            }

            const title = "Appointment Rescheduled";
            const body = `Your appointment with Dr. ${doctorName} has been moved from ${oldDate} at ${oldTime} to ${newDate} at ${newTime}. ${reason ? `Reason: ${reason}` : ''}`;
            
            const data = {
                appointmentId: appointmentId,
                type: "reschedule",
                action: "view_appointment",
                newDate: newDate,
                newTime: newTime
            };

            const result = await fcmService.sendSimpleNotification(title, body, userFcmToken);
            
            if (result.success) {
                console.log('✅ [AppointmentNotification] Reschedule notice sent');
            } else {
                console.error('❌ [AppointmentNotification] Reschedule notice failed:', result.message);
            }

            return result;

        } catch (error) {
            console.error('❌ [AppointmentNotification] Reschedule notification error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Send appointment reminder (30 minutes before)
     */
    static async sendAppointmentReminder(appointmentData) {
        try {
            console.log('📅 [AppointmentNotification] Sending appointment reminder...');
            
            const {
                userFcmToken,
                doctorName,
                appointmentTime,
                appointmentId,
                patientName,
                clinicName
            } = appointmentData;

            if (!userFcmToken) {
                console.warn('⚠️ [AppointmentNotification] No FCM token for user');
                return { success: false, message: 'No FCM token available' };
            }

            const reminderData = {
                doctorName,
                appointmentTime,
                appointmentId,
                patientName,
                clinicName
            };

            const result = await fcmService.sendAppointmentReminder(reminderData, userFcmToken);
            
            if (result.success) {
                console.log('✅ [AppointmentNotification] Reminder sent');
            } else {
                console.error('❌ [AppointmentNotification] Reminder failed:', result.message);
            }

            return result;

        } catch (error) {
            console.error('❌ [AppointmentNotification] Reminder notification error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Send bulk cancellation notifications (when doctor cancels entire day)
     */
    static async notifyBulkCancellation(appointmentList, reason = 'Doctor unavailable') {
        try {
            console.log('📅 [AppointmentNotification] Sending bulk cancellation notifications...');
            
            const notificationPromises = appointmentList.map(appointment => {
                const {
                    userFcmToken,
                    doctorName,
                    appointmentDate,
                    appointmentId,
                    patientName
                } = appointment;

                if (!userFcmToken) {
                    console.warn('⚠️ [AppointmentNotification] No FCM token for patient:', patientName);
                    return Promise.resolve({ success: false, message: 'No FCM token', appointmentId });
                }

                return this.notifyAppointmentCancelledByDoctor({
                    userFcmToken,
                    doctorName,
                    appointmentDate,
                    reason,
                    appointmentId
                }).then(result => ({ ...result, appointmentId }));
            });

            const results = await Promise.all(notificationPromises);
            
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            console.log('✅ [AppointmentNotification] Bulk cancellation completed:', {
                total: results.length,
                successful,
                failed
            });

            return {
                success: true,
                results,
                summary: {
                    total: results.length,
                    successful,
                    failed
                }
            };

        } catch (error) {
            console.error('❌ [AppointmentNotification] Bulk cancellation error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Send doctor notification (when patient books/cancels)
     */
    static async notifyDoctorOfPatientAction(actionData) {
        try {
            console.log('👨‍⚕️ [AppointmentNotification] Sending doctor notification...');
            
            const {
                doctorFcmToken,
                patientName,
                action, // 'booked' or 'cancelled'
                appointmentDate,
                appointmentTime,
                appointmentId
            } = actionData;

            if (!doctorFcmToken) {
                console.warn('⚠️ [AppointmentNotification] No FCM token for doctor');
                return { success: false, message: 'No FCM token available' };
            }

            const title = action === 'booked' ? 'New Appointment Booked' : 'Appointment Cancelled by Patient';
            const body = action === 'booked' 
                ? `${patientName} has booked an appointment for ${appointmentDate} at ${appointmentTime}`
                : `${patientName} has cancelled their appointment for ${appointmentDate} at ${appointmentTime}`;
            
            const data = {
                appointmentId: appointmentId,
                patientName: patientName,
                type: action === 'booked' ? "patient_booking" : "patient_cancellation",
                action: "view_appointment"
            };

            const result = await fcmService.sendSimpleNotification(title, body, doctorFcmToken);
            
            if (result.success) {
                console.log('✅ [AppointmentNotification] Doctor notification sent');
            } else {
                console.error('❌ [AppointmentNotification] Doctor notification failed:', result.message);
            }

            return result;

        } catch (error) {
            console.error('❌ [AppointmentNotification] Doctor notification error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Test notification system with sample data
     */
    static async testNotificationSystem() {
        try {
            console.log('🧪 [AppointmentNotification] Testing notification system...');
            
            const testAppointmentData = {
                userFcmToken: fcmService.getCurrentToken(),
                doctorName: 'Dr. Sarah Johnson',
                appointmentDate: '2025-12-10',
                appointmentTime: '2:00 PM',
                appointmentId: 'test-12345',
                patientName: 'Test Patient',
                clinicName: 'Medical Center'
            };

            // Test booking confirmation
            const bookingResult = await this.notifyAppointmentBooked(testAppointmentData);
            
            // Test reminder (with delay)
            setTimeout(async () => {
                const reminderResult = await this.sendAppointmentReminder(testAppointmentData);
                console.log('🧪 [AppointmentNotification] Test reminder result:', reminderResult);
            }, 2000);

            console.log('🧪 [AppointmentNotification] Test booking result:', bookingResult);
            
            return {
                success: true,
                message: 'Test notifications sent successfully',
                results: { bookingResult }
            };

        } catch (error) {
            console.error('❌ [AppointmentNotification] Test notification error:', error);
            return { success: false, message: error.message };
        }
    }
}

export default AppointmentNotificationService;