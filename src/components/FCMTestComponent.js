import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import fcmService from '../services/fcmService';

/**
 * FCM Test Component - Only visible for admin (mobile: 8790672731)
 * Provides buttons to test various FCM features
 */
const FCMTestComponent = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current user is admin
    checkAdminAccess();
    
    // Get initial FCM status
    checkFCMStatus();
    
    // Listen for FCM updates
    const interval = setInterval(checkFCMStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Admin mobile number
      const ADMIN_MOBILE = '8790672731';
      
      // Get current user's mobile number from secure storage
      const userMobile = await SecureStore.getItemAsync('mobile');
      
      // Check if current user is admin
      if (userMobile === ADMIN_MOBILE) {
        setIsAdmin(true);
        console.log('✅ Admin access granted for FCM Test Panel');
      } else {
        setIsAdmin(false);
        console.log('🚫 FCM Test Panel hidden - Not admin user');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    }
  };

  const checkFCMStatus = () => {
    const token = fcmService.getCurrentToken();
    const ready = fcmService.isReady();
    
    setFcmToken(token);
    setIsReady(ready);
  };

  const handleRefreshToken = async () => {
    try {
      Alert.alert('Refreshing Token', 'Please wait...');
      const result = await fcmService.refreshToken();
      
      if (result.success) {
        Alert.alert('Success', `Token refreshed successfully!\n\nNew Token: ${result.token?.substring(0, 50)}...`);
        checkFCMStatus();
      } else {
        Alert.alert('Error', `Token refresh failed: ${result.message}`);
      }
    } catch (error) {
      Alert.alert('Error', `Token refresh error: ${error.message}`);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      if (!isReady) {
        Alert.alert('Not Ready', 'FCM service is not initialized. Please check permissions and try again.');
        return;
      }

      Alert.alert('Sending Test', 'Please wait...');
      const result = await fcmService.sendTestNotification();
      
      if (result.success) {
        const message = result.isDevelopment 
          ? 'Development test notification sent! Check your device for a local notification.'
          : 'Test notification sent successfully! Check your device for the notification.';
        Alert.alert('Success', message);
      } else {
        const errorMessage = result.networkError 
          ? `Network Error: Cannot connect to backend.\n\nBackend URL: ${result.backendUrl || 'Unknown'}\n\nPlease ensure your backend server is running.`
          : `Test notification failed: ${result.message}`;
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', `Test notification error: ${error.message}`);
    }
  };

  const handleReinitializeFCM = async () => {
    try {
      Alert.alert('Reinitializing', 'Please wait...');
      const result = await fcmService.initialize();
      
      if (result.success) {
        Alert.alert('Success', `FCM reinitialized successfully!\n\nToken: ${result.token?.substring(0, 50)}...`);
        checkFCMStatus();
      } else {
        Alert.alert('Error', `FCM reinitialization failed: ${result.message}`);
      }
    } catch (error) {
      Alert.alert('Error', `FCM reinitialization error: ${error.message}`);
    }
  };

  const handleCopyToken = () => {
    if (fcmToken) {
      // For Expo, we'll just show the token in an alert
      Alert.alert(
        'FCM Token',
        fcmToken,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Show in Console', onPress: () => console.log('📋 FCM Token:', fcmToken) }
        ]
      );
    } else {
      Alert.alert('No Token', 'FCM token is not available');
    }
  };

  const getStatusColor = () => {
    if (isReady) return '#4CAF50';
    if (fcmToken) return '#FF9800';
    return '#F44336';
  };

  const getStatusText = () => {
    if (isReady) {
      const isDev = fcmToken && (fcmToken.includes('DEV-') || fcmToken.includes('FALLBACK-'));
      return isDev ? 'Ready (Dev Mode)' : 'Ready (Production)';
    }
    if (fcmToken) return 'Token Available';
    return 'Not Initialized';
  };

  // Hide component if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 FCM Test Panel</Text>
      
      {/* Status Section */}
      <View style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>
          Status: {getStatusText()}
        </Text>
        <Text style={styles.platformText}>
          Platform: {Platform.OS} {Platform.Version}
        </Text>
        {fcmToken && (fcmToken.includes('DEV-') || fcmToken.includes('FALLBACK-')) && (
          <Text style={styles.devModeText}>
            ⚠️ Expo Go - Limited FCM functionality
          </Text>
        )}
      </View>

      {/* Development Mode Info */}
      {fcmToken && (fcmToken.includes('DEV-') || fcmToken.includes('FALLBACK-')) && (
        <View style={styles.devInfoContainer}>
          <Text style={styles.devInfoTitle}>📱 Development Mode</Text>
          <Text style={styles.devInfoText}>
            • Running in Expo Go{'\n'}
            • Using simulated notifications{'\n'}
            • For full FCM testing, build a development build{'\n'}
            • Real push notifications require production build
          </Text>
        </View>
      )}

      {/* Token Section */}
      <View style={styles.tokenContainer}>
        <Text style={styles.sectionTitle}>FCM Token:</Text>
        {fcmToken ? (
          <>
            <Text style={styles.tokenText} numberOfLines={3}>
              {fcmToken}
            </Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyToken}>
              <Text style={styles.copyButtonText}>View Full Token</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.noTokenText}>No token available</Text>
        )}
      </View>

      {/* Action Buttons */}
      <ScrollView style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleReinitializeFCM}
        >
          <Text style={styles.buttonText}>🔄 Reinitialize FCM</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={handleRefreshToken}
        >
          <Text style={styles.buttonText}>🔑 Refresh Token</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={handleSendTestNotification}
          disabled={!isReady}
        >
          <Text style={[styles.buttonText, !isReady && styles.disabledText]}>
            🧪 Send Simple Test
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.appointmentButton]} 
          onPress={async () => {
            try {
              Alert.alert('Sending Appointment Reminder', 'Please wait...');
              
              const appointmentData = {
                doctorName: 'Dr. John Smith',
                appointmentTime: '2:00 PM',
                appointmentId: '12345',
                patientName: 'Test Patient'
              };
              
              const result = await fcmService.sendAppointmentReminder(appointmentData);
              
              if (result.success) {
                Alert.alert('Success', 'Appointment reminder sent successfully!');
              } else {
                Alert.alert('Error', `Failed to send reminder: ${result.message}`);
              }
            } catch (error) {
              Alert.alert('Error', `Reminder error: ${error.message}`);
            }
          }}
          disabled={!isReady}
        >
          <Text style={[styles.buttonText, !isReady && styles.disabledText]}>
            📅 Test Appointment Reminder
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.confirmButton]} 
          onPress={async () => {
            try {
              Alert.alert('Sending Rich Notification', 'Please wait...');
              
              const richOptions = {
                title: 'Rich Test Notification',
                body: 'This is a rich notification with custom data and platform features',
                data: {
                  testId: '12345',
                  type: 'rich_test'
                },
                iosConfig: {
                  sound: 'default',
                  badge: 1
                },
                androidConfig: {
                  channelId: 'test_channel',
                  priority: 'high',
                  color: '#FF5722'
                }
              };
              
              const result = await fcmService.sendRichNotification(richOptions);
              
              if (result.success) {
                Alert.alert('Success', 'Rich notification sent successfully!');
              } else {
                Alert.alert('Error', `Failed to send rich notification: ${result.message}`);
              }
            } catch (error) {
              Alert.alert('Error', `Rich notification error: ${error.message}`);
            }
          }}
          disabled={!isReady}
        >
          <Text style={[styles.buttonText, !isReady && styles.disabledText]}>
            ✨ Test Rich Notification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={async () => {
            try {
              Alert.alert('Testing Backend', 'Checking Firebase and notification services...');
              
              // Check Firebase status
              const firebaseResult = await fcmService.checkFirebaseStatus();
              
              // Check notification health
              const healthResult = await fcmService.checkNotificationHealth();
              
              const backendUrl = fcmService.baseURL;
              
              if (firebaseResult.success && healthResult.success) {
                Alert.alert(
                  'Backend Status ✅',
                  `Firebase: ${firebaseResult.initialized ? 'INITIALIZED' : 'NOT READY'}\n` +
                  `Notifications: ${healthResult.running ? 'RUNNING' : 'DOWN'}\n\n` +
                  `URL: ${backendUrl}\n\n` +
                  `Firebase Status: ${firebaseResult.status}\n` +
                  `Health: ${healthResult.health}`
                );
              } else {
                const errors = [];
                if (!firebaseResult.success) errors.push(`Firebase: ${firebaseResult.message}`);
                if (!healthResult.success) errors.push(`Notifications: ${healthResult.message}`);
                
                Alert.alert(
                  'Backend Status ⚠️',
                  `Some services are not available:\n\n${errors.join('\n')}\n\nURL: ${backendUrl}`
                );
              }
            } catch (error) {
              const backendUrl = fcmService.baseURL;
              Alert.alert(
                'Backend Status ❌',
                `Cannot connect to backend!\n\nURL: ${backendUrl}\nError: ${error.message}\n\nPlease ensure your backend server is running.`
              );
            }
          }}
        >
          <Text style={styles.buttonText}>🔥 Test Firebase Backend</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.appointmentTestButton]} 
          onPress={async () => {
            try {
              Alert.alert('Testing Appointment System', 'Sending test appointment notifications...');
              
              // Import the service dynamically to avoid circular imports
              const AppointmentNotificationService = require('../services/appointmentNotificationService').default;
              
              const result = await AppointmentNotificationService.testNotificationSystem();
              
              if (result.success) {
                Alert.alert('Success', 'Appointment notification system test completed! Check your device for notifications.');
              } else {
                Alert.alert('Error', `Test failed: ${result.message}`);
              }
            } catch (error) {
              Alert.alert('Error', `Appointment test error: ${error.message}`);
            }
          }}
          disabled={!isReady}
        >
          <Text style={[styles.buttonText, !isReady && styles.disabledText]}>
            🏥 Test Appointment System
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.infoButton]} 
          onPress={() => {
            console.log('📱 FCM Service Status:');
            console.log('🔑 Token:', fcmToken);
            console.log('✅ Ready:', isReady);
            console.log('📱 Platform:', Platform.OS);
            console.log('🌐 Backend URL:', fcmService.baseURL);
            Alert.alert('Info', 'FCM status logged to console. Check your development console for details.');
          }}
        >
          <Text style={styles.buttonText}>📊 Log Status</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  platformText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  devModeText: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  devInfoContainer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  devInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  devInfoText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  tokenContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  tokenText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  noTokenText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  copyButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    maxHeight: 200,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#FF9800',
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  infoButton: {
    backgroundColor: '#9C27B0',
  },
  warningButton: {
    backgroundColor: '#FF5722',
  },
  appointmentButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButton: {
    backgroundColor: '#FF9800',
  },
  appointmentTestButton: {
    backgroundColor: '#673AB7',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledText: {
    color: '#ccc',
  },
});

export default FCMTestComponent;