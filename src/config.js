import Constants from 'expo-constants';

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

// If running on a physical device via Expo Go, detectedHost will be your PC's LAN IP (e.g. 192.168.x.x)
// Otherwise fall back to the Android emulator host (10.0.2.2). You can also hard-code your PC IP.
export const API_BASE_URL = detectedHost ? `http://${detectedHost}:${DEFAULT_PORT}` : 'http://10.0.2.2:8080';

export default API_BASE_URL;
