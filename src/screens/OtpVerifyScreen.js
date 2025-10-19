import React, {useState} from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';

export default function OtpVerifyScreen({route, navigation}) {
  const mobile = route.params?.mobile;
  const [otp, setOtp] = useState('');
  const [isRegistering, setIsRegistering] = useState(true);
  const [role, setRole] = useState('USER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const verify = async () => {
    try {
      const body = { mobileNumber: mobile, otpCode: otp };
      if (isRegistering) {
        body.role = role;
        body.fullName = fullName;
        body.email = email;
      }
      const res = await api.post('/api/auth/verify-otp', body);
      const data = res.data;
      const token = data.token || data.accessToken || data.token;
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
    } catch (e) {
      alert('Verify failed: ' + (e.response?.data?.error || e.message));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Verify OTP for {mobile}</Text>
      <TextInput style={styles.input} value={otp} onChangeText={setOtp} placeholder="Enter OTP" keyboardType="number-pad" />
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:12}}>
        <Button title="USER" onPress={()=>setRole('USER')} />
        <View style={{width:8}}/>
        <Button title="DOCTOR" onPress={()=>setRole('DOCTOR')} />
      </View>
      {isRegistering && (
        <>
          <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        </>
      )}
      <Button title="Verify & Continue" onPress={verify} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{flexGrow:1,justifyContent:'center',padding:20},
  title:{fontSize:20,fontWeight:'700',marginBottom:10},
  input:{borderWidth:1,borderColor:'#ccc',padding:10,borderRadius:8,marginBottom:12}
});
