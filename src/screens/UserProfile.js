import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { UserAPIService } from '../services/doctorApiService';
import { api } from '../services/api';
import BottomNavigation from '../components/BottomNavigation';

export default function UserProfile({ route, navigation }) {
  const { userId } = route.params;
  
  const [userDetails, setUserDetails] = useState(null);
  const [appointmentsData, setAppointmentsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userFullName, setUserFullName] = useState('');
  
  // State for expandable sections
  const [expandedSections, setExpandedSections] = useState({
    medicalConditions: false,
    medicalHistory: false,
    emergencyContact: false,
    doctorReviews: false,
  });

  useEffect(() => {
    fetchUserData();
    loadUserName();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from edit screen)
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  const loadUserName = async () => {
    try {
      const fullName = await SecureStore.getItemAsync('fullName');
      setUserFullName(fullName || 'User');
    } catch (error) {
      console.error('Error loading user name:', error);
      setUserFullName('User');
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile and appointments data
      const [userProfile] = await Promise.all([
        UserAPIService.fetchUserProfile(userId),
        // UserAPIService.fetchAllUserAppointments(userId)
      ]);
      
      setUserDetails(userProfile);
      // setAppointmentsData(userAppointments);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // const getAppointmentStats = () => {
  //   if (!appointmentsData || !appointmentsData.appointmentsByDate) {
  //     return { total: 0, completed: 0, cancelled: 0, booked: 0 };
  //   }

  //   let total = 0;
  //   let completed = 0;
  //   let cancelled = 0;
  //   let booked = 0;

  //   Object.values(appointmentsData.appointmentsByDate).forEach(dateAppointments => {
  //     dateAppointments.forEach(appointment => {
  //       total++;
  //       switch (appointment.status) {
  //         case 'COMPLETED':
  //           completed++;
  //           break;
  //         case 'CANCELLED':
  //           cancelled++;
  //           break;
  //         case 'BOOKED':
  //         case 'RESCHEDULED':
  //           booked++;
  //           break;
  //       }
  //     });
  //   });

  //   return { total, completed, cancelled, booked };
  // };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    navigation.navigate('EditProfile', { 
      userId: userId, 
      userDetails: userDetails 
    });
  };

  // const handleChangePassword = () => {
  //   // Navigate to change password screen
  //   Alert.alert('Change Password', 'Change password functionality will be added soon.');
  // };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/api/auth/logout');
              await SecureStore.deleteItemAsync('accessToken');
              await SecureStore.deleteItemAsync('role');
              await SecureStore.deleteItemAsync('userId');
              await SecureStore.deleteItemAsync('fullName');
              navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
            } catch (e) {
              console.log('logout error', e);
              // Force logout even if API fails
              await SecureStore.deleteItemAsync('accessToken');
              await SecureStore.deleteItemAsync('role');
              await SecureStore.deleteItemAsync('userId');
              await SecureStore.deleteItemAsync('fullName');
              navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
            }
          }
        }
      ]
    );
  };

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Calculate appointment statistics
  // const appointmentStats = getAppointmentStats();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userFullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{userFullName}</Text>
          <Text style={styles.userEmail}>{userDetails?.email || 'Loading...'}</Text>
        </View>

        {/* Stats Cards */}
        {/* <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{appointmentStats.total}</Text>
            <Text style={styles.statLabel}>Total Appointments</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{appointmentStats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{appointmentStats.cancelled}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View> */}

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>� Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{userDetails.fullName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>{userDetails.mobileNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userDetails.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{userDetails.age || 'Not specified'} years</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Group</Text>
              <Text style={[styles.infoValue, styles.bloodGroup]}>{userDetails.bloodGroup || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Address Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{userDetails.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>City & State</Text>
              <Text style={styles.infoValue}>{userDetails.city}, {userDetails.state}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PIN Code</Text>
              <Text style={styles.infoValue}>{userDetails.pincode}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Country</Text>
              <Text style={styles.infoValue}>{userDetails.country}</Text>
            </View>
          </View>
        </View>

        {/* Physical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📏 Physical Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.vitalsGrid}>
              <View style={styles.vitalCard}>
                <Text style={styles.vitalIcon}>📐</Text>
                <Text style={styles.vitalLabel}>Height</Text>
                <Text style={styles.vitalValue}>{userDetails.heightCm || '--'} cm</Text>
              </View>
              <View style={styles.vitalCard}>
                <Text style={styles.vitalIcon}>⚖️</Text>
                <Text style={styles.vitalLabel}>Weight</Text>
                <Text style={styles.vitalValue}>{userDetails.weightKg || '--'} kg</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vital Signs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💓 Vital Signs</Text>
          <View style={styles.infoCard}>
            <View style={styles.vitalsGrid}>
              <View style={styles.vitalCard}>
                <Text style={styles.vitalIcon}>💗</Text>
                <Text style={styles.vitalLabel}>Heart Rate</Text>
                <Text style={styles.vitalValue}>{userDetails.heartRate || '--'} bpm</Text>
              </View>
              <View style={styles.vitalCard}>
                <Text style={styles.vitalIcon}>🌡️</Text>
                <Text style={styles.vitalLabel}>Temperature</Text>
                <Text style={styles.vitalValue}>{userDetails.bodyTemperature || '--'}°F</Text>
              </View>
              <View style={styles.vitalCard}>
                <Text style={styles.vitalIcon}>🫁</Text>
                <Text style={styles.vitalLabel}>Oxygen Level</Text>
                <Text style={styles.vitalValue}>{userDetails.bloodOxygenLevel || '--'}%</Text>
              </View>
              <View style={styles.vitalCard}>
                <Text style={styles.vitalIcon}>🩸</Text>
                <Text style={styles.vitalLabel}>Blood Pressure</Text>
                <Text style={styles.vitalValue}>
                  {userDetails.bloodPressureSystolic && userDetails.bloodPressureDiastolic 
                    ? `${userDetails.bloodPressureSystolic}/${userDetails.bloodPressureDiastolic}` 
                    : '--/--'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Medical Conditions */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('medicalConditions')}
          >
            <Text style={styles.sectionTitle}>🏥 Medical Conditions</Text>
            <Text style={styles.expandIcon}>
              {expandedSections.medicalConditions ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          {expandedSections.medicalConditions && (
            <View style={styles.infoCard}>
              <View style={styles.conditionsGrid}>
                <View style={[styles.conditionItem, userDetails.hasDiabetes && styles.conditionActive]}>
                  <Text style={styles.conditionIcon}>🍬</Text>
                  <Text style={styles.conditionLabel}>Diabetes</Text>
                  <Text style={[styles.conditionStatus, userDetails.hasDiabetes && styles.conditionStatusActive]}>
                    {userDetails.hasDiabetes ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={[styles.conditionItem, userDetails.hasHypertension && styles.conditionActive]}>
                  <Text style={styles.conditionIcon}>🫀</Text>
                  <Text style={styles.conditionLabel}>Hypertension</Text>
                  <Text style={[styles.conditionStatus, userDetails.hasHypertension && styles.conditionStatusActive]}>
                    {userDetails.hasHypertension ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={[styles.conditionItem, userDetails.hasHeartDisease && styles.conditionActive]}>
                  <Text style={styles.conditionIcon}>💔</Text>
                  <Text style={styles.conditionLabel}>Heart Disease</Text>
                  <Text style={[styles.conditionStatus, userDetails.hasHeartDisease && styles.conditionStatusActive]}>
                    {userDetails.hasHeartDisease ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={[styles.conditionItem, userDetails.hasKidneyDisease && styles.conditionActive]}>
                  <Text style={styles.conditionIcon}>🫘</Text>
                  <Text style={styles.conditionLabel}>Kidney Disease</Text>
                  <Text style={[styles.conditionStatus, userDetails.hasKidneyDisease && styles.conditionStatusActive]}>
                    {userDetails.hasKidneyDisease ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={[styles.conditionItem, userDetails.hasLiverDisease && styles.conditionActive]}>
                  <Text style={styles.conditionIcon}>🫀</Text>
                  <Text style={styles.conditionLabel}>Liver Disease</Text>
                  <Text style={[styles.conditionStatus, userDetails.hasLiverDisease && styles.conditionStatusActive]}>
                    {userDetails.hasLiverDisease ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Medical History */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('medicalHistory')}
          >
            <Text style={styles.sectionTitle}>📋 Medical History</Text>
            <Text style={styles.expandIcon}>
              {expandedSections.medicalHistory ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {expandedSections.medicalHistory && (
            <>
              {/* Current Medications */}
              <View style={styles.infoCard}>
                <Text style={styles.subSectionTitle}>💊 Current Medications</Text>
                {userDetails.currentMedications && userDetails.currentMedications.length > 0 ? (
                  userDetails.currentMedications.map((medication, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{medication}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No current medications</Text>
                )}
              </View>

              {/* Allergies */}
              <View style={styles.infoCard}>
                <Text style={styles.subSectionTitle}>🚫 Allergies</Text>
                {userDetails.allergies && userDetails.allergies.length > 0 ? (
                  userDetails.allergies.map((allergy, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{allergy}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No known allergies</Text>
                )}
              </View>

              {/* Chronic Diseases */}
              <View style={styles.infoCard}>
                <Text style={styles.subSectionTitle}>🔄 Chronic Diseases</Text>
                {userDetails.chronicDiseases && userDetails.chronicDiseases.length > 0 ? (
                  userDetails.chronicDiseases.map((disease, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{disease}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No chronic diseases</Text>
                )}
              </View>

              {/* Previous Surgeries */}
              <View style={styles.infoCard}>
                <Text style={styles.subSectionTitle}>🔪 Previous Surgeries</Text>
                {userDetails.previousSurgeries && userDetails.previousSurgeries.length > 0 ? (
                  userDetails.previousSurgeries.map((surgery, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{surgery}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No previous surgeries</Text>
                )}
              </View>

              {/* Vaccinations */}
              <View style={styles.infoCard}>
                <Text style={styles.subSectionTitle}>💉 Vaccinations</Text>
                {userDetails.vaccinations && userDetails.vaccinations.length > 0 ? (
                  userDetails.vaccinations.map((vaccination, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{vaccination}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No vaccination records</Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('emergencyContact')}
          >
            <Text style={styles.sectionTitle}>🚨 Emergency Contact</Text>
            <Text style={styles.expandIcon}>
              {expandedSections.emergencyContact ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          {expandedSections.emergencyContact && (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{userDetails.emergencyContactName || 'Not specified'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{userDetails.emergencyContactNumber || 'Not specified'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Relation</Text>
                <Text style={styles.infoValue}>{userDetails.emergencyContactRelation || 'Not specified'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Previous Doctors Reviews */}
        {(userDetails.medicalNotes || userDetails.familyMedicalHistory) && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('doctorReviews')}
            >
              <Text style={styles.sectionTitle}>�‍⚕️ Previous Doctors Reviews</Text>
              <Text style={styles.expandIcon}>
                {expandedSections.doctorReviews ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            
            {expandedSections.doctorReviews && (
              <>
                {userDetails.medicalNotes && (
                  <View style={styles.infoCard}>
                    <Text style={styles.subSectionTitle}>Medical Notes</Text>
                    <Text style={styles.notesText}>{userDetails.medicalNotes}</Text>
                  </View>
                )}

                {userDetails.familyMedicalHistory && (
                  <View style={styles.infoCard}>
                    <Text style={styles.subSectionTitle}>Family Medical History</Text>
                    <Text style={styles.notesText}>{userDetails.familyMedicalHistory}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Account Settings</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <Text style={styles.actionButtonText}>✏️ Edit Profile</Text>
            <Text style={styles.actionButtonArrow}>→</Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
            <Text style={styles.actionButtonText}>🔒 Change Password</Text>
            <Text style={styles.actionButtonArrow}>→</Text>
          </TouchableOpacity> */}
          
          {/* <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AppointmentHistory', { userId })}>
            <Text style={styles.actionButtonText}>📋 Appointment History</Text>
            <Text style={styles.actionButtonArrow}>→</Text>
          </TouchableOpacity> */}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      <BottomNavigation 
        activeTab="profile"
        userType="user"
        onTabChange={(tab) => {
          switch (tab) {
            case 'appointments':
              navigation.navigate('UserHome', { userId });
              break;
            case 'calendar':
              navigation.navigate('UserCalendar', { userId });
              break;
            case 'profile':
              // Already on profile
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
    padding: 15, // Reduced from 20
    paddingTop: 20, // Reduced from 30
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20, // Reduced from 30
  },
  avatarContainer: {
    width: 70, // Reduced from 80
    height: 70, // Reduced from 80
    borderRadius: 35, // Reduced from 40
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10, // Reduced from 15
  },
  avatarText: {
    fontSize: 22, // Reduced from 24
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 22, // Reduced from 24
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14, // Reduced from 16
    color: '#7f8c8d',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25, // Reduced from 30
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15, // Reduced from 20
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 20, // Reduced from 24
    fontWeight: '700',
    color: '#3498db',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11, // Reduced from 12
    color: '#7f8c8d',
    textAlign: 'center',
  },
  section: {
    marginBottom: 15, // Reduced from 25
  },
  sectionTitle: {
    fontSize: 16, // Reduced from 18
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10, // Reduced from 15
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  expandIcon: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10, // Reduced from 12
    padding: 12, // Reduced from 20
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 8, // Reduced spacing between cards
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6, // Reduced from 8
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  infoLabel: {
    fontSize: 13, // Reduced from 14
    color: '#7f8c8d',
    flex: 1,
  },
  infoValue: {
    fontSize: 13, // Reduced from 14
    color: '#2c3e50',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  bloodGroup: {
    color: '#e74c3c',
    fontWeight: '700',
    fontSize: 15, // Reduced from 16
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vitalCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10, // Reduced from 12
    alignItems: 'center',
    marginBottom: 8, // Reduced from 10
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  vitalIcon: {
    fontSize: 20, // Reduced from 24
    marginBottom: 4, // Reduced from 5
  },
  vitalLabel: {
    fontSize: 11, // Reduced from 12
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 2,
  },
  vitalValue: {
    fontSize: 14, // Reduced from 16
    color: '#2c3e50',
    fontWeight: '700',
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  conditionItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10, // Reduced from 12
    alignItems: 'center',
    marginBottom: 8, // Reduced from 10
    borderWidth: 2,
    borderColor: '#28a745',
  },
  conditionActive: {
    borderColor: '#dc3545',
    backgroundColor: '#ffeaea',
  },
  conditionIcon: {
    fontSize: 18, // Reduced from 20
    marginBottom: 4, // Reduced from 5
  },
  conditionLabel: {
    fontSize: 10, // Reduced from 11
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  conditionStatus: {
    fontSize: 13, // Reduced from 14
    color: '#28a745',
    fontWeight: '700',
  },
  conditionStatusActive: {
    color: '#dc3545',
  },
  subSectionTitle: {
    fontSize: 14, // Reduced from 16
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8, // Reduced from 10
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 4, // Reduced from 5
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4, // Reduced from 5
  },
  listBullet: {
    fontSize: 14, // Reduced from 16
    color: '#3498db',
    marginRight: 6, // Reduced from 8
    marginTop: 1,
  },
  listText: {
    fontSize: 13, // Reduced from 14
    color: '#2c3e50',
    flex: 1,
    lineHeight: 18, // Reduced from 20
  },
  emptyText: {
    fontSize: 13, // Reduced from 14
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8, // Reduced from 10
  },
  notesText: {
    fontSize: 13, // Reduced from 14
    color: '#2c3e50',
    lineHeight: 18, // Reduced from 20
    backgroundColor: '#f8f9fa',
    padding: 10, // Reduced from 12
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12, // Reduced from 16
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced from 10
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButtonText: {
    fontSize: 15, // Reduced from 16
    color: '#2c3e50',
    fontWeight: '500',
  },
  actionButtonArrow: {
    fontSize: 16, // Reduced from 18
    color: '#3498db',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    padding: 12, // Reduced from 16
    marginBottom: 20, // Reduced from 30
    alignItems: 'center',
    marginTop: 15, // Reduced from 20
  },
  logoutButtonText: {
    fontSize: 15, // Reduced from 16
    color: '#fff',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100, // Reduced from 120
  },
});
