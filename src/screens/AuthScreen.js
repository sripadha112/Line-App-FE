// import React, {useState} from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
// import api from '../services/api';
// import SecureStore from '../utils/secureStorage';
// import { API_ENDPOINTS } from '../config/apiConfig';
// import UserNotificationService from '../services/userNotificationService';
// import { showAlert } from '../utils/alertUtils';

// export default function AuthScreen({navigation}) {
//   // const [mobile, setMobile] = useState('');
//   // const [otp, setOtp] = useState('');
//   // const [otpSent, setOtpSent] = useState(false);
//   // const [loading, setLoading] = useState(false);

//   // const requestOtp = async () => {
//   //   if (!mobile || mobile.length < 10) {
//   //     Alert.alert('Error', 'Please enter a valid mobile number');
//   //     return;
//   //   }

//   //   setLoading(true);
//   //   try {
//   //     await api.post('/api/auth/request-otp', { mobileNumber: mobile });
//   //     setOtpSent(true);
//   //     // Clear OTP input when resending
//   //     setOtp('');
//   //     // Show alert when OTP is sent
//   //     Alert.alert('OTP Sent', 'OTP has been sent to your mobile number');
//   //   } catch (e) {
//   //     Alert.alert('Error', 'Error requesting OTP. ' + (e.response?.data?.error || e.message));
//   //   }
//   //   setLoading(false);
//   // };

//   // const verifyOtp = async () => {
//   //   if (!otp || otp.length < 4) {
//   //     Alert.alert('Error', 'Please enter a valid OTP');
//   //     return;
//   //   }

//   //   setLoading(true);
//   //   try {
//   //     // First try to verify OTP for existing user (login)
//   //     const body = { mobileNumber: mobile, otpCode: otp };
//   //     const res = await api.post('/api/auth/verify-otp', body);
//   //     const data = res.data;
      
//   //     if (data.token || data.accessToken) {
//   //       // User exists, login successful
//   //       const token = data.token || data.accessToken;
//   //       await SecureStore.setItemAsync('accessToken', token);
//   //       await SecureStore.setItemAsync('role', data.role);
//   //       await SecureStore.setItemAsync('userId', String(data.id));
//   //       await SecureStore.setItemAsync('fullName', data.fullName || '');
        
//   //       api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        
//   //       if (data.role === 'DOCTOR') {
//   //         navigation.reset({ 
//   //           index: 0, 
//   //           routes: [{ 
//   //             name: 'DoctorHome', 
//   //             params: { userId: data.id } 
//   //           }] 
//   //         });
//   //       } else {
//   //         navigation.reset({ 
//   //           index: 0, 
//   //           routes: [{ 
//   //             name: 'UserHome', 
//   //             params: { userId: data.id } 
//   //           }] 
//   //         });
//   //       }
//   //     }
//   //   } catch (e) {
//   //     // If user doesn't exist, navigate to role selection for registration
//   //     if (e.response?.status === 400 || 
//   //         e.response?.data?.error?.includes('not found') ||
//   //         e.response?.data?.error?.includes('User not found')) {
//   //       navigation.navigate('RoleSelection', { mobile, otp });
//   //     } else {
//   //       Alert.alert('Error', 'Verification failed: ' + (e.response?.data?.error || e.message));
//   //     }
//   //   }
//   //   setLoading(false);
//   // };

//   // return (
//   //   <KeyboardAvoidingView 
//   //     style={styles.container} 
//   //     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//   //     keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
//   //   >
//   //     <ScrollView 
//   //       contentContainerStyle={styles.scrollContainer}
//   //       showsVerticalScrollIndicator={false}
//   //       keyboardShouldPersistTaps="handled"
//   //     >
//   //       <View style={styles.header}>
//   //         <Text style={styles.title}>Hi 👋</Text>
//   //         <Text style={styles.subtitle}>
//   //           {!otpSent ? 'Enter mobile to login / register' : 'Enter the OTP sent to your mobile'}
//   //         </Text>
//   //       </View>

