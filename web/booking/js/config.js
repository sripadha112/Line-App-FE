// API Configuration
const API_CONFIG = {
    //BASE_URL: 'http://192.168.1.74:8080/api', // local application url, use it while testing bro.
    BASE_URL: 'https://line-application-latest.onrender.com/api', // actual API URL
    ENDPOINTS: {
        AVAILABLE_SLOTS: '/user/available-slots',
        BOOK_APPOINTMENT: '/user/{userId}/appointments/book',
        REGISTER_USER: '/register/user'
    }
};

// App Download Links
const APP_DOWNLOAD_LINKS = {
    DEFAULT: 'https://neextapp.com/download', 
    ANDROID: 'https://play.google.com/store/apps/details?id=com.quickbooking',
    IOS: 'https://apps.apple.com/app/quickbooking/id123456789'
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
    module.exports = { API_CONFIG, APP_DOWNLOAD_LINKS, DATE_FORMAT_OPTIONS, VALIDATION };
}
