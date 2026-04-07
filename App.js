// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>Santhosh it is working ra..</Text>
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

import React, {useEffect, useState} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import OtpVerifyScreen from './src/screens/OtpVerifyScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import DoctorRegistrationScreen from './src/screens/DoctorRegistrationScreen';
import UserRegistrationScreen from './src/screens/UserRegistrationScreen';
import LandingPage from './src/screens/LandingPage';
import DoctorHome from './src/screens/DoctorHome';
import UserHome from './src/screens/UserHome';
import UserCalendar from './src/screens/UserCalendar';
import UserProfile from './src/screens/UserProfile';
import EditProfile from './src/screens/EditProfile';
import BookAppointment from './src/screens/BookAppointment';
import RescheduleAppointment from './src/screens/RescheduleAppointment';
import CancelAppointment from './src/screens/CancelAppointment';
import AllBookings from './src/screens/AllBookings';
import PatientProfilePrescription from './src/screens/PatientProfilePrescription';
import AppointmentHistory from './src/screens/AppointmentHistory';
import BulkReschedule from './src/screens/BulkReschedule';
import CancelDay from './src/screens/CancelDay';
import QuickBookingQR from './src/screens/QuickBookingQR';
import FCMTestScreen from './src/screens/FCMTestScreen';
import SecureStore from './src/utils/secureStorage';
import { setAuthHeaderFromStore, overrideApiBaseUrl, setNavigationRef } from './src/services/api';
import API_BASE_URL from './src/config';
import { ActivityIndicator, View, Modal, Text, TextInput, Button, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import fcmService from './src/services/fcmService';
import UserNotificationService from './src/services/userNotificationService';
import WarmupService from './src/services/warmupService';

const Stack = createNativeStackNavigator();

// Linking configuration for web browser navigation
const linking = {
  prefixes: ['https://neextapp.com', 'http://localhost:19006'],
  config: {
    screens: {
      Landing: '',
      Auth: 'auth',
      OtpVerify: 'otp-verify',
      RoleSelection: 'role-selection',
      DoctorRegistration: 'doctor-registration',
      UserRegistration: 'user-registration',
      DoctorHome: 'doctor/home',
      UserHome: 'user/home',
      UserCalendar: 'user/calendar',
      UserProfile: 'user/profile',
      EditProfile: 'user/edit-profile',
      BookAppointment: 'user/book-appointment',
      RescheduleAppointment: 'user/reschedule',
      CancelAppointment: 'user/cancel',
      AllBookings: 'doctor/bookings',
      PatientProfilePrescription: 'doctor/patient/:patientId',
      AppointmentHistory: 'doctor/history',
      BulkReschedule: 'doctor/bulk-reschedule',
      CancelDay: 'doctor/cancel-day',
      QuickBookingQR: 'quick-booking/:doctorId',
      FCMTest: 'fcm-test',
    },
  },
};

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [debugVisible, setDebugVisible] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [resolvedBase, setResolvedBase] = useState(API_BASE_URL || '');
  const navigationRef = React.useRef();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Start backend warmup immediately (non-blocking)
        // console.log('🔥 [App] Starting backend warmup...');
        // WarmupService.warmupSilently().then(result => {
        //   if (result.success) {
        //     console.log(`✅ [App] Backend warmed up in ${result.duration}ms`);
        //   } else {
        //     console.log('⚠️ [App] Backend warmup failed, but app will continue');
        //   }
        // });

        const token = await SecureStore.getItemAsync('accessToken');
        const role = await SecureStore.getItemAsync('role');
        await setAuthHeaderFromStore();
      
        // Set navigation reference for API service
        if (navigationRef.current) {
          setNavigationRef(navigationRef.current);
        }
      
        // Initialize User Notification Service (only for users, not doctors)
        try {
          console.log('🔔 [App] Initializing User Notification Service...');
          const notificationResult = await UserNotificationService.registerUserForNotifications();
          if (notificationResult.success) {
            console.log('✅ [App] User notifications initialized successfully');
          } else {
            console.log('ℹ️ [App] User notifications:', notificationResult.message);
          }
        } catch (error) {
          console.error('❌ [App] Notification initialization error:', error);
        }
      
        if (token && role) {
          setInitialRoute(role === 'DOCTOR' ? 'DoctorHome' : 'UserHome');
        } else {
          // Show Landing page for web, Auth for mobile
          setInitialRoute(Platform.OS === 'web' ? 'Landing' : 'Auth');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitialRoute(Platform.OS === 'web' ? 'Landing' : 'Auth');
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  // Apply manual override and reflect in UI
  const applyManualBase = (url) => {
    if (!url) return Alert.alert('Provide a base URL');
    overrideApiBaseUrl(url);
    setResolvedBase(url);
    Alert.alert('Base URL overridden', url);
  };

  const testConnectivity = async (base) => {
    const b = base || resolvedBase;
    if (!b) return Alert.alert('No base URL to test');
    try {
      const resp = await fetch(b + '/');
      Alert.alert('Connectivity OK', `Status: ${resp.status}`);
    } catch (e) {
      Alert.alert('Connectivity failed', String(e.message || e));
    }
  };

  if (!isReady || !initialRoute) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#fff'}}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer 
        ref={navigationRef}
        linking={Platform.OS === 'web' ? linking : undefined}
        fallback={<View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator/></View>}
        documentTitle={{
          formatter: (options, route) => 
            options?.title ? `${options.title} - NeextApp` : 'NeextApp - Healthcare Appointments'
        }}
        onReady={() => {
          // Set navigation reference when container is ready
          setNavigationRef(navigationRef.current);
        }}
      >
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
          name="Landing" 
          component={LandingPage} 
          options={{headerShown:false, title:'NeextApp - Healthcare Made Simple'}} 
        />
        <Stack.Screen name="Auth" component={AuthScreen} options={{headerShown:false, title:'Login'}} />
        <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} options={{title:'Verify OTP', headerShown: Platform.OS !== 'web'}} />
        <Stack.Screen 
          name="RoleSelection" 
          component={RoleSelectionScreen} 
          options={{
            title:'Choose Role',
            headerBackVisible: false,
            headerShown: Platform.OS !== 'web',
          }} 
        />
        <Stack.Screen 
          name="DoctorRegistration" 
          component={DoctorRegistrationScreen} 
          options={{title:'Doctor Registration', headerShown: Platform.OS !== 'web'}} 
        />
        <Stack.Screen 
          name="UserRegistration" 
          component={UserRegistrationScreen} 
          options={{title:'User Registration', headerShown: Platform.OS !== 'web'}} 
        />
        <Stack.Screen name="DoctorHome" component={DoctorHome} options={{headerShown:false, title:'Doctor Dashboard'}} />
        <Stack.Screen name="UserHome" component={UserHome} options={{headerShown:false, title:'Home'}} />
        <Stack.Screen name="UserCalendar" component={UserCalendar} options={{headerShown:false, title:'My Calendar'}} />
        <Stack.Screen name="UserProfile" component={UserProfile} options={{headerShown:false, title:'My Profile'}} />
        <Stack.Screen name="EditProfile" component={EditProfile} options={{headerShown:false, title:'Edit Profile'}} />
        <Stack.Screen name="BookAppointment" component={BookAppointment} options={{headerShown:false, title:'Book Appointment'}} />
        <Stack.Screen name="RescheduleAppointment" component={RescheduleAppointment} options={{headerShown:false, title:'Reschedule Appointment'}} />
        <Stack.Screen name="CancelAppointment" component={CancelAppointment} options={{headerShown:false, title:'Cancel Appointment'}} />
        <Stack.Screen name="AllBookings" component={AllBookings} options={{headerShown:false, title:'All Bookings'}} />
        <Stack.Screen name="PatientProfilePrescription" component={PatientProfilePrescription} options={{headerShown:false, title:'Patient Details'}} />
        <Stack.Screen name="AppointmentHistory" component={AppointmentHistory} options={{headerShown:false, title:'Appointment History'}} />
        <Stack.Screen name="BulkReschedule" component={BulkReschedule} options={{headerShown:false, title:'Bulk Reschedule'}} />
        <Stack.Screen name="CancelDay" component={CancelDay} options={{headerShown:false, title:'Cancel Day'}} />
        <Stack.Screen name="QuickBookingQR" component={QuickBookingQR} options={{headerShown:false, title:'Quick Booking'}} />
        <Stack.Screen name="FCMTest" component={FCMTestScreen} options={{headerShown:false, title:'Notification Test'}} />
      </Stack.Navigator>

      {/* Debug overlay: only show in development mode */}
      {__DEV__ && (
        <>
          <Modal visible={debugVisible} transparent animationType="slide">
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={{fontWeight:'700',marginBottom:6}}>Debug: API Base</Text>
                <Text style={{marginBottom:8}}>Resolved: {resolvedBase || '(none)'}</Text>
                <TextInput placeholder="http://192.168.1.75:8080" value={manualUrl} onChangeText={setManualUrl} style={styles.input} />
                <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                  <Button title="Apply" onPress={()=>applyManualBase(manualUrl)} />
                  <Button title="Test" onPress={()=>testConnectivity(manualUrl || resolvedBase)} />
                  <Button title="Close" onPress={()=>setDebugVisible(false)} />
                </View>
              </View>
            </View>
          </Modal>

          <TouchableOpacity style={styles.debugButton} onPress={()=>setDebugVisible(true)}>
            <Text style={{color:'#fff',fontWeight:'700'}}>DBG</Text>
          </TouchableOpacity>
        </>
      )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  debugButton:{position:'absolute',right:14,bottom:20,backgroundColor:'#111',padding:10,borderRadius:24,elevation:4},
  modalBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',alignItems:'center'},
  modalCard:{width:'90%',backgroundColor:'#fff',padding:16,borderRadius:8,elevation:6},
  input:{borderWidth:1,borderColor:'#ddd',padding:8,borderRadius:6,marginBottom:12}
});