//   //       <View style={styles.form}>
//   //       <View style={styles.inputGroup}>
//   //         <Text style={styles.label}>Mobile Number</Text>
//   //         <TextInput 
//   //           style={[styles.input, otpSent && styles.disabledInput]} 
//   //           keyboardType="phone-pad" 
//   //           placeholder="Enter mobile number" 
//   //           value={mobile} 
//   //           onChangeText={setMobile}
//   //           editable={!otpSent}
//   //           maxLength={10}
//   //         />
//   //         {otpSent && (
//   //           <View style={styles.successMessage}>
//   //             <Text style={styles.successText}>✓ OTP sent to your mobile number</Text>
//   //             <TouchableOpacity 
//   //               style={styles.resendButton} 
//   //               onPress={requestOtp}
//   //               disabled={loading}
//   //             >
//   //               <Text style={styles.resendText}>
//   //                 {loading ? 'Sending...' : 'Resend OTP'}
//   //               </Text>
//   //             </TouchableOpacity>
//   //           </View>
//   //         )}
//   //       </View>

//   //       {!otpSent ? (
//   //         <TouchableOpacity 
//   //           style={[styles.primaryButton, loading && styles.disabledButton]} 
//   //           onPress={requestOtp}
//   //           disabled={loading}
//   //         >
//   //           <Text style={styles.primaryButtonText}>
//   //             {loading ? 'Sending...' : 'Request OTP'}
//   //           </Text>
//   //         </TouchableOpacity>
//   //       ) : (
//   //         <>
//   //           <View style={styles.inputGroup}>
//   //             <Text style={styles.label}>OTP</Text>
//   //             <TextInput 
//   //               style={styles.input} 
//   //               keyboardType="number-pad" 
//   //               placeholder="Enter OTP" 
//   //               value={otp} 
//   //               onChangeText={setOtp}
//   //               maxLength={6}
//   //             />
//   //           </View>

//   //           <TouchableOpacity 
//   //             style={[styles.primaryButton, (!otp || loading) && styles.disabledButton]} 
//   //             onPress={verifyOtp}
//   //             disabled={!otp || loading}
//   //           >
//   //             <Text style={styles.primaryButtonText}>
//   //               {loading ? 'Verifying...' : 'Verify OTP'}
//   //             </Text>
//   //           </TouchableOpacity>

//   //           <TouchableOpacity 
//   //             style={styles.secondaryButton} 
//   //             onPress={() => {
//   //               setOtpSent(false);
//   //               setOtp('');
//   //             }}
//   //           >
//   //             <Text style={styles.secondaryButtonText}>Change Mobile Number</Text>
//   //           </TouchableOpacity>
//   //         </>
//   //       )}
//   //     </View>
//   //     </ScrollView>
//   //   </KeyboardAvoidingView>
//   // );

//   // NEW MVP CODE - DIRECT MOBILE VERIFICATION
  
//   // State for new MVP functionality
//   const [mobile, setMobile] = useState('');
//   const [loading, setLoading] = useState(false);

//   // Mobile number validation function
//   const validateMobileNumber = (number) => {
//     // Remove any non-numeric characters for validation
//     const cleanNumber = number.replace(/\D/g, '');
    
//     // Check if it's exactly 10 digits
//     if (cleanNumber.length !== 10) {
//       return { isValid: false, message: 'Mobile number must be exactly 10 digits' };
//     }
    
//     // Check if it starts with 6, 7, 8, or 9
//     const firstDigit = cleanNumber[0];
//     if (!['6', '7', '8', '9'].includes(firstDigit)) {
//       return { isValid: false, message: 'Please enter a valid Mobile Number' };
//     }
    
//     return { isValid: true, message: '' };
//   };

//   // Direct mobile verification (bypassing OTP for MVP)
//   const verifyMobile = async () => {
//     // Validate mobile number
//     const validation = validateMobileNumber(mobile);
//     if (!validation.isValid) {
//       showAlert('Error', validation.message);
//       return;
//     }

