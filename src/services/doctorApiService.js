import { API_ENDPOINTS } from '../config/apiConfig';
import api from './api';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';

export class DoctorAPIService {
  // Fetch today's appointments
  static async fetchTodayAppointments(doctorId) {
    try {
      const today = new Date();
      const from = startOfDay(today).toISOString();
      const to = endOfDay(today).toISOString();
      const response = await api.get(API_ENDPOINTS.APPOINTMENTS.LIST(doctorId, from, to));
      return response.data || [];
    } catch (error) {
      console.log('Error fetching today appointments:', error.message);
      throw error;
    }
  }

  // Fetch appointment history
  static async fetchAppointmentHistory(doctorId, daysBack = 14) {
    try {
      const response = await api.get(API_ENDPOINTS.DOCTOR.APPOINTMENTS_HISTORY(doctorId));
      return response.data || [];
    } catch (error) {
      console.log('Error fetching appointment history:', error.message);
      throw error;
    }
  }

  // Fetch upcoming appointments
  static async fetchUpcomingAppointments(doctorId, daysAhead = 2) {
    try {
      const startDate = new Date();
      const endDate = addDays(startDate, daysAhead);
      const from = startOfDay(startDate).toISOString();
      const to = endOfDay(endDate).toISOString();
      const response = await api.get(API_ENDPOINTS.APPOINTMENTS.LIST(doctorId, from, to));
      return response.data || [];
    } catch (error) {
      console.log('Error fetching upcoming appointments:', error.message);
      throw error;
    }
  }

  // Fetch appointment by ID
  static async fetchAppointmentById(appointmentId) {
    try {
      const response = await api.get(API_ENDPOINTS.APPOINTMENTS.DETAIL(appointmentId));
      return response.data;
    } catch (error) {
      console.log('Error fetching appointment by ID:', error.message);
      throw error;
    }
  }

  // Mark appointment as done
  static async markAppointmentDone(appointmentId) {
    try {
      const response = await api.put(API_ENDPOINTS.APPOINTMENTS.MARK_DONE(appointmentId));
      return response.data;
    } catch (error) {
      console.log('Error marking appointment as done:', error.message);
      throw error;
    }
  }

  // Complete appointment
  static async completeAppointment(appointmentId) {
    try {
      const response = await api.put(`/api/doctors/appointments/${appointmentId}/complete`);
      return response.data;
    } catch (error) {
      console.log('Error completing appointment:', error.message);
      throw error;
    }
  }

  // Cancel appointment
  static async cancelAppointment(appointmentId) {
    try {
      console.log('📤 Cancelling appointment:', appointmentId);
      const response = await api.put(`/api/doctors/appointments/${appointmentId}/cancel`);
      console.log('📥 Cancel response:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Error cancelling appointment:', error.message);
      if (error.response) {
        console.log('❌ Response status:', error.response.status);
        console.log('❌ Response data:', error.response.data);
      }
      throw error;
    }
  }

