/**
 * API Service Layer
 * Handles all API communications
 */

class APIService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    /**
     * Generic fetch wrapper with error handling
     */
    async fetchAPI(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error(`Cannot connect to API server. Please check if the server is running.`);
            }
            throw error;
        }
    }

    /**
     * Get available slots for a workplace (next 3 days)
     * @param {number} doctorId - Doctor ID
     * @param {number} workplaceId - Workplace ID
     */
    async getAvailableSlots(doctorId, workplaceId) {
        try {
            const endpoint = `${API_CONFIG.ENDPOINTS.AVAILABLE_SLOTS}?doctorId=${doctorId}&workplaceId=${workplaceId}`;
            const response = await this.fetchAPI(endpoint);
            return response;
        } catch (error) {
            throw new Error('Failed to fetch available slots: ' + error.message);
        }
    }

    /**
     * Register user
     * @param {Object} userDetails - User registration details
     * @returns {Object} Response with userId
     */
    async registerUser(userDetails) {
        try {
            const endpoint = API_CONFIG.ENDPOINTS.REGISTER_USER;
            const userData = {
                mobileNumber: userDetails.phone,
                fullName: userDetails.name,
                email: userDetails.email || '',
                address: '',
                city: userDetails.city,
                state: '',
                pincode: '',
                country: ''
            };

            const url = `${this.baseURL}${endpoint}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            // Check if user already exists
            if (data.status === 'ERROR' && data.message && data.message.includes('already exists') && data.userId) {
                // User already exists, return the existing userId
                return {
                    userId: data.userId,
                    isExistingUser: true,
                    message: 'Existing user found'
                };
            }

            // Check for other errors
            if (!response.ok && !data.userId) {
                throw new Error(data.message || `Registration failed with status: ${response.status}`);
            }

            // Successful registration
            return {
                userId: data.userId || data.id,
                isExistingUser: false,
                message: 'User registered successfully'
            };
        } catch (error) {
            throw new Error('Failed to register user: ' + error.message);
        }
    }

    /**
     * Book appointment with registered user ID
     * @param {number} userId - User ID from registration
     * @param {Object} appointmentData - Appointment details
     * @param {Object} userDetails - User details for notes
     */
    async bookAppointment(userId, appointmentData, userDetails) {
        try {
            const bookingData = {
                doctorId: appointmentData.doctorId,
                workplaceId: appointmentData.workplaceId,
                requestedTime: appointmentData.requestedTime,
                slot: appointmentData.slot,
                notes: appointmentData.notes || `Booking via QuickBooking. Notes: ${userDetails.notes || 'None'}`
            };

            const endpoint = API_CONFIG.ENDPOINTS.BOOK_APPOINTMENT.replace('{userId}', userId);
            const response = await this.fetchAPI(endpoint, {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });

            return response;
        } catch (error) {
            throw new Error('Failed to book appointment: ' + error.message);
        }
    }
}

// Create singleton instance
const apiService = new APIService();
