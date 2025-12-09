import { Alert } from 'react-native';
import calendarService from './calendarService';

/**
 * Calendar Prompt Service - Handles smooth calendar integration prompts
 * Shows contextual prompts during appointment operations
 */
class CalendarPromptService {
    
    /**
     * Check if calendar service is available
     */
    static async isCalendarServiceAvailable() {
        try {
            const response = await fetch(`${calendarService.baseURL}/api/oauth2/google/auth-url`, {
                method: 'HEAD' // Just check if endpoint exists
            });
            return response.status !== 404;
        } catch (error) {
            return false;
        }
    }

    /**
     * Prompt user to add appointment to calendar during booking
     */
    static async promptForBooking(appointmentDetails, onConfirm, onSkip) {
        const { doctorName, workplaceName, date, timeSlot } = appointmentDetails;
        
        // Check if calendar service is available
        const isServiceAvailable = await this.isCalendarServiceAvailable();
        if (!isServiceAvailable) {
            console.log('[CalendarPrompt] Calendar service not available, skipping prompt');
            if (onSkip) onSkip();
            return { addToCalendar: false, reason: 'service_unavailable' };
        }
        
        return new Promise((resolve) => {
            Alert.alert(
                '📅 Add to Calendar?',
                `Would you like to add this appointment to your Google Calendar?\n\n🏥 ${workplaceName}\n👨‍⚕️ Dr. ${doctorName}\n📅 ${date}\n🕐 ${timeSlot}`,
                [
                    {
                        text: 'Skip',
                        style: 'cancel',
                        onPress: () => {
                            console.log('[CalendarPrompt] User skipped calendar integration');
                            if (onSkip) onSkip();
                            resolve({ addToCalendar: false });
                        }
                    },
                    {
                        text: 'Add to Calendar',
                        onPress: async () => {
                            try {
                                console.log('[CalendarPrompt] User confirmed calendar integration');
                                const calendarData = await this.handleCalendarIntegration();
                                if (onConfirm) onConfirm(calendarData);
                                resolve({ addToCalendar: true, calendarData });
                            } catch (error) {
                                console.error('[CalendarPrompt] Calendar integration failed:', error);
                                
                                let errorMessage = 'Could not connect to calendar. Your appointment is still booked successfully.';
                                if (error.message.includes('not available') || error.message.includes('not configured')) {
                                    errorMessage = 'Calendar service is currently not available. Your appointment is still booked successfully.';
                                }
                                
                                Alert.alert(
                                    'Calendar Service Unavailable',
                                    errorMessage,
                                    [{ text: 'OK' }]
                                );
                                if (onSkip) onSkip();
                                resolve({ addToCalendar: false, error: error.message });
                            }
                        }
                    }
                ],
                { cancelable: false }
            );
        });
    }

    /**
     * Prompt user for calendar update during rescheduling
     */
    static async promptForReschedule(appointmentDetails, onConfirm, onSkip) {
        const { doctorName, workplaceName, oldDate, oldTime, newDate, newTime } = appointmentDetails;
        
        // Check if calendar service is available
        const isServiceAvailable = await this.isCalendarServiceAvailable();
        if (!isServiceAvailable) {
            console.log('[CalendarPrompt] Calendar service not available, skipping prompt');
            if (onSkip) onSkip();
            return { updateCalendar: false, reason: 'service_unavailable' };
        }
        
        return new Promise((resolve) => {
            Alert.alert(
                '📅 Update Calendar?',
                `Would you like to update this appointment in your Google Calendar?\n\n🏥 ${workplaceName}\n👨‍⚕️ Dr. ${doctorName}\n\nFrom: ${oldDate} at ${oldTime}\nTo: ${newDate} at ${newTime}`,
                [
                    {
                        text: 'Skip',
                        style: 'cancel',
                        onPress: () => {
                            console.log('[CalendarPrompt] User skipped calendar update');
                            if (onSkip) onSkip();
                            resolve({ updateCalendar: false });
                        }
                    },
                    {
                        text: 'Update Calendar',
                        onPress: async () => {
                            try {
                                console.log('[CalendarPrompt] User confirmed calendar update');
                                const calendarData = await this.handleCalendarIntegration();
                                if (onConfirm) onConfirm(calendarData);
                                resolve({ updateCalendar: true, calendarData });
                            } catch (error) {
                                console.error('[CalendarPrompt] Calendar update failed:', error);
                                Alert.alert(
                                    'Calendar Error',
                                    'Could not update calendar. Your appointment is still rescheduled successfully.',
                                    [{ text: 'OK' }]
                                );
                                if (onSkip) onSkip();
                                resolve({ updateCalendar: false, error: error.message });
                            }
                        }
                    }
                ],
                { cancelable: false }
            );
        });
    }

