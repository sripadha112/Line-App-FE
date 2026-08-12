// API Configuration
const API_CONFIG = {
    //BASE_URL: 'http://192.168.1.74:8080/api', // local application url, use it while testing bro.
    BASE_URL: 'https://api.kedulz.com/api', // actual API URL
    ENDPOINTS: {
        AVAILABLE_SLOTS: '/user/available-slots',
        BOOK_APPOINTMENT: '/user/{userId}/appointments/book',
        QUICK_BOOK_APPOINTMENT: '/user/appointments/book',
        REGISTER_USER: '/register/user',
        CHECK_MOBILE: '/auth/check-mobile',
        USER_BY_MOBILE: '/user/mobile/{mobile}'
    }
};

// Date formatting options
const DATE_FORMAT_OPTIONS = {
    SHORT: { year: 'numeric', month: 'short', day: 'numeric' },
    LONG: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    MEDIUM: { month: 'short', day: 'numeric', year: 'numeric' }
};

// Validation patterns
const VALIDATION = {
    PHONE_PATTERN: /^[0-9]{10}$/,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NAME_MIN_LENGTH: 2,
    AGE_MIN: 1,
    AGE_MAX: 120
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, DATE_FORMAT_OPTIONS, VALIDATION };
}
