import React, {useState} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';

export default function AuthScreen({navigation}) {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (!mobile || mobile.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/request-otp', { mobileNumber: mobile });
      setOtpSent(true);
      // Clear OTP input when resending
      setOtp('');
      // Show alert when OTP is sent
      Alert.alert('OTP Sent', 'OTP has been sent to your mobile number');
    } catch (e) {
      Alert.alert('Error', 'Error requesting OTP. ' + (e.response?.data?.error || e.message));
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }

    setLoading(true);
    try {
      // First try to verify OTP for existing user (login)
      const body = { mobileNumber: mobile, otpCode: otp };
      const res = await api.post('/api/auth/verify-otp', body);
      const data = res.data;
      
      if (data.token || data.accessToken) {
        // User exists, login successful
        const token = data.token || data.accessToken;
        await SecureStore.setItemAsync('accessToken', token);
        await SecureStore.setItemAsync('role', data.role);
        await SecureStore.setItemAsync('userId', String(data.id));
        await SecureStore.setItemAsync('fullName', data.fullName || '');
        
        api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        
        if (data.role === 'DOCTOR') {
          navigation.reset({ 
            index: 0, 
            routes: [{ 
              name: 'DoctorHome', 
              params: { userId: data.id } 
            }] 
          });
        } else {
          navigation.reset({ 
            index: 0, 
            routes: [{ 
              name: 'UserHome', 
              params: { userId: data.id } 
            }] 
          });
        }
      }
    } catch (e) {
      // If user doesn't exist, navigate to role selection for registration
      if (e.response?.status === 400 || 
          e.response?.data?.error?.includes('not found') ||
          e.response?.data?.error?.includes('User not found')) {
        navigation.navigate('RoleSelection', { mobile, otp });
      } else {
        Alert.alert('Error', 'Verification failed: ' + (e.response?.data?.error || e.message));
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Hi 👋</Text>
          <Text style={styles.subtitle}>
            {!otpSent ? 'Enter mobile to login / register' : 'Enter the OTP sent to your mobile'}
          </Text>
        </View>

        <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput 
            style={[styles.input, otpSent && styles.disabledInput]} 
            keyboardType="phone-pad" 
            placeholder="Enter mobile number" 
            value={mobile} 
            onChangeText={setMobile}
            editable={!otpSent}
            maxLength={10}
          />
          {otpSent && (
            <View style={styles.successMessage}>
              <Text style={styles.successText}>✓ OTP sent to your mobile number</Text>
              <TouchableOpacity 
                style={styles.resendButton} 
                onPress={requestOtp}
                disabled={loading}
              >
                <Text style={styles.resendText}>
                  {loading ? 'Sending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!otpSent ? (
          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.disabledButton]} 
            onPress={requestOtp}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Sending...' : 'Request OTP'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>OTP</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="number-pad" 
                placeholder="Enter OTP" 
                value={otp} 
                onChangeText={setOtp}
                maxLength={6}
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, (!otp || loading) && styles.disabledButton]} 
              onPress={verifyOtp}
              disabled={!otp || loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => {
                setOtpSent(false);
                setOtp('');
              }}
            >
              <Text style={styles.secondaryButtonText}>Change Mobile Number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    color: '#7f8c8d',
  },
  primaryButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    padding: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successText: {
    color: '#27ae60',
    fontSize: 14,
    fontWeight: '500',
  },
  resendButton: {
    padding: 4,
  },
  resendText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
