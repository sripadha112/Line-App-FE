import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function RoleSelectionScreen({ navigation, route }) {
  const { mobile, otp } = route.params || {};

  const handleRoleSelect = (role) => {
    if (role === 'DOCTOR') {
      navigation.navigate('DoctorRegistration', { mobile, otp });
    } else {
      navigation.navigate('UserRegistration', { mobile, otp });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register as</Text>
      <Text style={styles.subtitle}>Choose your role to continue</Text>
      
      <TouchableOpacity 
        style={[styles.roleButton, styles.userButton]} 
        onPress={() => handleRoleSelect('USER')}
      >
        <View style={styles.buttonIcon}>
          <Text style={styles.iconText}>👤</Text>
        </View>
        <Text style={styles.buttonText}>User</Text>
        <Text style={styles.buttonSubtext}>Find and book appointments</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.roleButton, styles.doctorButton]} 
        onPress={() => handleRoleSelect('DOCTOR')}
      >
        <View style={styles.buttonIcon}>
          <Text style={styles.iconText}>👨‍⚕️</Text>
        </View>
        <Text style={styles.buttonText}>Doctor</Text>
        <Text style={styles.buttonSubtext}>Manage appointments and patients</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
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
    marginBottom: 50,
    textAlign: 'center',
  },
  roleButton: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userButton: {
    backgroundColor: '#3498db',
  },
  doctorButton: {
    backgroundColor: '#e74c3c',
  },
  buttonIcon: {
    marginBottom: 12,
  },
  iconText: {
    fontSize: 48,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#ecf0f1',
    textAlign: 'center',
  },
});
