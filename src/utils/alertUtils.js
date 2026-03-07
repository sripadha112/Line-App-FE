import { Alert, Platform } from 'react-native';

/**
 * Platform-aware Alert utility
 * Works with Alert.alert on native and window.alert/confirm on web
 */
export const showAlert = (title, message, buttons = [], options = {}) => {
  if (Platform.OS === 'web') {
    // Web implementation
    const fullMessage = title && message ? `${title}\n\n${message}` : (message || title);
    
    if (!buttons || buttons.length === 0) {
      // Simple alert
      window.alert(fullMessage);
      return;
    }
    
    if (buttons.length === 1) {
      // Single button alert
      window.alert(fullMessage);
      if (buttons[0].onPress) {
        buttons[0].onPress();
      }
      return;
    }
    
    // Multiple buttons - use confirm dialog
    const confirmed = window.confirm(fullMessage);
    
    if (confirmed) {
      // Find and execute the confirm/positive button
      const confirmButton = buttons.find(btn => 
        btn.style !== 'cancel' && btn.text !== 'Cancel'
      );
      if (confirmButton && confirmButton.onPress) {
        confirmButton.onPress();
      }
    } else {
      // Find and execute the cancel button
      const cancelButton = buttons.find(btn => 
        btn.style === 'cancel' || btn.text === 'Cancel'
      );
      if (cancelButton && cancelButton.onPress) {
        cancelButton.onPress();
      }
    }
  } else {
    // Native implementation
    Alert.alert(title, message, buttons, options);
  }
};

/**
 * Platform-aware prompt utility
 * Works with Alert.prompt on iOS and window.prompt on web
 */
export const showPrompt = (title, message, callbackOrButtons, type, defaultValue) => {
  if (Platform.OS === 'web') {
    const fullMessage = title && message ? `${title}\n\n${message}` : (message || title);
    const result = window.prompt(fullMessage, defaultValue || '');
    
    if (result !== null && typeof callbackOrButtons === 'function') {
      callbackOrButtons(result);
    } else if (result !== null && Array.isArray(callbackOrButtons)) {
      // Handle buttons array format
      const confirmButton = callbackOrButtons.find(btn => 
        btn.style !== 'cancel' && btn.text !== 'Cancel'
      );
      if (confirmButton && confirmButton.onPress) {
        confirmButton.onPress(result);
      }
    }
  } else {
    if (Platform.OS === 'ios') {
      Alert.prompt(title, message, callbackOrButtons, type, defaultValue);
    } else {
      // Android doesn't support Alert.prompt, fall back to custom implementation
      Alert.alert(title, message, callbackOrButtons);
    }
  }
};

export default { showAlert, showPrompt };