  // Get user profile
  static async getUserProfile(userId) {
    try {
      console.log('📤 Fetching user profile:', userId);
      const response = await api.get(`/api/user/${userId}/profile`);
      console.log('📥 User profile response:', response.data);
      return response.data;
    } catch (error) {
      console.log('Error fetching user profile:', error.message);
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(userId, profileData) {
    try {
      console.log('📤 Updating user profile:', userId, profileData);
      const response = await api.put(`/api/user/${userId}/edit-profile`, profileData);
      console.log('📥 Update profile response:', response.data);
      return response.data;
    } catch (error) {
      console.log('Error updating user profile:', error.message);
      throw error;
    }
  }

  // Add appointment note
  static async addAppointmentNote(appointmentId, note) {
    try {
      const response = await api.post(API_ENDPOINTS.APPOINTMENTS.ADD_NOTE(appointmentId), { note });
      return response.data;
    } catch (error) {
      console.log('Error adding appointment note:', error.message);
      throw error;
    }
  }

  // Fetch appointments by workplace
  static async fetchAppointmentsByWorkplace(doctorId, workplaceId) {
    try {
      const response = await api.get(API_ENDPOINTS.DOCTOR.WORKPLACE_APPOINTMENTS(workplaceId));
      return response.data || [];
    } catch (error) {
      console.log('Error fetching appointments by workplace:', error.message);
      throw error;
    }
  }

  // Bulk reschedule appointments
  // New API: POST /api/doctor/{doctorId}/appointments/bulk-reschedule
  static async bulkRescheduleAppointments(doctorId, payload) {
    try {
      if (!doctorId) {
        throw new Error('doctorId is required for bulk reschedule');
      }
      const response = await api.post(`/api/doctor/${doctorId}/appointments/bulk-reschedule`, payload);
      return response.data;
    } catch (error) {
      console.log('Error bulk rescheduling appointments:', error.message);
      throw error;
    }
  }

  // Cancel workspace day appointments
  static async cancelWorkspaceDayAppointments(workspaceId, payload) {
    try {
      console.log('[doctorApiService] cancelWorkspaceDayAppointments -> workspaceId:', workspaceId);
      console.log('[doctorApiService] cancelWorkspaceDayAppointments payload:', JSON.stringify(payload, null, 2));
      const response = await api.post(API_ENDPOINTS.DOCTOR.CANCEL_WORKSPACE_DAY(workspaceId), payload);
      console.log('[doctorApiService] cancelWorkspaceDayAppointments response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.log('Error canceling workspace day appointments:', error.message, error.response?.data || 'no response data');
      throw error;
    }
  }

  // Fetch own profile
  static async fetchOwnProfile(doctorId) {
    try {
      const response = await api.get(API_ENDPOINTS.DOCTOR.PROFILE(doctorId));
      return response.data;
    } catch (error) {
      console.log('Error fetching own profile:', error.message);
      throw error;
    }
  }

  // Fetch doctor profile by ID
  static async fetchDoctorProfile(doctorId) {
    try {
      const response = await api.get(API_ENDPOINTS.DOCTOR.PROFILE_BY_ID(doctorId));
      return response.data;
    } catch (error) {
      console.log('Error fetching doctor profile:', error.message);
      throw error;
    }
  }

  // Fetch detailed doctor profile with workplaces
  static async fetchDetailedDoctorProfile(doctorId) {
    try {
      const response = await api.get(API_ENDPOINTS.DOCTOR.PROFILE_DETAILED(doctorId));
      return response.data;
    } catch (error) {
      console.log('Error fetching detailed doctor profile:', error.message);
      throw error;
    }
  }

  // Edit doctor profile
  static async editDoctorProfile(doctorId, profileData) {
    try {
      const response = await api.put(API_ENDPOINTS.DOCTOR.EDIT_PROFILE(doctorId), profileData);
      return response.data;
    } catch (error) {
      console.log('Error editing doctor profile:', error.message);
      throw error;
    }
  }

  // Fetch workplaces for a doctor (extracted from detailed profile)
  static async fetchWorkplaces(doctorId) {
    try {
      const response = await api.get(API_ENDPOINTS.DOCTOR.PROFILE_DETAILED(doctorId));
      return response.data.workplaces || [];
    } catch (error) {
      console.log('Error fetching workplaces:', error.message);
      return [];
    }
  }

  // Fetch workplaces with appointment counts for today's schedule
  static async fetchWorkplacesWithCounts(doctorId) {
    try {
      const response = await api.get(API_ENDPOINTS.DOCTOR.WORKPLACES(doctorId));
      return response.data || [];
    } catch (error) {
      console.log('Error fetching workplaces with counts:', error.message);
      throw error;
    }
  }

  // Add workplace
  static async addWorkplace(doctorId, workplaceData) {
    try {
      // Validate required fields before formatting
      if (!workplaceData.workplaceName || !workplaceData.workplaceName.toString().trim()) {
        throw new Error('Workplace name is required and cannot be empty');
      }
      if (!workplaceData.address || !workplaceData.address.toString().trim()) {
        throw new Error('Address is required and cannot be empty');
      }
      if (!workplaceData.checkingDurationMinutes || workplaceData.checkingDurationMinutes <= 0) {
        throw new Error('Valid checking duration is required');
      }

      // Format workplace data according to API requirements (single object without id and wrapper)
      // Ensure ALL fields are strings as per API requirement
      const requestData = {
        workplaceName: String(workplaceData.workplaceName || '').trim(),
        workplaceType: String(workplaceData.workplaceType || 'CLINIC'),
        address: String(workplaceData.address || '').trim(),
        city: String(workplaceData.city || '').trim(),
        state: String(workplaceData.state || '').trim(),
        pincode: String(workplaceData.pincode || '').trim(),
        country: String(workplaceData.country || '').trim(),
        contactNumber: String(workplaceData.contactNumber || '').trim(),
        morningStartTime: String(workplaceData.morningStartTime || '09:00'),
        morningEndTime: String(workplaceData.morningEndTime || '13:00'),
        eveningStartTime: String(workplaceData.eveningStartTime || '15:00'),
        eveningEndTime: String(workplaceData.eveningEndTime || '19:00'),
        checkingDurationMinutes: String(workplaceData.checkingDurationMinutes || '15'),
        isPrimary: String(Boolean(workplaceData.isPrimary))
      };

      // Final validation to ensure no empty required fields
      if (!requestData.workplaceName) {
        throw new Error('Workplace name cannot be empty after formatting');
      }
      if (!requestData.address) {
        throw new Error('Address cannot be empty after formatting');
      }
      if (!requestData.checkingDurationMinutes || requestData.checkingDurationMinutes === '0') {
        throw new Error('Checking duration must be greater than 0');
      }
      
      // Log the request data for debugging
      // console.log('Adding workplace with data:', JSON.stringify(requestData, null, 2));
      console.log('Request URL:', API_ENDPOINTS.DOCTOR.ADD_WORKPLACE(doctorId));
      // console.log('Doctor ID:', doctorId);
      
      // Add additional logging to capture the exact request
      const response = await api.post(API_ENDPOINTS.DOCTOR.ADD_WORKPLACE(doctorId), requestData);
      return response.data;
    } catch (error) {
      console.log('Error adding workplace:', error.message);
      console.log('Original workplaceData received:', JSON.stringify(workplaceData, null, 2));
      throw error;
    }
  }

  // Edit workplace
  static async editWorkplace(doctorId, workplaceData) {
    try {
      // Format workplace data according to API requirements with workplace ID
      const requestData = {
        workspaces: [{
          id: workplaceData.id, // Mandatory workplace ID for editing
          workplaceName: workplaceData.workplaceName,
          workplaceType: workplaceData.workplaceType,
          address: workplaceData.address,
          city: workplaceData.city || '',
          state: workplaceData.state || '',
          pincode: workplaceData.pincode || '',
          country: workplaceData.country || '',
          morningStartTime: workplaceData.morningStartTime,
          morningEndTime: workplaceData.morningEndTime,
          eveningStartTime: workplaceData.eveningStartTime,
          eveningEndTime: workplaceData.eveningEndTime,
          checkingDurationMinutes: workplaceData.checkingDurationMinutes || 15,
          isPrimary: workplaceData.isPrimary || false,
          contactNumber: workplaceData.contactNumber || ''
        }]
      };
      
      const response = await api.put(API_ENDPOINTS.DOCTOR.EDIT_PROFILE(doctorId), requestData);
      return response.data;
    } catch (error) {
      console.log('Error editing workplace:', error.message);
      throw error;
    }
  }

  // Fetch appointments with user details for a specific date
  static async fetchAppointmentsWithUsers(doctorId, appointmentDate) {
    try {
      const response = await api.get(API_ENDPOINTS.DOCTOR.APPOINTMENTS_WITH_USERS(doctorId, appointmentDate));
      return response.data || [];
    } catch (error) {
      console.log('Error fetching appointments with users:', error.message);
      throw error;
    }
  }

  // Bulk update appointment status
  static async bulkUpdateAppointmentStatus(doctorId, appointmentDate, payload) {
    try {
      const response = await api.put(API_ENDPOINTS.DOCTOR.BULK_UPDATE_STATUS(doctorId, appointmentDate), payload);
      return response.data;
    } catch (error) {
      console.log('Error bulk updating appointment status:', error.message);
      throw error;
    }
  }
}

export class UserAPIService {
  // Fetch user profile using the correct endpoint
  static async fetchUserProfile(userId) {
    try {
      console.log('Fetching user profile for userId:', userId);
      console.log('UserId type:', typeof userId);
      
      // Ensure userId is a number
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId)) {
        throw new Error('Invalid userId provided');
      }
      
      const response = await api.get(API_ENDPOINTS.USER.DETAILS(numericUserId));
      console.log('User profile response:', response.data);
      return response.data;
    } catch (error) {
      console.log('Error fetching user profile:', error.message);
      console.log('Error response:', error.response?.data);
      console.log('Error status:', error.response?.status);
      throw error;
    }
  }

  // Fetch user details (alias for fetchUserProfile)
  static async fetchUserDetails(userId) {
    try {
      // Ensure userId is a number
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId)) {
        throw new Error('Invalid userId provided');
      }
      
      const response = await api.get(API_ENDPOINTS.USER.DETAILS(numericUserId));
      return response.data;
    } catch (error) {
      console.log('Error fetching user details:', error.message);
      throw error;
    }
  }

  // Fetch user appointments
  static async fetchUserAppointments(userId) {
    try {
      // Ensure userId is a number
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId)) {
        throw new Error('Invalid userId provided');
      }
      
      const response = await api.get(API_ENDPOINTS.USER.APPOINTMENTS(numericUserId));
      return response.data || [];
    } catch (error) {
      console.log('Error fetching user appointments:', error.message);
      throw error;
    }
  }

  // Fetch all user appointments (for calendar and history) - Enhanced response
  static async fetchAllUserAppointments(userId) {
    try {
      console.log('Fetching all user appointments for userId:', userId);
      console.log('UserId type:', typeof userId);
      
      // Ensure userId is a number
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId)) {
        throw new Error('Invalid userId provided');
      }
      
      const response = await api.get(API_ENDPOINTS.USER.ALL_APPOINTMENTS(numericUserId));
      console.log('All appointments response:', response.data);
      return response.data || { appointmentsByDate: {}, totalAppointments: 0 };
    } catch (error) {
      console.log('Error fetching all user appointments:', error.message);
      console.log('Error response:', error.response?.data);
      throw error;
    }
  }

  // Search doctors by specialty or name
  static async searchDoctors(query, specialty = null) {
    try {
      let url = API_ENDPOINTS.USER.SEARCH_DOCTORS;
      const params = new URLSearchParams();
      
      if (query) params.append('query', query);
      if (specialty) params.append('specialty', specialty);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await api.get(url);
      return response.data || [];
    } catch (error) {
      console.log('Error searching doctors:', error.message);
      throw error;
    }
  }

  // Enhanced search doctors - supports doctor name, id, area, clinic/hospital name
  static async searchDoctorsEnhanced(keyword) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('keyword', keyword);
      
      const url = `${API_ENDPOINTS.USER.SEARCH_DOCTORS_ENHANCED}?${queryParams.toString()}`;
      console.log('🔍 Enhanced search URL:', url);
      
      const response = await api.get(url);
      console.log('🎯 Enhanced search response:', response.data);
      return response.data || [];
    } catch (error) {
      console.log('Error in enhanced search:', error.message);
      throw error;
    }
  }

  // Search nearby doctors by pincode
  static async searchNearbyDoctors(pincode) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('location', pincode);
      
      const url = `${API_ENDPOINTS.USER.SEARCH_DOCTORS_NEARBY}?${queryParams.toString()}`;
      console.log('📍 Nearby search URL:', url);
      
      const response = await api.get(url);
      console.log('🏥 Nearby doctors response:', response.data);
      return response.data || [];
    } catch (error) {
      console.log('Error in nearby search:', error.message);
      throw error;
    }
  }

  // Fetch doctor workplaces
  static async fetchDoctorWorkplaces(doctorId) {
    try {
      const response = await api.get(API_ENDPOINTS.USER.DOCTOR_WORKPLACES(doctorId));
      return response.data || [];
    } catch (error) {
      console.log('Error fetching doctor workplaces:', error.message);
      throw error;
    }
  }

  // Fetch available slots (deprecated - use getAvailableSlots instead)
  static async fetchAvailableSlots(doctorId, workplaceId, date = null) {
    try {
      let url = `${API_ENDPOINTS.USER.AVAILABLE_SLOTS}?doctorId=${doctorId}&workplaceId=${workplaceId}`;
      if (date) {
        url += `&date=${date}`;
        console.log('📅 Using specific date for slots:', date);
      } else {
        console.log('📅 Using default date range (next 3 days)');
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.log('Error fetching available slots:', error.message);
      throw error;
    }
  }

  // Book appointment
  static async bookAppointment(userId, appointmentData) {
    try {
      if (!userId) {
        throw new Error('userId is required for booking appointment');
      }
      
      console.log('📤 Sending booking request to:', API_ENDPOINTS.USER.BOOK_APPOINTMENT(userId));
      console.log('📦 Request body:', JSON.stringify(appointmentData, null, 2));
      
      const response = await api.post(API_ENDPOINTS.USER.BOOK_APPOINTMENT(userId), appointmentData);
      
      console.log('📥 Booking response:', response.data);
      
      return response.data;
    } catch (error) {
      console.log('❌ Error booking appointment:', error.message);
      if (error.response) {
        console.log('❌ Response error data:', error.response.data);
        console.log('❌ Response status:', error.response.status);
      }
      throw error;
    }
  }

  // Reschedule appointment
  static async rescheduleAppointment(appointmentId, rescheduleData) {
    try {
      console.log('📤 Rescheduling appointment:', appointmentId);
      console.log('📦 Reschedule data:', rescheduleData);
      
      // Add appointmentId to the request body
      const requestData = {
        appointmentId: appointmentId,
        ...rescheduleData
      };
      
      console.log('📤 Final request data:', requestData);
      
      const response = await api.put(API_ENDPOINTS.USER.RESCHEDULE_APPOINTMENT, requestData);
      
      console.log('📥 Reschedule response:', response.data);
      return response.data;
    } catch (error) {
      console.log('Error rescheduling appointment:', error.message);
      console.log('Error response:', error.response?.data);
      throw error;
    }
  }

  // Push appointment to end
  static async pushAppointmentToEnd(userId, appointmentId, reason) {
    try {
      const response = await api.post(API_ENDPOINTS.USER.PUSH_TO_END(userId, appointmentId), { reason });
      return response.data;
    } catch (error) {
      console.log('Error pushing appointment to end:', error.message);
      throw error;
    }
  }

  // Get available slots for booking appointments
  static async getAvailableSlots(doctorId, workplaceId, params = {}) {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('doctorId', doctorId);
      queryParams.append('workplaceId', workplaceId);
      
      // Add date parameter if provided (format: YYYY-MM-DD)
      if (params.date) {
        queryParams.append('date', params.date);
        console.log('📅 Using specific date for slots:', params.date);
      } else {
        console.log('📅 Using default date range (next 3 days)');
      }
      
      const url = `${API_ENDPOINTS.USER.AVAILABLE_SLOTS}?${queryParams.toString()}`;
      
      console.log('🔍 Fetching available slots from:', url);
      const response = await api.get(url);
      
      // Return the full response data which includes slotsByDate, doctorName, etc.
      const data = response.data || {};
      // console.log('📅 API Response:', data);
      
      if (!data.slotsByDate) {
        console.warn('⚠️ API returned response without slotsByDate:', data);
        return { slotsByDate: {}, doctorName: '', workplaceName: '', doctorId: null, workplaceId: null };
      }
      
      return data;
    } catch (error) {
      console.log('Error fetching available slots:', error.message);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(userId, profileData) {
    try {
      console.log('Updating user profile for userId:', userId);
      console.log('Profile data:', profileData);
      
      // Ensure userId is a number
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId)) {
        throw new Error('Invalid userId provided');
      }
      
      const response = await api.put(`/api/user/${numericUserId}/edit-profile`, profileData);
      console.log('Profile update response:', response.data);
      return response.data;
    } catch (error) {
      console.log('Error updating user profile:', error.message);
      console.log('Error response:', error.response?.data);
      console.log('Error status:', error.response?.status);
      throw error;
    }
  }
}

