import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Platform-aware secure storage
 * Uses SecureStore on native platforms and localStorage on web
 */
const SecureStorage = {
  async getItemAsync(key) {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('localStorage error:', e);
        return null;
      }
    }
    return await SecureStore.getItemAsync(key);
  },

  async setItemAsync(key, value) {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn('localStorage error:', e);
        throw e;
      }
    }
    return await SecureStore.setItemAsync(key, value);
  },

  async deleteItemAsync(key) {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
        return;
      } catch (e) {
        console.warn('localStorage error:', e);
        throw e;
      }
    }
    return await SecureStore.deleteItemAsync(key);
  }
};

export default SecureStorage;
