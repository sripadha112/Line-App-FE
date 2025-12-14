import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/apiConfig';
import * as SecureStore from 'expo-secure-store';

export default function UserRegistrationScreen({ navigation, route }) {
  const { mobile, otp } = route.params || {};
  
  // Add error handling for missing parameters using useEffect
  useEffect(() => {
    if (!mobile) {
      navigation.replace('Auth');
    }
  }, [mobile, navigation]);

  // Early return if mobile is missing (prevents rendering until navigation completes)
  if (!mobile) {
    return null;
  }

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: mobile,
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'address', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const body = {
        mobileNumber: String(mobile).trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      };
      
      console.log('🔄 Registering user with data:', body);
      const res = await api.post(API_ENDPOINTS.REGISTRATION.USER, body);
      const data = res.data;
      
      console.log('✅ User registration successful:', data);
      
      // Store user info for future use including token and mobile
      const token = data.token || data.accessToken;
      if (token) {
        await SecureStore.setItemAsync('accessToken', token);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
      }
      await SecureStore.setItemAsync('userId', String(data.userId || data.id));
      await SecureStore.setItemAsync('fullName', formData.fullName);
      await SecureStore.setItemAsync('role', 'USER');
      await SecureStore.setItemAsync('mobile', mobile);
      
      Alert.alert(
        'Registration Successful!', 
        'Your account has been created successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to login or home
              navigation.reset({ 
                index: 0, 
                routes: [{ 
                  name: 'UserHome', 
                  params: { userId: data.userId || data.id } 
                }] 
              });
            }
          }
        ]
      );
    } catch (e) {
      console.error('❌ User registration failed:', e);
      Alert.alert('Registration Failed', e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.header}>
        <Text style={styles.title}>User Registration</Text>
        <Text style={styles.subtitle}>Complete your profile to get started</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={formData.fullName}
            onChangeText={(value) => handleInputChange('fullName', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.mobileNumber}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter your complete address"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your city"
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your state"
            value={formData.state}
            onChangeText={(value) => handleInputChange('state', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pincode *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter pincode"
            value={formData.pincode}
            onChangeText={(value) => handleInputChange('pincode', value)}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        <TouchableOpacity 
          style={[styles.registerButton, loading && styles.disabledButton]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>
            {loading ? 'Registering...' : 'Complete Registration'}
          </Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  registerButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
