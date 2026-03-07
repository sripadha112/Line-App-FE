import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Default backend port used by your local server. Change if your backend uses a different port.
const DEFAULT_PORT = '8080';

function getDevHost() {
	// Try several places where Expo/Metro stores the host info. This works for Expo Go and local dev servers.
	const manifest = Constants.manifest || Constants.expoConfig || {};
	const hostField =
		(manifest && (manifest.debuggerHost || manifest.hostUri || manifest.host)) ||
		(manifest.packagerOpts && manifest.packagerOpts.host) ||
		null;

	if (hostField && typeof hostField === 'string') {
		// hostField may be like "192.168.1.5:19000" — return the IP part only
		return hostField.split(':')[0];
	}

	return null;
}

const detectedHost = getDevHost();

// For web platform in production, use the production API URL
// For development, use localhost
let API_BASE_URL;

if (Platform.OS === 'web') {
	// Web platform: check if we're on localhost (development) or production
	if (typeof window !== 'undefined' && window.location) {
		const isLocalhost = window.location.hostname === 'localhost' || 
		                   window.location.hostname === '127.0.0.1' ||
		                   window.location.hostname.includes('192.168');
		
		if (isLocalhost) {
			// Development: use localhost backend
			API_BASE_URL = `http://localhost:${DEFAULT_PORT}`;
		} else {
			// Production (neextapp.com or any non-localhost): use production API
			API_BASE_URL = 'https://line-application-latest.onrender.com';
		}
	} else {
		// Fallback: use production API
		API_BASE_URL = 'https://line-application-latest.onrender.com';
	}
} else {
	// Native platform (mobile)
	// If running on a physical device via Expo Go, detectedHost will be your PC's LAN IP (e.g. 192.168.x.x)
	// Otherwise fall back to the Android emulator host (10.0.2.2). You can also hard-code your PC IP.
	API_BASE_URL = detectedHost ? `http://${detectedHost}:${DEFAULT_PORT}` : 'http://10.0.2.2:8080';
}

// Uncomment this line to force production API for all platforms
// API_BASE_URL = 'https://line-application-latest.onrender.com';

console.log('📡 [Config] Platform:', Platform.OS, '| API URL:', API_BASE_URL);

export { API_BASE_URL };
export default API_BASE_URL;