    /**
     * Prompt user for calendar removal during cancellation
     */
    static async promptForCancellation(appointmentDetails, onConfirm, onSkip) {
        const { doctorName, workplaceName, date, timeSlot } = appointmentDetails;
        
        // Check if calendar service is available
        const isServiceAvailable = await this.isCalendarServiceAvailable();
        if (!isServiceAvailable) {
            console.log('[CalendarPrompt] Calendar service not available, skipping prompt');
            if (onSkip) onSkip();
            return { removeFromCalendar: false, reason: 'service_unavailable' };
        }
        
        return new Promise((resolve) => {
            Alert.alert(
                '📅 Remove from Calendar?',
                `Would you like to remove this appointment from your Google Calendar?\n\n🏥 ${workplaceName}\n👨‍⚕️ Dr. ${doctorName}\n📅 ${date}\n🕐 ${timeSlot}`,
                [
                    {
                        text: 'Keep in Calendar',
                        style: 'cancel',
                        onPress: () => {
                            console.log('[CalendarPrompt] User chose to keep calendar event');
                            if (onSkip) onSkip();
                            resolve({ removeFromCalendar: false });
                        }
                    },
                    {
                        text: 'Remove from Calendar',
                        onPress: async () => {
                            try {
                                console.log('[CalendarPrompt] User confirmed calendar removal');
                                const calendarData = await this.handleCalendarIntegration();
                                if (onConfirm) onConfirm(calendarData);
                                resolve({ removeFromCalendar: true, calendarData });
                            } catch (error) {
                                console.error('[CalendarPrompt] Calendar removal failed:', error);
                                Alert.alert(
                                    'Calendar Error',
                                    'Could not update calendar. Your appointment is still cancelled successfully.',
                                    [{ text: 'OK' }]
                                );
                                if (onSkip) onSkip();
                                resolve({ removeFromCalendar: false, error: error.message });
                            }
                        }
                    }
                ],
                { cancelable: false }
            );
        });
    }

    /**
     * Handle calendar integration (connection if needed)
     */
    static async handleCalendarIntegration() {
        try {
            // Check if already connected
            const isConnected = await calendarService.isCalendarConnected();
            
            if (isConnected) {
                // Get existing calendar data
                const calendarData = await calendarService.getCalendarData();
                return calendarData;
            }

            // Need to connect - show connection flow
            return await this.promptCalendarConnection();
            
        } catch (error) {
            console.error('[CalendarPrompt] Integration error:', error);
            
            // Check if it's a backend issue (401, 404, etc.)
            if (error.message.includes('HTTP 401') || error.message.includes('HTTP 404') || error.message.includes('HTTP 500')) {
                throw new Error('Calendar service is not available. Please try again later.');
            }
            
            throw error;
        }
    }

    /**
     * Prompt for calendar connection when needed
     */
    static async promptCalendarConnection() {
        return new Promise((resolve, reject) => {
            Alert.alert(
                '🔗 Connect Google Calendar',
                'To add this appointment to your calendar, we need to connect to your Google Calendar first.\n\nYou will be redirected to Google for authorization.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            reject(new Error('User cancelled calendar connection'));
                        }
                    },
                    {
                        text: 'Connect',
                        onPress: async () => {
                            try {
                                await calendarService.initializeGoogleCalendar();
                                
                                // Wait for connection (this would be handled by deep linking)
                                // For now, we'll simulate a connection process
                                Alert.alert(
                                    'Calendar Connection',
                                    'Please complete the authorization in your browser and return to the app.',
                                    [
                                        {
                                            text: 'OK',
                                            onPress: () => {
                                                reject(new Error('Manual connection flow - please try again after authorization'));
                                            }
                                        }
                                    ]
                                );
                            } catch (error) {
                                reject(error);
                            }
                        }
                    }
                ],
                { cancelable: false }
            );
        });
    }

    /**
     * Show success message with calendar status
     */
    static showSuccessMessage(operation, details) {
        const { success, calendarIntegrated, message } = details;
        
        let title = '';
        let defaultMessage = '';
        
        switch (operation) {
            case 'book':
                title = '🎉 Appointment Booked!';
                defaultMessage = 'Your appointment has been booked successfully.';
                break;
            case 'reschedule':
                title = '✅ Appointment Rescheduled!';
                defaultMessage = 'Your appointment has been rescheduled successfully.';
                break;
            case 'cancel':
                title = '❌ Appointment Cancelled';
                defaultMessage = 'Your appointment has been cancelled successfully.';
                break;
        }

        const finalMessage = message || defaultMessage;
        const calendarStatus = calendarIntegrated ? '\n\n📅 Calendar has been updated!' : '';

        Alert.alert(
            title,
            finalMessage + calendarStatus,
            [{ text: 'OK' }]
        );
    }
}

export default CalendarPromptService;