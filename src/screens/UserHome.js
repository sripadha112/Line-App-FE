import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { UserAPIService } from '../services/doctorApiService';
import BottomNavigation from '../components/BottomNavigation';
import ActiveBookings from '../components/user/ActiveBookings';

export default function UserHome({ route, navigation }) {
  // Safely extract userId with fallback to SecureStore
  const routeUserId = route?.params?.userId;
  
  const [userId, setUserId] = useState(routeUserId);
  const [userProfile, setUserProfile] = useState(null);
  const [userFullName, setUserFullName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointmentsRefreshTrigger, setAppointmentsRefreshTrigger] = useState(0);

  useEffect(() => {
    initializeUser();
  }, []);

  // Refresh data when screen comes into focus (e.g., after booking appointment)
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        fetchUserProfile(userId);
        // Trigger appointments refresh by incrementing the trigger
        setAppointmentsRefreshTrigger(prev => prev + 1);
      }
    }, [userId])
  );

  const initializeUser = async () => {
    try {
      let currentUserId = routeUserId;
      
      // If userId not in route params, try to get from SecureStore
      if (!currentUserId) {
        currentUserId = await SecureStore.getItemAsync('userId');
        setUserId(currentUserId);
      }
      
      // Try to get user name from SecureStore (from OTP verification)
      const storedFullName = await SecureStore.getItemAsync('fullName');
      if (storedFullName) {
        console.log('📱 Found stored fullName:', storedFullName);
        setUserFullName(storedFullName);
      }
      
      if (currentUserId) {
        await fetchUserProfile(currentUserId);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const fetchUserProfile = async (userIdToFetch = userId) => {
    if (!userIdToFetch) return;
    
    try {
      setLoading(true);
      console.log('🔍 Fetching profile for userId:', userIdToFetch);
      const profile = await UserAPIService.fetchUserProfile(userIdToFetch);
      console.log('✅ Profile received:', profile);
      console.log('👤 Full name from profile:', profile?.fullName);
      setUserProfile(profile);
      
      // Update userFullName if we got it from the profile
      if (profile?.fullName) {
        setUserFullName(profile.fullName);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  }, [userId]);

  // Handle missing userId
  if (!userId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#f8f9fa" />
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Missing User ID</Text>
            <Text style={styles.errorMessage}>
              Unable to load user data. Please login again.
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('AuthScreen')}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleNavigateToReschedule = () => {
    navigation.navigate('UserCalendar', { 
      userId, 
      status: 'RESCHEDULED',
      title: 'Rescheduled Appointments'
    });
  };

  const handleNavigateToCancel = () => {
    navigation.navigate('UserCalendar', { 
      userId, 
      status: 'CANCELLED',
      title: 'Canceled Appointments'
    });
  };

  const navigateToReschedule = (appointmentId) => {
    navigation.navigate('RescheduleAppointment', { userId, appointmentId });
  };

  const navigateToCancel = (appointmentId) => {
    navigation.navigate('CancelAppointment', { userId, appointmentId });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {userFullName || userProfile?.fullName ? 
              `Hello, ${userFullName || userProfile.fullName}! 👋` : 
              'Welcome! 👋'
            }
          </Text>
          <Text style={styles.welcomeSubtitle}>
            How can we help you today?
          </Text>
        </View>

        {/* Active Bookings Section */}
        <ActiveBookings
          userId={userId}
          onReschedule={navigateToReschedule}
          onCancel={navigateToCancel}
          refreshTrigger={appointmentsRefreshTrigger}
        />

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, styles.primaryActionCard]}
              onPress={() => navigation.navigate('BookAppointment', { userId })}
            >
              <Text style={[styles.actionIcon, styles.primaryActionIcon]}>📅</Text>
              <Text style={[styles.actionTitle, styles.primaryActionTitle]}>Book Appointment</Text>
              <Text style={[styles.actionSubtitle, styles.primaryActionSubtitle]}>Schedule new appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('UserProfile', { userId })}
            >
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionTitle}>Profile</Text>
              <Text style={styles.actionSubtitle}>View profile details</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Bookings History</Text>

          <View style={styles.actionGrid}>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleNavigateToReschedule}
            >
              <Text style={styles.actionIcon}>�</Text>
              <Text style={styles.actionTitle}>Rescheduled</Text>
              <Text style={styles.actionSubtitle}>Rescheduled appointments history</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleNavigateToCancel}
            >
              <Text style={styles.actionIcon}>❌</Text>
              <Text style={styles.actionTitle}>Canceled</Text>
              <Text style={styles.actionSubtitle}>Canceled appointment history</Text>
            </TouchableOpacity>
            
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services</Text>
          
          <View style={styles.servicesList}>
            <TouchableOpacity style={styles.serviceCard}>
              <Text style={styles.serviceIcon}>🩺</Text>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>General Consultation</Text>
                <Text style={styles.serviceDescription}>
                  Book an appointment with our general practitioners
                </Text>
              </View>
              <Text style={styles.serviceArrow}>→</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.serviceCard}>
              <Text style={styles.serviceIcon}>🏥</Text>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>Specialist Care</Text>
                <Text style={styles.serviceDescription}>
                  Access specialized medical care and treatment
                </Text>
              </View>
              <Text style={styles.serviceArrow}>→</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.serviceCard}>
              <Text style={styles.serviceIcon}>🔬</Text>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>Lab Tests</Text>
                <Text style={styles.serviceDescription}>
                  Schedule laboratory tests and diagnostics
                </Text>
              </View>
              <Text style={styles.serviceArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing for Navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      <BottomNavigation 
        activeTab="appointments"
        userType="user"
        onTabChange={(tab) => {
          switch (tab) {
            case 'appointments':
              // Already on home
              break;
            case 'calendar':
              navigation.navigate('UserCalendar', { userId });
              break;
            case 'profile':
              navigation.navigate('UserProfile', { userId });
              break;
          }
        }}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 10, // Add extra top padding for better spacing
  },
  welcomeSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  quickActionsSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  primaryActionCard: {
    backgroundColor: '#52bb6eff',
    borderColor: '#1c3c27ff',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  primaryActionIcon: {
    fontSize: 36,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  primaryActionTitle: {
    color: '#fff',
    fontSize: 16,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  primaryActionSubtitle: {
    color: '#ecf0f1',
  },
  servicesSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  servicesList: {
    marginTop: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  serviceIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  serviceArrow: {
    fontSize: 18,
    color: '#bdc3c7',
    marginLeft: 10,
  },
  bottomSpacing: {
    height: 120, // Increased to accommodate bottom navigation
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
