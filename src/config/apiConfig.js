import { encryptQueryId } from '../utils/queryParamCrypto';

const securePathId = (id) => encodeURIComponent(encryptQueryId(id));

// API Configuration - Centralized API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGOUT: '/api/auth/logout',
    VERIFY_MOBILE: '/api/auth/verify-mobile',  // POST - Direct mobile verification (MVP)
    CHECK_MOBILE: '/api/auth/check-mobile',
    SET_PIN: '/api/auth/setpin',
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
  },

  // Registration endpoints
  REGISTRATION: {
    USER: '/api/register/user',        // POST - Register new user
    DOCTOR: '/api/registration/doctor',    // POST - Register new doctor
  },

  // Doctor endpoints
  DOCTOR: {
    PROFILE: '/api/doctor/profile',                    // GET - Own profile (JWT)
    PROFILE_BY_ID: (doctorId) => `/api/doctor/${securePathId(doctorId)}/profile`,  // GET - Profile by ID
    PROFILE_DETAILED: (doctorId) => `/api/doctor/${securePathId(doctorId)}`,  // GET - Detailed profile with workplaces
    EDIT_PROFILE: (doctorId) => `/api/doctor/${securePathId(doctorId)}/edit-profile`,  // PUT - Edit profile
    ADD_WORKPLACE: (doctorId) => `/api/doctors/${securePathId(doctorId)}/add-workplaces`,  // POST - Add workplace
    WORKPLACES: (doctorId) => `/api/doctors/${securePathId(doctorId)}/workplaces`,  // GET - Get workplaces with appointment counts
    EDIT_WORKPLACE: (doctorId) => `/api/doctor/${securePathId(doctorId)}/edit-profile`,  // PUT - Edit workplace using edit-profile endpoint
    APPOINTMENTS: (doctorId) => `/api/doctor/${securePathId(doctorId)}/appointments`,
    APPOINTMENTS_HISTORY: (doctorId) => `/api/doctor/${securePathId(doctorId)}/appointments/history`,
    RESCHEDULE_APPOINTMENTS: (doctorId) => `/api/doctor/${securePathId(doctorId)}/appointments/reschedule`,
    CANCEL_DAY: (doctorId) => `/api/doctor/${securePathId(doctorId)}/appointments/cancel-day`,
  // Updated to match API: /api/doctor/workspaces/{workspaceId}/appointments/cancel-day
  CANCEL_WORKSPACE_DAY: (workspaceId) => `/api/doctor/workspaces/${securePathId(workspaceId)}/appointments/cancel-day`,
    // Block slots endpoints
    BLOCK_SLOTS: (doctorId) => `/api/doctor/${securePathId(doctorId)}/block-slots`,
    BLOCKED_SLOTS: (doctorId) => `/api/doctor/${securePathId(doctorId)}/blocked-slots`,
    REMOVE_BLOCKED_SLOT: (blockedSlotId) => `/api/doctor/blocked-slots/${securePathId(blockedSlotId)}`,
    // New endpoints
    APPOINTMENTS_WITH_USERS: (doctorId, date) => `/api/doctor/${securePathId(doctorId)}/appointments/date/${date}/users`,
    BULK_UPDATE_STATUS: (doctorId, date) => `/api/doctor/${securePathId(doctorId)}/appointments/date/${date}/bulk-status`,
    WORKPLACE_APPOINTMENTS: (workplaceId) => `/api/doctors/workplaces/${securePathId(workplaceId)}/appointments`,
  },

  // User endpoints
  USER: {
    DETAILS: (userId) => `/api/user/${securePathId(userId)}`,               // Updated endpoint
    APPOINTMENTS: (userId) => `/api/user/${securePathId(userId)}/appointments`,
    // Enhanced endpoints
    ALL_APPOINTMENTS: (userId) => `/api/user/${securePathId(userId)}/appointments/all`,
    SEARCH_DOCTORS: '/api/user/search/doctors',        // GET with query params (deprecated)
    SEARCH_DOCTORS_ENHANCED: '/api/doctors/search/enhanced',  // GET with keyword param
    SEARCH_DOCTORS_NEARBY: '/api/doctors/search/nearby',  // GET with location param
    ALL_DOCTORS_PAGINATED: '/api/doctors/all',  // GET with page & size params
    DOCTOR_WORKPLACES: (doctorId) => `/api/user/doctor/${securePathId(doctorId)}/workplaces`,
    AVAILABLE_SLOTS: '/api/user/available-slots',      // GET with query params
    BOOK_APPOINTMENT: (userId) => `/api/user/${securePathId(userId)}/appointments/book`,   // POST
    CANCEL_APPOINTMENT: (appointmentId) => `/api/user/appointments/${securePathId(appointmentId)}/cancel`,
    RESCHEDULE_APPOINTMENT: '/api/user/appointments/reschedule', // PUT with appointmentId
    PUSH_TO_END: (userId, appointmentId) => `/api/user/${securePathId(userId)}/appointments/${securePathId(appointmentId)}/push-to-end`,
    // FCM Token registration
    FCM_TOKEN: (userId) => `/api/user/${securePathId(userId)}/fcm-token`,  // POST - Register FCM token
    NOTIFICATIONS_TOGGLE: (userId) => `/api/user/${securePathId(userId)}/notifications/toggle`, // PUT - Toggle notifications
  },

  // Slots endpoints
  SLOTS: {
    DOCTOR_AVAILABLE_SINGLE: (doctorId) => `/api/slots/doctor/${securePathId(doctorId)}/available`,  // ?date=YYYY-MM-DD
    DOCTOR_AVAILABLE_RANGE: (doctorId) => `/api/slots/doctor/${securePathId(doctorId)}/available`,   // ?fromDate=...&toDate=...
    DOCTOR_WORKPLACE_AVAILABLE: (doctorId, workplaceId) => 
      `/api/slots/doctor/${securePathId(doctorId)}/workplace/${securePathId(workplaceId)}/available`,
    ALL: (workplaceId) => `/api/slots/workplace/${securePathId(workplaceId)}/all`, // All slots for a workplace
  },

  // Appointments endpoints (general)
  APPOINTMENTS: {
    LIST: (doctorId, from, to) => `/api/doctor/${securePathId(doctorId)}/appointments?from=${from}&to=${to}`,
    DETAIL: (appointmentId) => `/api/appointments/${securePathId(appointmentId)}`,
    MARK_DONE: (appointmentId) => `/api/appointments/${securePathId(appointmentId)}/done`,
    ADD_NOTE: (appointmentId) => `/api/appointments/${securePathId(appointmentId)}/note`,
  },
};

// API response status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// API configuration settings
export const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};