//     setLoading(true);
//     try {
//       // Call direct mobile verification API using api service
//       console.log('📤 Calling verify-mobile API with mobile:', mobile);
//       console.log('📤 API Endpoint:', API_ENDPOINTS.AUTH.VERIFY_MOBILE);
      
//       // Use fetch to send raw mobile number (not JSON stringified)
//       const response = await fetch(`${api.defaults.baseURL}${API_ENDPOINTS.AUTH.VERIFY_MOBILE}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': '*/*'
//         },
//         body: mobile // Send as raw string: 9652752837 (not "9652752837")
//       });
      
//       console.log('📥 Response status:', response.status);
//       console.log('📥 Response headers:', response.headers);
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         console.log('❌ Error response body:', errorText);
//         throw new Error(`HTTP ${response.status}: ${errorText}`);
//       }
      
//       const data = await response.json();
//       console.log('📥 API Response data:', data);
      
//       if (data.status === 'USER_EXISTS') {
//         // User exists but no token - need to complete registration
//         navigation.navigate('RoleSelection', { mobile });
//       } else if (data.token || data.accessToken) {
//         // User exists with token, login successful
//         const token = data.token || data.accessToken;
//         await SecureStore.setItemAsync('accessToken', token);
//         await SecureStore.setItemAsync('role', data.role);
//         await SecureStore.setItemAsync('userId', String(data.id));
//         await SecureStore.setItemAsync('fullName', data.fullName || '');
//         await SecureStore.setItemAsync('mobile', mobile);
        
//         api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        
//         // Register FCM token for push notifications after successful login (only for users)
//         if (data.role === 'USER') {
//           console.log('🔔 Registering FCM token after user login...');
//           try {
//             const fcmResult = await UserNotificationService.forceRegisterFcmToken();
//             console.log('📱 FCM registration result:', fcmResult);
//           } catch (fcmError) {
//             console.warn('⚠️ FCM registration warning (non-blocking):', fcmError);
//             // Don't fail login if FCM fails
//           }
//         }
        
//         if (data.role === 'DOCTOR') {
//           navigation.reset({ 
//             index: 0, 
//             routes: [{ 
//               name: 'DoctorHome', 
//               params: { userId: data.id } 
//             }] 
//           });
//         } else {
//           navigation.reset({ 
//             index: 0, 
//             routes: [{ 
//               name: 'UserHome', 
//               params: { userId: data.id } 
//             }] 
//           });
//         }
//       }
//     } catch (e) {
//       // Handle API errors - similar to original OTP verification
//       console.log('❌ Verification error:', e);
      
//       // Parse the error message to check for user not found
//       const errorMessage = e.message || '';
//       const isUserNotFound = errorMessage.includes('User not found') || 
//                             errorMessage.includes('Please register first') ||
//                             errorMessage.includes('not found');
      
//       // Check if it's a parsed response with status
//       if (e.response?.data?.status === 'NOT_FOUND' || isUserNotFound) {
//         // User doesn't exist, navigate to role selection for registration
//         console.log('🔄 User not found, navigating to registration...');
//         navigation.navigate('RoleSelection', { mobile });
//       } else if (e.response?.status === 400 || 
//           e.response?.data?.error?.includes('not found') ||
//           e.response?.data?.error?.includes('User not found')) {
//         // User doesn't exist, navigate to role selection for registration
//         console.log('🔄 User not found (400 error), navigating to registration...');
//         navigation.navigate('RoleSelection', { mobile });
//       } else {
//         // Other errors (network, server, etc.)
//         const displayMessage = e.response?.data?.error || e.message || 'Unknown error';
//         showAlert('Error', 'Verification failed: ' + displayMessage);
//       }
//     }
//     setLoading(false);
//   };

//   // NEW MVP UI
//   return (
//     <KeyboardAvoidingView 
//       style={styles.container} 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
//     >
//       <ScrollView 
//         contentContainerStyle={styles.scrollContainer}
//         showsVerticalScrollIndicator={false}
//         keyboardShouldPersistTaps="handled"
//       >
//         <View style={styles.header}>
//           <Text style={styles.title}>Hi 👋</Text>
//           <Text style={styles.subtitle}>
//             Enter your mobile number to <Text style={styles.boldText}>LOGIN / REGISTER</Text>
//           </Text>
//         </View>