export class SlotsAPIService {
  // Get available slots for a workplace
  static async getAvailableSlots(workplaceId, params = {}) {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('workplaceId', workplaceId);
      
      if (params.doctorId) queryParams.append('doctorId', params.doctorId);
      
      // Add date parameter if provided (format: YYYY-MM-DD)
      if (params.date) {
        queryParams.append('date', params.date);
        console.log('📅 Using specific date for slots:', params.date);
      } else {
        console.log('📅 Using default date range (next 3 days)');
      }
      
      const url = `${API_ENDPOINTS.USER.AVAILABLE_SLOTS}?${queryParams.toString()}`;
      
      console.log('🔍 Fetching available slots from:', url);
      const response = await api.get(url);
      
      // Return the full response data which includes slotsByDate, doctorName, etc.
      const data = response.data || {};
      // console.log('📅 API Response:', data);
      
      if (!data.slotsByDate) {
        console.warn('⚠️ API returned response without slotsByDate:', data);
        return { slotsByDate: {}, doctorName: '', workplaceName: '', doctorId: null, workplaceId: null };
      }
      
      return data;
    } catch (error) {
      console.log('Error fetching available slots:', error.message);
      throw error;
    }
  }

  // Get all slots for a workplace
  static async getAllSlots(workplaceId) {
    try {
      const response = await api.get(API_ENDPOINTS.SLOTS.ALL(workplaceId));
      return response.data || [];
    } catch (error) {
      console.log('Error fetching all slots:', error.message);
      throw error;
    }
  }

  // Create new slot
  static async createSlot(slotData) {
    try {
      const response = await api.post(API_ENDPOINTS.SLOTS.CREATE, slotData);
      return response.data;
    } catch (error) {
      console.log('Error creating slot:', error.message);
      throw error;
    }
  }

  // Update slot
  static async updateSlot(slotId, slotData) {
    try {
      const response = await api.put(API_ENDPOINTS.SLOTS.UPDATE(slotId), slotData);
      return response.data;
    } catch (error) {
      console.log('Error updating slot:', error.message);
      throw error;
    }
  }

  // Delete slot
  static async deleteSlot(slotId) {
    try {
      const response = await api.delete(API_ENDPOINTS.SLOTS.DELETE(slotId));
      return response.data;
    } catch (error) {
      console.log('Error deleting slot:', error.message);
      throw error;
    }
  }
}

export class AuthAPIService {
  // Request OTP
  static async requestOTP(mobile) {
    try {
      const response = await api.post('/api/auth/request-otp', { mobile });
      return response.data;
    } catch (error) {
      console.log('Error requesting OTP:', error.message);
      throw error;
    }
  }

  // Verify OTP
  static async verifyOTP(mobile, otp) {
    try {
      const response = await api.post('/api/auth/verify-otp', { mobile, otp });
      return response.data;
    } catch (error) {
      console.log('Error verifying OTP:', error.message);
      throw error;
    }
  }

  // Register user
  static async registerUser(userData) {
    try {
      const response = await api.post('/api/register/user', userData);
      return response.data;
    } catch (error) {
      console.log('Error registering user:', error.message);
      throw error;
    }
  }

  // Register doctor
  static async registerDoctor(doctorData) {
    try {
      const response = await api.post('/api/registration/doctor', doctorData);
      return response.data;
    } catch (error) {
      console.log('Error registering doctor:', error.message);
      throw error;
    }
  }

  // Logout
  static async logout() {
    try {
      const response = await api.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      console.log('Error logging out:', error.message);
      throw error;
    }
  }
}
