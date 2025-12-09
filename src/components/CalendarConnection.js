import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import calendarService from '../services/calendarService';

// Try to import Ionicons, fallback to text if not available
let Ionicons;
try {
  Ionicons = require('@expo/vector-icons').Ionicons;
} catch (error) {
  console.warn('Ionicons not available, using text fallback');
  Ionicons = null;
}

const CalendarConnection = ({ style = {} }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check initial connection status
  const checkConnectionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const connected = await calendarService.isCalendarConnected();
      setIsConnected(connected);
      
      if (connected) {
        // Test the connection
        const testResult = await calendarService.testConnection();
        if (!testResult.connected) {
          setIsConnected(false);
          await calendarService.clearTokens();
        }
      }
    } catch (error) {
      console.error('[CalendarConnection] Error checking connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Setup deep linking listener for OAuth callback
  useEffect(() => {
    checkConnectionStatus();

    // Add event listener for deep links (OAuth callback)
    const handleDeepLink = async (url) => {
      if (url && url.includes('code=')) {
        try {
          setIsConnecting(true);
          const result = await calendarService.handleDeepLink(url);
          
          if (result.success) {
            setIsConnected(true);
            Alert.alert('Success', result.message);
          } else {
            Alert.alert('Error', result.message);
          }
        } catch (error) {
          console.error('[CalendarConnection] Deep link error:', error);
          Alert.alert('Error', 'Failed to connect calendar: ' + error.message);
        } finally {
          setIsConnecting(false);
        }
      }
    };

    // Listen for incoming links
    const linkingListener = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check for initial URL (if app was opened via deep link)
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      linkingListener?.remove();
    };
  }, []);

  // Handle connect/disconnect calendar
  const handleCalendarAction = async () => {
    if (isConnected) {
      // Disconnect calendar
      Alert.alert(
        'Disconnect Calendar',
        'Are you sure you want to disconnect your Google Calendar? Future appointments will not be automatically added to your calendar.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              try {
                await calendarService.clearTokens();
                setIsConnected(false);
                Alert.alert('Success', 'Calendar disconnected successfully');
              } catch (error) {
                Alert.alert('Error', 'Failed to disconnect calendar');
              }
            }
          }
        ]
      );
      return;
    }

    // Connect calendar
    try {
      setIsConnecting(true);
      
      Alert.alert(
        'Connect Google Calendar',
        'You will be redirected to Google to authorize calendar access. After authorization, you will be redirected back to the app.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async () => {
              try {
                await calendarService.initializeGoogleCalendar();
                // Note: The actual connection will be handled by the deep link listener
              } catch (error) {
                console.error('[CalendarConnection] Connection error:', error);
                Alert.alert('Error', 'Failed to start calendar authorization: ' + error.message);
                setIsConnecting(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('[CalendarConnection] Error:', error);
      Alert.alert('Error', 'Failed to connect calendar: ' + error.message);
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Checking calendar connection...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          isConnected ? styles.connectedButton : styles.disconnectedButton,
          isConnecting && styles.connectingButton
        ]}
        onPress={handleCalendarAction}
        disabled={isConnecting}
      >
        <View style={styles.buttonContent}>
          {isConnecting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : Ionicons ? (
            <Ionicons
              name={isConnected ? "calendar" : "calendar-outline"}
              size={20}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
          ) : (
            <Text style={styles.iconFallback}>📅</Text>
          )}
          <Text style={styles.buttonText}>
            {isConnecting
              ? 'Connecting...'
              : isConnected
              ? 'Calendar Connected'
              : 'Connect Calendar'
            }
          </Text>
          {isConnected && !isConnecting && (
            Ionicons ? (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#FFFFFF"
                style={styles.checkIcon}
              />
            ) : (
              <Text style={styles.iconFallback}>✅</Text>
            )
          )}
        </View>
      </TouchableOpacity>

      {isConnected && (
        <View style={styles.statusContainer}>
          {Ionicons ? (
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          ) : (
            <Text style={styles.statusIconFallback}>✅</Text>
          )}
          <Text style={styles.statusText}>
            Appointments will be automatically added to your Google Calendar
          </Text>
        </View>
      )}

      {!isConnected && (
        <Text style={styles.infoText}>
          Connect your Google Calendar to automatically sync your appointments
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  connectedButton: {
    backgroundColor: '#10B981',
  },
  disconnectedButton: {
    backgroundColor: '#007AFF',
  },
  connectingButton: {
    backgroundColor: '#6B7280',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
  iconFallback: {
    fontSize: 16,
    marginRight: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusIconFallback: {
    fontSize: 12,
    marginRight: 6,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#059669',
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 16,
  },
});

export default CalendarConnection;