//         <View style={styles.form}>
//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Mobile Number</Text>
//             <TextInput 
//               style={styles.input} 
//               keyboardType="phone-pad" 
//               placeholder="Enter 10-digit mobile number" 
//               value={mobile} 
//               onChangeText={(text) => {
//                 // Only allow numeric input
//                 const numericText = text.replace(/[^0-9]/g, '');
//                 setMobile(numericText);
//               }}
//               maxLength={10}
//             />
//             {mobile.length > 0 && (
//               <View style={styles.validationContainer}>
//                 {validateMobileNumber(mobile).isValid ? (
//                   <Text style={styles.successText}>✓ Valid mobile number</Text>
//                 ) : (
//                   <Text style={styles.errorText}>⚠ {validateMobileNumber(mobile).message}</Text>
//                 )}
//               </View>
//             )}
//           </View>

//           <TouchableOpacity 
//             style={[
//               styles.primaryButton, 
//               (!validateMobileNumber(mobile).isValid || loading) && styles.disabledButton
//             ]} 
//             onPress={verifyMobile}
//             disabled={!validateMobileNumber(mobile).isValid || loading}
//           >
//             <Text style={styles.primaryButtonText}>
//               {loading ? 'Verifying...' : 'Verify Mobile Number'}
//             </Text>
//           </TouchableOpacity>
          
//           {/* MVP Notice */}
//           {/* <View style={styles.mvpNotice}>
//             <Text style={styles.mvpNoticeText}>
//               🚀 MVP Mode: Direct mobile verification (OTP temporarily disabled)
//             </Text>
//           </View> */}
//         </View>

//         {/* App Download Section - Only on Web */}
//         {/* {Platform.OS === 'web' && (
//           <View style={styles.appPromotionSection}>
//             <View style={styles.appPromotionCard}>
//               <Text style={styles.appPromotionIcon}>📱</Text>
//               <Text style={styles.appPromotionTitle}>For Better Experience, Download Our Mobile App!</Text>
//               <Text style={styles.appPromotionDescription}>
//                 Get the full kedulz experience with our mobile app:
//               </Text>
              
//               <View style={styles.featuresList}>
//                 <View style={styles.featureItem}>
//                   <Text style={styles.featureBullet}>✓</Text>
//                   <Text style={styles.featureText}>Book appointments instantly</Text>
//                 </View>
//                 <View style={styles.featureItem}>
//                   <Text style={styles.featureBullet}>✓</Text>
//                   <Text style={styles.featureText}>Real-time notifications & reminders</Text>
//                 </View>
//                 <View style={styles.featureItem}>
//                   <Text style={styles.featureBullet}>✓</Text>
//                   <Text style={styles.featureText}>Manage family appointments</Text>
//                 </View>
//                 <View style={styles.featureItem}>
//                   <Text style={styles.featureBullet}>✓</Text>
//                   <Text style={styles.featureText}>Access digital prescriptions</Text>
//                 </View>
//                 <View style={styles.featureItem}>
//                   <Text style={styles.featureBullet}>✓</Text>
//                   <Text style={styles.featureText}>QR code quick check-in</Text>
//                 </View>
//               </View>

//               <TouchableOpacity 
//                 style={styles.downloadButton}
//                 onPress={() => {
//                   if (Platform.OS === 'web') {
//                     window.open('https://kedulz.com', '_blank');
//                   }
//                 }}
//               >
//                 <Text style={styles.downloadButtonText}>📲 Download kedulz</Text>
//               </TouchableOpacity>
              
