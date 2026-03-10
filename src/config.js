import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ==================== CONFIGURATION PROFILES ====================

const PROFILES = {
	dev: {
		name: 'Development',
		web: 'http://localhost:8080',
		mobile: 'http://localhost:8080', // or use getDevHost() for dynamic IP
		description: 'Local development server'
	},
	prod: {
		name: 'Production',
		web: 'https://line-application-latest.onrender.com',
		mobile: 'https://line-application-latest.onrender.com',
		description: 'Production server on Render'
	}
};

// Set active profile: 'dev' or 'prod'
// Check for EXPO_PUBLIC_API_ENV first, then NODE_ENV, then __DEV__
const ACTIVE_PROFILE = 
	process.env.EXPO_PUBLIC_API_ENV === 'prod' ? 'prod' :
	process.env.EXPO_PUBLIC_API_ENV === 'dev' ? 'dev' :
	process.env.NODE_ENV === 'production' ? 'prod' : 
	(__DEV__ ? 'dev' : 'prod');

// ==================== AUTO-DETECTION HELPERS ====================

const DEFAULT_PORT = '8080';

function getDevHost() {
	// Detects your PC's LAN IP for mobile development
	const manifest = Constants.manifest || Constants.expoConfig || {};
	const hostField =
		(manifest && (manifest.debuggerHost || manifest.hostUri || manifest.host)) ||
		(manifest.packagerOpts && manifest.packagerOpts.host) ||
		null;

	if (hostField && typeof hostField === 'string') {
		return hostField.split(':')[0];
	}
	return null;
}

// ==================== API BASE URL RESOLUTION ====================

let API_BASE_URL;
const activeConfig = PROFILES[ACTIVE_PROFILE];

if (Platform.OS === 'web') {
	// Web platform - use the profile configuration directly
	API_BASE_URL = activeConfig.web;
} else {
	// Mobile platform (iOS/Android)
	if (ACTIVE_PROFILE === 'dev') {
		// Development: try to detect host IP for Expo Go
		const detectedHost = getDevHost();
		API_BASE_URL = detectedHost 
			? `http://${detectedHost}:${DEFAULT_PORT}` 
			: activeConfig.mobile;
	} else {
		// Production
		API_BASE_URL = activeConfig.mobile;
	}
}

// ==================== LOGGING ====================

if (__DEV__) {
	console.log('📡 [Config] Profile:', ACTIVE_PROFILE, `(${activeConfig.name})`);
	console.log('📡 [Config] Platform:', Platform.OS, '| API URL:', API_BASE_URL);
	console.log('📡 [Config]', activeConfig.description);
}

export { API_BASE_URL, ACTIVE_PROFILE, PROFILES };
export default API_BASE_URL;
