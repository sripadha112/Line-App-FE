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
import AuthScreen from './src/screens/AuthScreen';
import OtpVerifyScreen from './src/screens/OtpVerifyScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import DoctorRegistrationScreen from './src/screens/DoctorRegistrationScreen';
import UserRegistrationScreen from './src/screens/UserRegistrationScreen';
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
import * as SecureStore from 'expo-secure-store';
import { setAuthHeaderFromStore, overrideApiBaseUrl } from './src/services/api';
import API_BASE_URL from './src/config';
import { ActivityIndicator, View, Modal, Text, TextInput, Button, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [debugVisible, setDebugVisible] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [resolvedBase, setResolvedBase] = useState(API_BASE_URL || '');

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      const role = await SecureStore.getItemAsync('role');
      await setAuthHeaderFromStore();
      if (token && role) {
        setInitialRoute(role === 'DOCTOR' ? 'DoctorHome' : 'UserHome');
      } else {
        setInitialRoute('Auth');
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

  if (!initialRoute) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator/></View>;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Auth" component={AuthScreen} options={{headerShown:false}} />
        <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} options={{title:'Verify OTP'}} />
        <Stack.Screen 
          name="RoleSelection" 
          component={RoleSelectionScreen} 
          options={{
            title:'Choose Role',
            headerBackVisible: false,
          }} 
        />
        <Stack.Screen 
          name="DoctorRegistration" 
          component={DoctorRegistrationScreen} 
          options={{title:'Doctor Registration'}} 
        />
        <Stack.Screen 
          name="UserRegistration" 
          component={UserRegistrationScreen} 
          options={{title:'User Registration'}} 
        />
        <Stack.Screen name="DoctorHome" component={DoctorHome} options={{headerShown:false}} />
        <Stack.Screen name="UserHome" component={UserHome} options={{headerShown:false}} />
        <Stack.Screen name="UserCalendar" component={UserCalendar} options={{headerShown:false}} />
        <Stack.Screen name="UserProfile" component={UserProfile} options={{headerShown:false}} />
        <Stack.Screen name="EditProfile" component={EditProfile} options={{headerShown:false}} />
        <Stack.Screen name="BookAppointment" component={BookAppointment} options={{headerShown:false}} />
        <Stack.Screen name="RescheduleAppointment" component={RescheduleAppointment} options={{headerShown:false}} />
        <Stack.Screen name="CancelAppointment" component={CancelAppointment} options={{headerShown:false}} />
        <Stack.Screen name="AllBookings" component={AllBookings} options={{headerShown:false}} />
        <Stack.Screen name="PatientProfilePrescription" component={PatientProfilePrescription} options={{headerShown:false}} />
        <Stack.Screen name="AppointmentHistory" component={AppointmentHistory} options={{headerShown:false}} />
        <Stack.Screen name="BulkReschedule" component={BulkReschedule} options={{headerShown:false}} />
        <Stack.Screen name="CancelDay" component={CancelDay} options={{headerShown:false}} />
      </Stack.Navigator>

      {/* Debug overlay: toggleable modal to override/test API base URL on device */}
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