//               <Text style={styles.appPromotionNote}>Available on Android & iOS</Text>
//             </View>
//           </View>
//         )} */}
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     padding: 20,
//   },
//   header: {
//     alignItems: 'center',
//     marginBottom: 40,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: '800',
//     color: '#2c3e50',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#7f8c8d',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   form: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 24,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 8,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 12,
//     padding: 16,
//     fontSize: 16,
//     backgroundColor: '#fff',
//   },
//   disabledInput: {
//     backgroundColor: '#f8f9fa',
//     color: '#7f8c8d',
//   },
//   primaryButton: {
//     backgroundColor: '#3498db',
//     borderRadius: 12,
//     padding: 18,
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   disabledButton: {
//     backgroundColor: '#bdc3c7',
//   },
//   primaryButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   secondaryButton: {
//     padding: 12,
//     alignItems: 'center',
//   },
//   secondaryButtonText: {
//     color: '#3498db',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   successMessage: {
//     marginTop: 8,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   successText: {
//     color: '#27ae60',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   resendButton: {
//     padding: 4,
//   },
//   resendText: {
//     color: '#3498db',
//     fontSize: 14,
//     fontWeight: '600',
//     textDecorationLine: 'underline',
//   },
//   // NEW STYLES FOR MVP
//   validationContainer: {
//     marginTop: 8,
//   },
//   errorText: {
//     color: '#e74c3c',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   mvpNotice: {
//     backgroundColor: '#fff3cd',
//     borderRadius: 8,
//     padding: 12,
//     marginTop: 16,
//     borderWidth: 1,
//     borderColor: '#ffeaa7',
//   },
//   mvpNoticeText: {
//     color: '#856404',
//     fontSize: 12,
//     textAlign: 'center',
//     fontWeight: '500',
//   },
//   // App Promotion Section - Web Only
//   appPromotionSection: {
//     marginTop: 32,
//     marginBottom: 20,
//   },
//   appPromotionCard: {
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     padding: 24,
//     alignItems: 'center',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     borderWidth: 2,
//     borderColor: '#3498db',
//   },
//   appPromotionIcon: {
//     fontSize: 48,
//     marginBottom: 12,
//   },
//   appPromotionTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#2c3e50',
//     textAlign: 'center',
//     marginBottom: 12,
//     lineHeight: 28,
//   },
//   appPromotionDescription: {
//     fontSize: 15,
//     color: '#7f8c8d',
//     textAlign: 'center',
//     marginBottom: 20,
//     lineHeight: 22,
//   },
//   featuresList: {
//     width: '100%',
//     marginBottom: 24,
//   },
//   featureItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     paddingLeft: 8,
//   },
//   featureBullet: {
//     fontSize: 16,
//     color: '#27ae60',
//     fontWeight: '700',
//     marginRight: 12,
//     width: 20,
//   },
//   featureText: {
//     fontSize: 15,
//     color: '#2c3e50',
//     flex: 1,
//     lineHeight: 22,
//   },
//   downloadButton: {
//     backgroundColor: '#27ae60',
//     borderRadius: 12,
//     padding: 16,
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: 12,
//     shadowColor: '#27ae60',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   downloadButtonText: {
//     color: '#ffffff',
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   appPromotionNote: {
//     fontSize: 13,
//     color: '#95a5a6',
//     fontStyle: 'italic',
//   },
// });

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Easing
} from 'react-native';
import api from '../services/api';
import SecureStore from '../utils/secureStorage';
import { API_ENDPOINTS } from '../config/apiConfig';
import UserNotificationService from '../services/userNotificationService';
import { showAlert } from '../utils/alertUtils';
import { encryptQueryId, encryptQueryValue } from '../utils/queryParamCrypto';

// ── Step constants ────────────────────────────────────────────────────────
const STEP_MOBILE = 'mobile';
const STEP_LOGIN_PIN = 'login_pin';
const STEP_SET_PIN = 'set_pin';
const STEP_CREATE_PIN = 'create_pin';

// ── Design tokens ────────────────────────────────────────────────────────
const COLORS = {
  primary: '#2563eb',      // Modern blue
  primaryDark: '#1e40af',  // Darker blue for hover
  success: '#10b981',      // Green
  error: '#ef4444',        // Red
  warning: '#f59e0b',      // Amber
  bg: '#f9fafb',           // Light gray
  bgCard: '#ffffff',       // White
  text: '#111827',         // Dark gray/black
  textSecondary: '#6b7280', // Gray
  border: '#e5e7eb',       // Light border
  disabled: '#d1d5db',     // Disabled gray
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export default function AuthScreen({ navigation }) {
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(STEP_MOBILE);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  // ── Trigger fade animation when step changes ──
  React.useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [step, fadeAnim]);

  // ── Validation ────────────────────────────────────────────────────────
  const validateMobileNumber = (number) => {
    const clean = number.replace(/\D/g, '');
    if (clean.length !== 10)
      return { isValid: false, message: 'Mobile number must be 10 digits' };
    if (!['6', '7', '8', '9'].includes(clean[0]))
      return { isValid: false, message: 'Enter a valid Indian mobile number' };
    return { isValid: true, message: '' };
  };

  const validatePin = (value) => /^[0-9]{4,6}$/.test(value);

  const validatePinMatch = (pin1, pin2) => pin1 === pin2 && pin1.length > 0;

  // ── STEP 1: Check if mobile is registered ───────────────────────────────
  const checkMobile = async () => {
    const validation = validateMobileNumber(mobile);

    if (!validation.isValid) {
      showAlert('Invalid Mobile', validation.message);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post(
        API_ENDPOINTS.AUTH.CHECK_MOBILE,
        { mobileNumber: mobile }
      );

      const { mobileExists, pinExists, userId } = res.data;

      if (!mobileExists) {
        // New user → Set PIN before registration
        setStep(STEP_SET_PIN);
      } else if (pinExists) {
        // Existing user with PIN → Login
        setStep(STEP_LOGIN_PIN);
      } else {
        // Existing user without PIN → Create PIN
        setUserId(userId);
        setStep(STEP_CREATE_PIN);
      }
    } catch (e) {
      showAlert(
        'Error',
        'Unable to verify mobile: ' + (e.response?.data?.error || e.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2a: Existing user → Login with PIN ─────────────────────────────
  const loginWithPin = async () => {
    if (!validatePin(pin)) {
      showAlert('Invalid PIN', 'Enter a 4-6 digit PIN');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        mobileNumber: mobile,
        pin,
      });
      await handleAuthSuccess(res.data);
    } catch (e) {
      if (e.response?.status === 401) {
        showAlert('Incorrect PIN', 'Please try again.');
        setPin('');
      } else if (e.response?.status === 404) {
        showAlert('Account Not Found', 'Please register again.');
        resetFlow();
      } else if (e.response?.status === 428 || e.response?.data?.status === 'PIN_NOT_SET') {
        setUserId(e.response?.data?.userId);
        setStep(STEP_CREATE_PIN);
        setPin('');
        setConfirmPin('');
      } else {
        showAlert('Login Failed', e.response?.data?.error || 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2b: Create PIN for existing user (no PIN yet) ────────────────────
  const createPinForExistingUser = async () => {
    if (!validatePin(pin)) {
      showAlert('Invalid PIN', 'PIN must be 4-6 digits');
      return;
    }

    if (!validatePinMatch(pin, confirmPin)) {
      showAlert('PIN Mismatch', 'PINs do not match');
      return;
    }

    if (!userId) {
      showAlert('Error', 'User ID missing');
      return;
    }

    setLoading(true);

    try {
      // Encrypt sensitive parameters
      const encryptedPin = encryptQueryValue(pin);
      const encryptedId = encryptQueryId(userId);

      if (!encryptedPin || !encryptedId) {
        showAlert('Error', 'Failed to encrypt parameters');
        setLoading(false);
        return;
      }

      // Make API call with encrypted parameters
      await api.put(
        `${API_ENDPOINTS.AUTH.SET_PIN}?pin=${encodeURIComponent(encryptedPin)}&id=${encodeURIComponent(encryptedId)}`
      );

      showAlert('Success', 'PIN created. Please log in.');
      setPin('');
      setConfirmPin('');
      setStep(STEP_LOGIN_PIN);
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.message || 'Failed to create PIN';
      showAlert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2c: Set PIN for new user (before registration) ──────────────────
  const proceedToRegistration = () => {
    if (!validatePin(pin)) {
      showAlert('Invalid PIN', 'PIN must be 4-6 digits');
      return;
    }

    if (!validatePinMatch(pin, confirmPin)) {
      showAlert('PIN Mismatch', 'PINs do not match');
      return;
    }

    navigation.navigate('RoleSelection', { mobile, pin });
  };

  // ── Shared success handler ────────────────────────────────────────────────
  const handleAuthSuccess = async (data) => {
    const token = data.accessToken || data.token;
    await SecureStore.setItemAsync('accessToken', token);
    await SecureStore.setItemAsync('role', data.role);
    await SecureStore.setItemAsync('userId', String(data.id));
    await SecureStore.setItemAsync('fullName', data.fullName || '');
    await SecureStore.setItemAsync('mobile', data.mobileNumber || mobile);

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Register FCM token
    if (data.role === 'USER') {
      try {
        const fcmResult = await UserNotificationService.forceRegisterFcmToken();
        console.log('📱 FCM registered:', fcmResult);
      } catch (fcmError) {
        console.warn('⚠️ FCM warning (non-blocking):', fcmError);
      }
    }

    // Navigate based on profile completion
    if (!data.fullName || data.fullName === 'Pending') {
      navigation.navigate('RoleSelection', {
        mobile: data.mobileNumber || mobile,
        userId: data.id,
      });
      return;
    }

    if (data.role === 'DOCTOR') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'DoctorHome', params: { userId: data.id } }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserHome', params: { userId: data.id } }],
      });
    }
  };

  // ── Reset to mobile entry ────────────────────────────────────────────────
  const resetFlow = () => {
    setStep(STEP_MOBILE);
    setPin('');
    setConfirmPin('');
    setUserId(null);
  };

  // ── UI: Header ──────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.emoji}>👋</Text>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>
        {step === STEP_MOBILE && 'Enter your mobile number to login or register'}
        {step === STEP_LOGIN_PIN && 'Enter your PIN to continue'}
        {step === STEP_SET_PIN && 'Create a secure PIN for your new account'}
        {step === STEP_CREATE_PIN && 'Set up your PIN to complete registration'}
      </Text>
    </View>
  );

  // ── UI: Mobile Input ────────────────────────────────────────────────────
  const renderMobileInput = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Mobile Number</Text>
      <View style={styles.phoneRow}>
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
        </View>
        <TextInput
          style={[
            styles.input,
            styles.phoneInput,
            step !== STEP_MOBILE && styles.disabledInput,
          ]}
          keyboardType="phone-pad"
          placeholder="10-digit number"
          value={mobile}
          onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ''))}
          maxLength={10}
          editable={step === STEP_MOBILE}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>
      {mobile.length > 0 && step === STEP_MOBILE && (
        <View style={styles.validationContainer}>
          {validateMobileNumber(mobile).isValid ? (
            <View style={styles.validRow}>
              <Text style={styles.validIcon}>✓</Text>
              <Text style={styles.successText}>Valid number</Text>
            </View>
          ) : (
            <View style={styles.validRow}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{validateMobileNumber(mobile).message}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  // ── UI: PIN Input ──────────────────────────────────────────────────────
  const renderPinInputs = ({ showConfirm = false }) => (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>PIN</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="4–6 digits"
          value={pin}
          onChangeText={(text) => setPin(text.replace(/[^0-9]/g, ''))}
          maxLength={6}
          secureTextEntry
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      {showConfirm && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm PIN</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Re-enter PIN"
            value={confirmPin}
            onChangeText={(text) => setConfirmPin(text.replace(/[^0-9]/g, ''))}
            maxLength={6}
            secureTextEntry
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
      )}

      {showConfirm && confirmPin.length > 0 && (
        <View style={styles.validationContainer}>
          {validatePinMatch(pin, confirmPin) ? (
            <View style={styles.validRow}>
              <Text style={styles.validIcon}>✓</Text>
              <Text style={styles.successText}>PINs match</Text>
            </View>
          ) : (
            <View style={styles.validRow}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>PINs do not match</Text>
            </View>
          )}
        </View>
      )}
    </>
  );

  // ── UI: Button ──────────────────────────────────────────────────────────
  const renderButton = ({
    onPress,
    text,
    disabled = false,
    variant = 'primary',
  }) => (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button_${variant}`],
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? COLORS.primary : '#fff'} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            styles[`buttonText_${variant}`],
          ]}
        >
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );

  // ── Main Render ─────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderHeader()}

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim },
          ]}
        >
          {/* STEP: Mobile Entry */}
          {step === STEP_MOBILE && (
            <>
              {renderMobileInput()}
              {renderButton({
                onPress: checkMobile,
                text: 'Continue',
                disabled: !validateMobileNumber(mobile).isValid,
              })}
            </>
          )}

          {/* STEP: Login with PIN (Existing User) */}
          {step === STEP_LOGIN_PIN && (
            <>
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>🔐</Text>
                <Text style={styles.infoText}>
                  Enter the PIN you created during registration
                </Text>
              </View>

              {renderPinInputs({ showConfirm: false })}

              {renderButton({
                onPress: loginWithPin,
                text: 'Login',
                disabled: !validatePin(pin),
              })}

              {renderButton({
                onPress: resetFlow,
                text: 'Use Different Number',
                variant: 'secondary',
              })}
            </>
          )}

          {/* STEP: Set PIN (New User) */}
          {step === STEP_SET_PIN && (
            <>
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>✨</Text>
                <Text style={styles.infoText}>
                  Create a PIN you'll use every time you log in
                </Text>
              </View>

              {renderPinInputs({ showConfirm: true })}

              {renderButton({
                onPress: proceedToRegistration,
                text: 'Proceed to Registration',
                disabled: !validatePin(pin) || !validatePinMatch(pin, confirmPin),
              })}

              {renderButton({
                onPress: resetFlow,
                text: 'Use Different Number',
                variant: 'secondary',
              })}
            </>
          )}

          {/* STEP: Create PIN (Existing User Without PIN) */}
          {step === STEP_CREATE_PIN && (
            <>
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>🔑</Text>
                <Text style={styles.infoText}>
                  Your account exists but needs a PIN for security
                </Text>
              </View>

              {renderPinInputs({ showConfirm: true })}

              {renderButton({
                onPress: createPinForExistingUser,
                text: 'Create PIN',
                disabled: !validatePin(pin) || !validatePinMatch(pin, confirmPin),
              })}

              {renderButton({
                onPress: resetFlow,
                text: 'Use Different Number',
                variant: 'secondary',
              })}
            </>
          )}
        </Animated.View>

        {/* Security Footer */}
        <View style={styles.footer}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Your PIN is encrypted and never shared. All communication is secured with HTTPS.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ── Containers ──────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    paddingBottom: SPACING.xxl,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  // ── Card ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    marginBottom: SPACING.xxl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // ── Input Groups ────────────────────────────────────────────────────────
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 16,
    backgroundColor: COLORS.bgCard,
    color: COLORS.text,
    fontWeight: '500',
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  countryCode: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#f3f4f6',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: COLORS.textSecondary,
  },

  // ── Validation ──────────────────────────────────────────────────────────
  validationContainer: {
    marginTop: SPACING.sm,
  },
  validRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  validIcon: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  errorIcon: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  successText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Info Box ────────────────────────────────────────────────────────────
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  infoIcon: {
    fontSize: 20,
    marginTop: SPACING.xs,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
    fontWeight: '500',
  },

  // ── Buttons ─────────────────────────────────────────────────────────────
  button: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    minHeight: 48,
  },
  button_primary: {
    backgroundColor: COLORS.primary,
  },
  button_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
    borderColor: COLORS.disabled,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonText_primary: {
    color: '#fff',
  },
  buttonText_secondary: {
    color: COLORS.primary,
  },

  // ── Footer ──────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: '#f9fafb',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  securityIcon: {
    fontSize: 20,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});
