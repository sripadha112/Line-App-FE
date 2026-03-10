import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import SecureStore from '../utils/secureStorage';
import { UserAPIService } from '../services/doctorApiService';
import BottomNavigation from '../components/BottomNavigation';
import ActiveBookings from '../components/user/ActiveBookings';
import UserNotificationService from '../services/userNotificationService';
import APIErrorHelper from '../utils/apiErrorHelper';

export default function UserHome({ route, navigation }) {
  // Safely extract userId with fallback to SecureStore
  const routeUserId = route?.params?.userId;
  
  const [userId, setUserId] = useState(routeUserId);
  const [userProfile, setUserProfile] = useState(null);
  const [userFullName, setUserFullName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointmentsRefreshTrigger, setAppointmentsRefreshTrigger] = useState(0);
  
  // Family members state
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showViewMemberModal, setShowViewMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('');
  const [newMemberRelationship, setNewMemberRelationship] = useState('');
  const [newMemberGender, setNewMemberGender] = useState('');
  const [newMemberContact, setNewMemberContact] = useState('');
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);
  
  const genderOptions = ['Male', 'Female', 'Other'];
  const relationshipOptions = ['Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Spouse', 'Grandfather', 'Grandmother', 'Other'];

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
        
        // Ensure FCM token is registered for push notifications
        // This handles cases where user already had the app but FCM wasn't registered
        console.log('🔔 [UserHome] Ensuring FCM token is registered...');
        try {
          const fcmResult = await UserNotificationService.forceRegisterFcmToken();
          if (fcmResult.success) {
            console.log('✅ [UserHome] FCM token registration confirmed');
          } else {
            console.log('ℹ️ [UserHome] FCM registration:', fcmResult.message);
          }
        } catch (fcmError) {
          console.warn('⚠️ [UserHome] FCM registration warning:', fcmError);
        }
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
      
      // Fetch profile first
      const profile = await UserAPIService.fetchUserProfile(userIdToFetch);
      console.log('✅ Profile received:', profile);
      console.log('👤 Full name from profile:', profile?.fullName);
      setUserProfile(profile);
      
      // Update userFullName if we got it from the profile
      if (profile?.fullName) {
        setUserFullName(profile.fullName);
      }
      
      // Wait a bit before fetching family members to avoid overwhelming Render
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch family members sequentially after profile loads
      console.log('🔍 Now fetching family members...');
      await fetchFamilyMembers(userIdToFetch);
      
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      
      // Use error helper for user-friendly messages
      const errorInfo = APIErrorHelper.getUserFriendlyMessage(error);
      APIErrorHelper.logError('UserHome.fetchUserProfile', error);
      
      // Show appropriate error message
      Alert.alert(
        errorInfo.title,
        errorInfo.message,
        errorInfo.canRetry ? [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => fetchUserProfile(userIdToFetch) }
        ] : [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFamilyMembers = async (userIdToFetch = userId) => {
    try {
      console.log('🔍 Fetching family members for userId:', userIdToFetch);
      const members = await UserAPIService.getFamilyMembers(userIdToFetch);
      console.log('✅ Family members received:', members?.length || 0);
      setFamilyMembers(members || []);
    } catch (error) {
      console.log('⚠️ Failed to fetch family members:', error.message);
      // Don't show alert for family members error - it's not critical
      setFamilyMembers([]);
    }
  };
  
  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    
    try {
      const payload = {
        name: newMemberName.trim(),
        age: newMemberAge ? parseInt(newMemberAge, 10) : null,
        relationship: newMemberRelationship.trim(),
        gender: newMemberGender.trim(),
        contact: newMemberContact.trim(),
      };
      
      await UserAPIService.createFamilyMember(userId, payload);
      await fetchFamilyMembers();
      
      // Clear form
      setNewMemberName('');
      setNewMemberAge('');
      setNewMemberRelationship('');
      setNewMemberGender('');
      setNewMemberContact('');
      setShowAddMemberModal(false);
      
      Alert.alert('Success', 'Family member added successfully');
    } catch (error) {
      console.error('Failed to add family member:', error);
      Alert.alert('Error', 'Failed to add family member');
    }
  };
  
  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowViewMemberModal(true);
  };
  
  const handleBookForMember = () => {
    setShowViewMemberModal(false);
    navigation.navigate('BookAppointment', { 
      userId,
      familyMemberId: selectedMember?.id,
      familyMemberName: selectedMember?.name
    });
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    console.log('🔄 Manual refresh triggered');
    // Sequential refresh to avoid overwhelming the server
    await fetchUserProfile();
    // Small delay before triggering appointments refresh
    await new Promise(resolve => setTimeout(resolve, 200));
    // Trigger appointments refresh by incrementing the trigger
    setAppointmentsRefreshTrigger(prev => prev + 1);
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

  const contactDevelopers = () => {
    const email = 'developers.neextapp@gmail.com';
    const subject = 'Feedback from Neext App User';
    const body = `Hello Neext App Developers,

I am writing to provide feedback about the Neext App.

User Type: User
Mobile: ${userProfile?.mobileNumber || 'N/A'}

My feedback/issue:
[Please describe your feedback or issue here]



Best regards,
${userProfile?.fullName || 'Neext App User'}`;

    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailto).catch(err => {
      Alert.alert('Error', 'Could not open email app. Please ensure you have an email app installed.');
      console.error('Error opening email:', err);
    });
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

        {/* Family Members Section */}
        <View style={styles.familySection}>
          <Text style={styles.familySectionTitle}>Family</Text>
          <View style={styles.familyScrollContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true} 
              style={styles.familyScrollView}
              contentContainerStyle={styles.familyScrollContent}
            >
              {/* You - Profile Icon */}
              <TouchableOpacity 
                style={styles.familyMemberCircle}
                onPress={() => navigation.navigate('UserProfile', { userId })}
              >
                <View style={styles.circleIconContainer}>
                  <Text style={styles.circleIcon}>👤</Text>
                </View>
                <Text style={styles.familyMemberName}>You</Text>
              </TouchableOpacity>
              
              {/* Existing Family Members */}
              {familyMembers.map((member) => (
                <TouchableOpacity 
                  key={member.id}
                  style={styles.familyMemberCircle}
                  onPress={() => handleViewMember(member)}
                >
                  <View style={styles.circleIconContainer}>
                    <Text style={styles.circleIcon}>👤</Text>
                  </View>
                  <Text style={styles.familyMemberName} numberOfLines={1}>
                    {member.name}
                  </Text>
                </TouchableOpacity>
              ))}
              
              {/* Add New Member - Inline (when 2 or fewer members) */}
              {familyMembers.length <= 2 && (
                <TouchableOpacity 
                  style={styles.familyMemberCircle}
                  onPress={() => setShowAddMemberModal(true)}
                >
                  <View style={[styles.circleIconContainer, styles.addCircle]}>
                    <Text style={styles.addIcon}>+</Text>
                  </View>
                  <Text style={styles.familyMemberName}>Add</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            
            {/* Add New Member - Fixed to Right (when more than 2 members) */}
            {familyMembers.length > 2 && (
              <TouchableOpacity 
                style={styles.familyAddButtonFixed}
                onPress={() => setShowAddMemberModal(true)}
              >
                <View style={[styles.circleIconContainer, styles.addCircle]}>
                  <Text style={styles.addIcon}>+</Text>
                </View>
                <Text style={styles.familyMemberName}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
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

        {/* Contact Developers Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity 
            style={styles.contactCard}
            onPress={contactDevelopers}
          >
            <Text style={styles.contactIcon}>📧</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Contact Developers</Text>
              <Text style={styles.contactDescription}>
                Send feedback or report issues to our development team
              </Text>
            </View>
            <Text style={styles.contactArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing for Navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Add Family Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Family Member</Text>
              <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name"
                value={newMemberName}
                onChangeText={setNewMemberName}
              />
              
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter age"
                value={newMemberAge}
                onChangeText={setNewMemberAge}
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Relationship</Text>
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowRelationshipPicker(true)}
              >
                <Text style={newMemberRelationship ? styles.inputText : styles.placeholderText}>
                  {newMemberRelationship || 'Select relationship'}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.inputLabel}>Gender</Text>
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowGenderPicker(true)}
              >
                <Text style={newMemberGender ? styles.inputText : styles.placeholderText}>
                  {newMemberGender || 'Select gender'}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.inputLabel}>Contact</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                value={newMemberContact}
                onChangeText={setNewMemberContact}
                keyboardType="phone-pad"
              />
              
              <View style={styles.modalContentSpacing} />
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddMember}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <TouchableOpacity 
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Gender</Text>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.pickerOption}
                onPress={() => {
                  setNewMemberGender(option);
                  setShowGenderPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Relationship Picker Modal */}
      <Modal
        visible={showRelationshipPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRelationshipPicker(false)}
      >
        <TouchableOpacity 
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowRelationshipPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Relationship</Text>
            <ScrollView style={styles.pickerScrollView}>
              {relationshipOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.pickerOption}
                  onPress={() => {
                    setNewMemberRelationship(option);
                    setShowRelationshipPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* View/Edit Family Member Modal */}
      <Modal
        visible={showViewMemberModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowViewMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Family Member Details</Text>
              <TouchableOpacity onPress={() => setShowViewMemberModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.memberDetailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{selectedMember?.name}</Text>
              </View>
              
              {selectedMember?.age && (
                <View style={styles.memberDetailRow}>
                  <Text style={styles.detailLabel}>Age:</Text>
                  <Text style={styles.detailValue}>{selectedMember.age}</Text>
                </View>
              )}
              
              {selectedMember?.relationship && (
                <View style={styles.memberDetailRow}>
                  <Text style={styles.detailLabel}>Relationship:</Text>
                  <Text style={styles.detailValue}>{selectedMember.relationship}</Text>
                </View>
              )}
              
              {selectedMember?.gender && (
                <View style={styles.memberDetailRow}>
                  <Text style={styles.detailLabel}>Gender:</Text>
                  <Text style={styles.detailValue}>{selectedMember.gender}</Text>
                </View>
              )}
              
              {selectedMember?.contact && (
                <View style={styles.memberDetailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{selectedMember.contact}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.bookButton]}
                onPress={handleBookForMember}
              >
                <Text style={styles.bookButtonText}>📅 Book Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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
  // Contact Developers Section Styles
  contactSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e8f4fd',
  },
  contactIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  contactArrow: {
    fontSize: 18,
    color: '#3498db',
    fontWeight: 'bold',
  },
  // Family Members Section Styles
  familySection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  familySectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  familyScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  familyScrollView: {
    flexDirection: 'row',
    flex: 1,
  },
  familyScrollContent: {
    paddingRight: 10,
  },
  familyMemberCircle: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  familyAddButtonFixed: {
    alignItems: 'center',
    marginLeft: 10,
    width: 70,
  },
  circleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addCircle: {
    backgroundColor: '#3498db',
  },
  circleIcon: {
    fontSize: 28,
  },
  addIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  familyMemberName: {
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#7f8c8d',
    fontWeight: '300',
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  inputText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  placeholderText: {
    fontSize: 16,
    color: '#95a5a6',
  },
  modalContentSpacing: {
    height: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: '#27ae60',
    flex: 1,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  memberDetailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    width: 120,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  // Picker Modal Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    padding: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerScrollView: {
    maxHeight: 300,
  },
  pickerOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
});
