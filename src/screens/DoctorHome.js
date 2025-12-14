import React, {useEffect, useState, useRef} from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { format } from 'date-fns';

// Import components
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import TodaySchedule from '../components/TodaySchedule';
import BottomNavigation from '../components/BottomNavigation';

// Import services
import { DoctorAPIService, UserAPIService, AuthAPIService } from '../services/doctorApiService';
import api from '../services/api';

// Time options for dropdowns
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12 for 12-hour format
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i); // 0-59 for minutes

// Predefined cancellation reasons for doctors
const DOCTOR_CANCEL_REASONS = [
  'Patient rescheduled',
  'Doctor emergency',
  'Medical emergency elsewhere',
  'Equipment unavailable',
  'Patient no-show',
  'Administrative error',
  'Health concerns',
  'Other'
];

export default function DoctorHome({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [historyAppointments, setHistoryAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [workplaces, setWorkplaces] = useState([]);
  const [appointmentsByWorkplace, setAppointmentsByWorkplace] = useState([]);
  const [dailyStatus, setDailyStatus] = useState(null);
  const [selectedWorkplace, setSelectedWorkplace] = useState(null);
  const [name, setName] = useState('');
  const [doctorId, setDoctorId] = useState(null);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [cancelDayModalVisible, setCancelDayModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [upcomingModalVisible, setUpcomingModalVisible] = useState(false);
  const [userDetailsModalVisible, setUserDetailsModalVisible] = useState(false);
  const [workplaceModalVisible, setWorkplaceModalVisible] = useState(false);
  const [todayScheduleExpanded, setTodayScheduleExpanded] = useState(true);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [shiftMinutes, setShiftMinutes] = useState('');
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancelReasonModalVisible, setCancelReasonModalVisible] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('appointments');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [historyFromDate, setHistoryFromDate] = useState(null);
  const [historyToDate, setHistoryToDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [todayStats, setTodayStats] = useState({ total: 0, completed: 0, upcoming: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Refs for cancel reason modal
  const cancelModalScrollRef = useRef(null);
  const customCancelReasonInputRef = useRef(null);
  
  // Profile related states
  const [detailedProfile, setDetailedProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [showAllWorkplaces, setShowAllWorkplaces] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [addWorkplaceModalVisible, setAddWorkplaceModalVisible] = useState(false);
  const [editWorkplaceModalVisible, setEditWorkplaceModalVisible] = useState(false);
  const [selectedWorkplaceForEdit, setSelectedWorkplaceForEdit] = useState(null);
  const [timeDropdownVisible, setTimeDropdownVisible] = useState({});
  const [newWorkplaceTimeDropdownVisible, setNewWorkplaceTimeDropdownVisible] = useState({});
  const [newWorkplace, setNewWorkplace] = useState({
    workplaceName: '',
    workplaceType: 'CLINIC',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    contactNumber: '',
    morningStartHours: '09',
    morningStartMinutes: '00',
    morningEndHours: '13',
    morningEndMinutes: '00',
    eveningStartHours: '15',
    eveningStartMinutes: '00',
    eveningEndHours: '19',
    eveningEndMinutes: '00',
    checkingDurationMinutes: 15,
    isPrimary: false
  });



  // Add a ref to track if we're already handling auth error
  const authErrorHandling = React.useRef(false);

  // Helper function to handle authentication errors
  const handleAuthError = (error) => {
    if (error.response?.status === 401 || error.authCleared) {
      const errorMessage = error.response?.data?.error;
      
      if (errorMessage === 'Token has been invalidated' || errorMessage === 'Invalid token' || errorMessage === 'Token expired' || error.authCleared) {
        // Prevent multiple auth error dialogs
        if (authErrorHandling.current) {
          console.log('Auth error already being handled, skipping duplicate');
          return true;
        }
        
        authErrorHandling.current = true;
        console.log('Token invalidated, redirecting to login');
        
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'OK', onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          }}],
          { cancelable: false }
        );
        return true; // Indicates auth error was handled
      }
    }
    return false; // Not an auth error
  };

  // Check if current user is admin
  const checkAdminAccess = async () => {
    try {
      const ADMIN_MOBILE = '8790672731';
      const userMobile = await SecureStore.getItemAsync('mobile');
      
      if (userMobile === ADMIN_MOBILE) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    }
  };

  useEffect(()=> {
    loadData();
    checkAdminAccess(); // Check admin access on mount
  }, []);

  // Auto-refresh when screen comes into focus (after returning from other screens)
  useFocusEffect(
    React.useCallback(() => {
      console.log('DoctorHome screen focused - refreshing data...');
      if (doctorId) {
        // Refresh key data without full reload
        Promise.all([
          fetchTodayAppointments(doctorId),
          fetchRecentHistory(doctorId),
          fetchUpcomingAppointments(doctorId),
          fetchWorkplaces(doctorId)
        ]).then(() => {
          fetchTodayStats(doctorId);
        }).catch(error => {
          console.log('Error refreshing data:', error);
        });
      }
    }, [doctorId])
  );

  // Check authentication status periodically
  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        // Token was cleared (likely due to invalidation), navigate to login
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      }
    };

    // Check immediately and then every 5 seconds
    checkAuth();
    const interval = setInterval(checkAuth, 5000);
    
    return () => clearInterval(interval);
  }, [navigation]);

  const loadData = async () => {
    try {
      const n = await SecureStore.getItemAsync('fullName');
      const id = await SecureStore.getItemAsync('userId');
      setName(n || 'Doctor');
      setDoctorId(id);
      
      if (id) {
        await Promise.all([
          fetchTodayAppointments(id),
          fetchRecentHistory(id),
          fetchUpcomingAppointments(id),
          fetchDoctorProfile(),
          fetchDetailedProfile(id)
        ]);
        
        // Calculate stats and set workplaces after profile is loaded
        fetchTodayStats(id);
        fetchWorkplaces(id);
      }
    } catch (e) {
      console.log('load data err', e.message);
      // Handle authentication errors
      if (handleAuthError(e)) {
        return;
      }
    }
  };

  const fetchTodayAppointments = async (id) => {
    try {
      const data = await DoctorAPIService.fetchTodayAppointments(id);
      setAppointments(data);
    } catch (e) {
      console.log('fetch appts err', e.message);
      // Handle authentication errors
      if (handleAuthError(e)) {
        return;
      }
    }
  };

  const fetchRecentHistory = async (id) => {
    try {
      const data = await DoctorAPIService.fetchAppointmentHistory(id);
      setHistoryAppointments(data);
    } catch (e) {
      console.log('fetch history err', e.message);
      // Handle authentication errors
      if (handleAuthError(e)) {
        return;
      }
    }
  };

  const fetchUpcomingAppointments = async (id) => {
    try {
      const data = await DoctorAPIService.fetchUpcomingAppointments(id);
      setUpcomingAppointments(data);
    } catch (e) {
      console.log('fetch upcoming err', e.message);
      // Handle authentication errors
      if (handleAuthError(e)) {
        return;
      }
    }
  };

  const fetchTodayStats = async (id) => {
    try {
      // Calculate stats from the appointments data instead of API call
      const stats = {
        total: appointments.length || 0,
        completed: appointments.filter(apt => apt.status === 'COMPLETED').length || 0,
        upcoming: appointments.filter(apt => apt.status === 'BOOKED').length || 0
      };
      setTodayStats(stats);
      setDailyStatus(stats);
    } catch (error) {
      console.log('Error calculating today stats:', error.message);
      // Set default stats if calculation fails
      const stats = {
        total: 0,
        completed: 0,
        upcoming: 0
      };
      setTodayStats(stats);
    }
  };

  const fetchWorkplaces = async (id) => {
    try {
      const data = await DoctorAPIService.fetchWorkplacesWithCounts(id);
      // console.log('Workplaces with appointment counts:', data);
      setWorkplaces(data);
    } catch (error) {
      console.error('Error fetching workplaces:', error.message);
      // Handle authentication errors
      if (handleAuthError(error)) {
        return;
      }
      setWorkplaces([]);
    }
  };

  const fetchAppointmentsByWorkplace = async (workplaceId) => {
    try {
      const data = await DoctorAPIService.fetchAppointmentsByWorkplace(doctorId, workplaceId);
      setAppointmentsByWorkplace(data);
      setWorkplaceModalVisible(true);
    } catch (error) {
      console.log('Error fetching appointments by workplace:', error.message);
      
      // Handle authentication errors
      if (handleAuthError(error)) {
        return;
      }
      
      setAppointmentsByWorkplace([]);
      setWorkplaceModalVisible(true);
    }
  };

  const fetchDoctorProfile = async () => {
    try {
      const response = await api.get('/api/doctor/profile');
      setDoctorProfile(response.data);
    } catch (error) {
      console.log('Error fetching doctor profile:', error.message);
    }
  };

  const fetchDetailedProfile = async (doctorId) => {
    try {
      setProfileLoading(true);
      const profile = await DoctorAPIService.fetchDetailedDoctorProfile(doctorId);
      setDetailedProfile(profile);
      setEditedProfile({ ...profile }); // Initialize edited profile
    } catch (error) {
      console.log('Error fetching detailed profile:', error.message);
      // Handle authentication errors
      if (handleAuthError(error)) {
        return;
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await api.put(`/api/appointments/${appointmentId}/status`, { status });
      // Refresh the appointments
      if (selectedWorkplace?.id) {
        await fetchAppointmentsByWorkplace(selectedWorkplace.id);
      }
      // Refresh today's stats
      await fetchTodayStats(doctorId);
    } catch (error) {
      console.log('Error updating appointment status:', error.message);
      
      // Handle authentication errors
      if (handleAuthError(error)) {
        return;
      }
      
      Alert.alert('Error', 'Failed to update appointment status');
    }
  };

  const handleWorkplaceTilePress = (workplace) => {
    setSelectedWorkplace(workplace);
    fetchAppointmentsByWorkplace(workplace.id);
  };

  const handleViewAppointments = (workplace) => {
    // Navigate to appointments page showing today's and upcoming appointments
    navigation.navigate('AllBookings', { 
      doctorId, 
      workplaceId: workplace.id,
      workplaceName: workplace.workplaceName 
    });
  };

  const handleQuickBookingQR = () => {
    navigation.navigate('QuickBookingQR', { doctorId });
  };

  const handleFCMTest = () => {
    navigation.navigate('FCMTest');
  };

  const fetchUserDetails = async (userId) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/user/${userId}`);
      setSelectedUser(res.data);
      setUserDetailsModalVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch user details: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationComplete = async () => {
    try {
      const profile = await api.get('/api/doctor/profile');
      // Remove the registration modal logic
    } catch (e) {
      console.log('registration check err', e.message);
    }
  };

  const updateDoctorProfile = async (updatedData) => {
    try {
      const response = await api.put('/api/doctor/profile', updatedData);
      setDoctorProfile(response.data);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLogout = async () => {
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

  const handleSaveProfile = async () => {
    try {
      setProfileLoading(true);
      
      // Prepare the data to send - only include changed fields
      const dataToSave = {};
      
      // Check if personal details changed
      if (editedProfile.fullName !== detailedProfile.fullName) {
        dataToSave.fullName = editedProfile.fullName;
      }
      if (editedProfile.email !== detailedProfile.email) {
        dataToSave.email = editedProfile.email;
      }
      if (editedProfile.specialization !== detailedProfile.specialization) {
        dataToSave.specialization = editedProfile.specialization;
      }
      if (editedProfile.designation !== detailedProfile.designation) {
        dataToSave.designation = editedProfile.designation;
      }
      if (editedProfile.address !== detailedProfile.address) {
        dataToSave.address = editedProfile.address;
      }
      if (editedProfile.city !== detailedProfile.city) {
        dataToSave.city = editedProfile.city;
      }
      if (editedProfile.state !== detailedProfile.state) {
        dataToSave.state = editedProfile.state;
      }
      if (editedProfile.pincode !== detailedProfile.pincode) {
        dataToSave.pincode = editedProfile.pincode;
      }
      if (editedProfile.country !== detailedProfile.country) {
        dataToSave.country = editedProfile.country;
      }

      // Check if workplaces changed
      const changedWorkplaces = [];
      editedProfile.workplaces?.forEach((editedWorkplace, index) => {
        const originalWorkplace = detailedProfile.workplaces?.[index];
        if (originalWorkplace) {
          const workplaceChanges = { id: originalWorkplace.id };
          let hasChanges = false;
          
          // Check each workplace field
          Object.keys(editedWorkplace).forEach(key => {
            if (key !== 'id' && editedWorkplace[key] !== originalWorkplace[key]) {
              workplaceChanges[key] = editedWorkplace[key];
              hasChanges = true;
            }
          });
          
          if (hasChanges) {
            changedWorkplaces.push(workplaceChanges);
          }
        }
      });

      if (changedWorkplaces.length > 0) {
        dataToSave.workplaces = changedWorkplaces;
      }

      // Only make API call if there are changes
      if (Object.keys(dataToSave).length === 0) {
        Alert.alert('No Changes', 'No changes detected to save.');
        setEditingProfile(false);
        return;
      }

      await DoctorAPIService.editDoctorProfile(doctorId, dataToSave);
      
      // Refresh the profile data
      await fetchDetailedProfile(doctorId);
      
      setEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully!');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddWorkplace = async () => {
    try {
      // Validate required fields
      if (!newWorkplace.workplaceName || !newWorkplace.workplaceName.trim()) {
        Alert.alert('Validation Error', 'Workplace name is required');
        return;
      }
      if (!newWorkplace.address || !newWorkplace.address.trim()) {
        Alert.alert('Validation Error', 'Address is required');
        return;
      }
      if (!newWorkplace.checkingDurationMinutes || newWorkplace.checkingDurationMinutes <= 0) {
        Alert.alert('Validation Error', 'Valid checking duration is required');
        return;
      }

      setProfileLoading(true);
      
      // Format the workplace data with proper time formatting - exclude UI-specific fields
      const formattedWorkplace = {
        workplaceName: newWorkplace.workplaceName,
        workplaceType: newWorkplace.workplaceType,
        address: newWorkplace.address,
        city: newWorkplace.city,
        state: newWorkplace.state,
        pincode: newWorkplace.pincode,
        country: newWorkplace.country,
        contactNumber: newWorkplace.contactNumber,
        morningStartTime: combineTimeComponents(newWorkplace.morningStartHours, newWorkplace.morningStartMinutes),
        morningEndTime: combineTimeComponents(newWorkplace.morningEndHours, newWorkplace.morningEndMinutes),
        eveningStartTime: combineTimeComponents(newWorkplace.eveningStartHours, newWorkplace.eveningStartMinutes),
        eveningEndTime: combineTimeComponents(newWorkplace.eveningEndHours, newWorkplace.eveningEndMinutes),
        checkingDurationMinutes: newWorkplace.checkingDurationMinutes,
        isPrimary: newWorkplace.isPrimary
      };
      
      // console.log('Raw newWorkplace state:', JSON.stringify(newWorkplace, null, 2));
      // console.log('Formatted workplace data:', JSON.stringify(formattedWorkplace, null, 2));
      
      // Additional validation logs
      // console.log('Validation checks:');
      // console.log('- workplaceName:', `"${formattedWorkplace.workplaceName}"`, 'length:', formattedWorkplace.workplaceName?.length);
      // console.log('- address:', `"${formattedWorkplace.address}"`, 'length:', formattedWorkplace.address?.length);
      // console.log('- checkingDurationMinutes:', formattedWorkplace.checkingDurationMinutes, 'type:', typeof formattedWorkplace.checkingDurationMinutes);
      
      await DoctorAPIService.addWorkplace(doctorId, formattedWorkplace);
      
      // Refresh the profile data
      await fetchDetailedProfile(doctorId);
      
      // Reset form and close modal
      setNewWorkplace({
        workplaceName: '',
        workplaceType: 'CLINIC',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: '',
        contactNumber: '',
        morningStartHours: '09',
        morningStartMinutes: '00',
        morningEndHours: '13',
        morningEndMinutes: '00',
        eveningStartHours: '15',
        eveningStartMinutes: '00',
        eveningEndHours: '19',
        eveningEndMinutes: '00',
        checkingDurationMinutes: 15,
        isPrimary: false
      });
      setAddWorkplaceModalVisible(false);
      closeAllTimeDropdowns();
      
      Alert.alert('Success', 'Workplace added successfully!');
      
    } catch (error) {
      console.error('Error adding workplace:', error);
      Alert.alert('Error', 'Failed to add workplace. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEditWorkplace = async () => {
    try {
      if (!selectedWorkplaceForEdit) {
        Alert.alert('Error', 'No workplace selected for editing');
        return;
      }

      // Validate required fields
      if (!selectedWorkplaceForEdit.workplaceName.trim()) {
        Alert.alert('Validation Error', 'Workplace name is required');
        return;
      }
      if (!selectedWorkplaceForEdit.address.trim()) {
        Alert.alert('Validation Error', 'Address is required');
        return;
      }

      setProfileLoading(true);
      
      // Find the original workplace to compare changes
      const originalWorkplace = detailedProfile.workplaces.find(wp => wp.id === selectedWorkplaceForEdit.id);
      
      // Prepare workplace data with proper time formatting and fallbacks
      const formattedWorkplace = {
        ...selectedWorkplaceForEdit,
        // Combine hour and minute components
        morningStartTime: combineTimeComponents(
          selectedWorkplaceForEdit.morningStartHours || originalWorkplace?.morningStartTime?.split(':')[0] || '09',
          selectedWorkplaceForEdit.morningStartMinutes || originalWorkplace?.morningStartTime?.split(':')[1] || '00'
        ),
        morningEndTime: combineTimeComponents(
          selectedWorkplaceForEdit.morningEndHours || originalWorkplace?.morningEndTime?.split(':')[0] || '13',
          selectedWorkplaceForEdit.morningEndMinutes || originalWorkplace?.morningEndTime?.split(':')[1] || '00'
        ),
        eveningStartTime: combineTimeComponents(
          selectedWorkplaceForEdit.eveningStartHours || originalWorkplace?.eveningStartTime?.split(':')[0] || '15',
          selectedWorkplaceForEdit.eveningStartMinutes || originalWorkplace?.eveningStartTime?.split(':')[1] || '00'
        ),
        eveningEndTime: combineTimeComponents(
          selectedWorkplaceForEdit.eveningEndHours || originalWorkplace?.eveningEndTime?.split(':')[0] || '19',
          selectedWorkplaceForEdit.eveningEndMinutes || originalWorkplace?.eveningEndTime?.split(':')[1] || '00'
        )
      };
      
      await DoctorAPIService.editWorkplace(doctorId, formattedWorkplace);
      
      // Refresh the profile data
      await fetchDetailedProfile(doctorId);
      
      setEditWorkplaceModalVisible(false);
      setSelectedWorkplaceForEdit(null);
      
      Alert.alert('Success', 'Workplace updated successfully!');
      
    } catch (error) {
      console.error('Error editing workplace:', error);
      Alert.alert('Error', 'Failed to update workplace. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Format time for display (e.g., "09:30" -> "9:30 AM")
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    
    // Handle both string and non-string inputs
    const timeStr = String(timeString);
    
    try {
      // Handle different time formats
      if (timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        if (hours && minutes) {
          const hour = parseInt(hours);
          const min = minutes.length === 1 ? `0${minutes}` : minutes.substring(0, 2);
          
          if (hour >= 0 && hour <= 23) {
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${min} ${ampm}`;
          }
        }
      }
      
      // If it's just a number, treat as hour
      const hour = parseInt(timeStr);
      if (!isNaN(hour) && hour >= 0 && hour <= 23) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${ampm}`;
      }
      
      // Return original if we can't parse it
      return timeStr;
    } catch (error) {
      console.log('Error formatting time:', error, 'Input:', timeString);
      return String(timeString) || 'N/A';
    }
  };

  // Convert time to input format for editing (e.g., "9:00 AM" -> "09 : 00", "14:30:00" -> "14 : 30")
  const formatTimeForInput = (timeString) => {
    if (!timeString) return '';
    
    const timeStr = String(timeString).trim();
    
    // If it's already in HH:mm format, convert to spaced format
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(':');
      return `${hours} : ${minutes}`;
    }
    
    // If it's in HH:mm:ss format, return just HH : mm part
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.substring(0, 5).split(':');
      return `${hours} : ${minutes}`;
    }
    
    // If it's in H:mm format, pad the hour and add spaces
    if (/^\d{1}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(':');
      return `0${hours} : ${minutes}`;
    }
    
    // If it contains AM/PM, convert to 24-hour format with spaces
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      try {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        const min = minutes || '00';
        
        if (period === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period === 'AM' && hour === 12) {
          hour = 0;
        }
        
        return `${hour.toString().padStart(2, '0')} : ${min.padStart(2, '0')}`;
      } catch (error) {
        console.log('Error converting AM/PM time:', error);
        return '';
      }
    }
    
    // If it's just a number, treat as hour
    const hour = parseInt(timeStr);
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
      return `${hour.toString().padStart(2, '0')} : 00`;
    }
    
    return '';
  };

  // Handle hour input (0-23) - More flexible for editing
  const handleHourInput = (text) => {
    if (!text) return '';
    
    // Allow only numbers
    const numericText = String(text).replace(/[^0-9]/g, '');
    
    // If empty after cleaning, return empty
    if (numericText === '') return '';
    
    // If single digit, allow it as-is
    if (numericText.length === 1) {
      const digit = parseInt(numericText);
      if (digit >= 0 && digit <= 2) {
        return numericText; // Don't auto-pad single digits
      }
      return numericText;
    }
    
    // If two digits, validate range
    if (numericText.length === 2) {
      const hour = parseInt(numericText);
      if (hour >= 0 && hour <= 23) {
        return numericText;
      }
      // If invalid, keep first digit only
      return numericText.substring(0, 1);
    }
    
    // If more than 2 digits, keep first 2
    const firstTwo = numericText.substring(0, 2);
    const hour = parseInt(firstTwo);
    if (hour >= 0 && hour <= 23) {
      return firstTwo;
    }
    return numericText.substring(0, 1);
  };

  // Handle minute input (0-59) - More flexible for editing
  const handleMinuteInput = (text) => {
    if (!text) return '';
    
    // Allow only numbers
    const numericText = String(text).replace(/[^0-9]/g, '');
    
    // If empty after cleaning, return empty
    if (numericText === '') return '';
    
    // If single digit, allow it as-is
    if (numericText.length === 1) {
      return numericText; // Don't auto-pad single digits
    }
    
    // If two digits, validate range
    if (numericText.length === 2) {
      const minute = parseInt(numericText);
      if (minute >= 0 && minute <= 59) {
        return numericText;
      }
      // If invalid, keep first digit only
      return numericText.substring(0, 1);
    }
    
    // If more than 2 digits, keep first 2
    const firstTwo = numericText.substring(0, 2);
    const minute = parseInt(firstTwo);
    if (minute >= 0 && minute <= 59) {
      return firstTwo;
    }
    return numericText.substring(0, 1);
  };

  // Parse time string into separate hours and minutes
  const parseTimeToComponents = (timeString) => {
    try {
      console.log('🕐 Parsing time:', timeString, 'Type:', typeof timeString, 'IsArray:', Array.isArray(timeString));
      
      // Handle null, undefined, or empty values
      if (timeString === null || timeString === undefined || timeString === '') {
        console.log('❌ Null/undefined/empty timeString, using defaults');
        return { hours: '09', minutes: '00' };
      }
      
      // Handle array format [hour, minute] from API
      if (Array.isArray(timeString) && timeString.length >= 2) {
        const hours = timeString[0].toString().padStart(2, '0');
        const minutes = timeString[1].toString().padStart(2, '0');
        const result = { hours, minutes };
        console.log('✅ Array format result:', result);
        return result;
      }
      
      // Convert to string if it's not already
      const timeStr = String(timeString);
      console.log('📝 String conversion:', timeStr);
      
      const cleanTime = timeStr.replace(/\s+/g, '').trim();
      console.log('🧹 Clean time:', cleanTime);
      
      // Handle HH:mm:ss format (e.g., "14:30:00")
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(cleanTime)) {
        const [hours, minutes] = cleanTime.split(':');
        const result = { 
          hours: hours.padStart(2, '0'), 
          minutes: minutes.padStart(2, '0') 
        };
        console.log('✅ Format HH:mm:ss result:', result);
        return result;
      }
      
      // Handle HH:mm format (e.g., "14:30")
      if (/^\d{2}:\d{2}$/.test(cleanTime)) {
        const [hours, minutes] = cleanTime.split(':');
        const result = { hours: hours, minutes: minutes };
        console.log('✅ Format HH:mm result:', result);
        return result;
      }
      
      // Handle H:mm format (e.g., "9:30")
      if (/^\d{1}:\d{2}$/.test(cleanTime)) {
        const [hours, minutes] = cleanTime.split(':');
        const result = { 
          hours: hours.padStart(2, '0'), 
          minutes: minutes 
        };
        console.log('✅ Format H:mm result:', result);
        return result;
      }
      
      // Handle H:m format (e.g., "9:5")
      if (/^\d{1,2}:\d{1}$/.test(cleanTime)) {
        const [hours, minutes] = cleanTime.split(':');
        const result = { 
          hours: hours.padStart(2, '0'), 
          minutes: minutes.padStart(2, '0') 
        };
        console.log('✅ Format H:m result:', result);
        return result;
      }
      
      // Handle just hour number (e.g., "14")
      if (/^\d{1,2}$/.test(cleanTime)) {
        const result = { hours: cleanTime.padStart(2, '0'), minutes: '00' };
        console.log('✅ Format H result:', result);
        return result;
      }
      
      // Handle time with AM/PM
      if (cleanTime.toLowerCase().includes('am') || cleanTime.toLowerCase().includes('pm')) {
        const isPM = cleanTime.toLowerCase().includes('pm');
        const timeOnly = cleanTime.replace(/(am|pm)/gi, '').trim();
        
        if (/^\d{1,2}:\d{2}$/.test(timeOnly)) {
          let [hours, minutes] = timeOnly.split(':');
          let hourNum = parseInt(hours);
          
          if (isPM && hourNum !== 12) hourNum += 12;
          if (!isPM && hourNum === 12) hourNum = 0;
          
          const result = { 
            hours: hourNum.toString().padStart(2, '0'), 
            minutes: minutes 
          };
          console.log('✅ Format AM/PM result:', result);
          return result;
        }
      }
      
      console.log('❌ No format matched for:', cleanTime, 'using defaults');
      return { hours: '09', minutes: '00' };
    } catch (error) {
      console.log('💥 Error parsing time components:', error, 'Input:', timeString);
      return { hours: '09', minutes: '00' };
    }
  };

  // Toggle dropdown visibility for time inputs
  const toggleTimeDropdown = (timeType, timeField) => {
    const key = `${timeType}_${timeField}`;
    setTimeDropdownVisible(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle dropdown visibility for new workplace time inputs
  const toggleTimeDropdownForNew = (timeType, timeField) => {
    const key = `${timeType}_${timeField}`;
    setNewWorkplaceTimeDropdownVisible(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Close all time dropdowns
  const closeAllTimeDropdowns = () => {
    setTimeDropdownVisible({});
    setNewWorkplaceTimeDropdownVisible({});
  };

  // Convert 12-hour format to 24-hour format for storage
  const convertTo24Hour = (hour12, timeType) => {
    let hour24 = parseInt(hour12);
    
    // Morning hours: 9 AM - 1 PM (9-13 in 24-hour format)
    if (timeType.includes('morning')) {
      if (hour24 === 12) {
        hour24 = 12; // 12 PM
      } else if (hour24 >= 1 && hour24 <= 11) {
        hour24 = hour24; // 9 AM, 10 AM, 11 AM stay same, 1 PM stays 1
      }
    }
    // Evening hours: 3 PM - 8 PM (15-20 in 24-hour format) 
    else if (timeType.includes('evening')) {
      if (hour24 >= 1 && hour24 <= 11) {
        hour24 = hour24 + 12; // Add 12 for PM hours
      } else if (hour24 === 12) {
        hour24 = 12; // 12 PM stays 12
      }
    }
    
    return String(hour24).padStart(2, '0');
  };

  // Convert 24-hour format to 12-hour format for display
  const convertTo12Hour = (hour24) => {
    const hour = parseInt(hour24);
    if (hour === 0) return 12;
    if (hour <= 12) return hour;
    return hour - 12;
  };

  // Handle time selection from dropdown
  const handleTimeSelection = (timeType, timeField, value) => {
    if (timeType === 'duration' && timeField === 'minutes') {
      // Handle duration selection
      setSelectedWorkplaceForEdit(prev => ({
        ...prev,
        checkingDurationMinutes: value
      }));
    } else {
      // Handle time selection
      if (timeField === 'hour') {
        // Convert 12-hour to 24-hour format for storage
        const hour24 = convertTo24Hour(value, timeType);
        setSelectedWorkplaceForEdit(prev => ({
          ...prev,
          [`${timeType}Hours`]: hour24
        }));
      } else {
        const formattedValue = String(value).padStart(2, '0');
        setSelectedWorkplaceForEdit(prev => ({
          ...prev,
          [`${timeType}Minutes`]: formattedValue
        }));
      }
    }
    
    // Close the dropdown
    const key = `${timeType}_${timeField}`;
    setTimeDropdownVisible(prev => ({
      ...prev,
      [key]: false
    }));
  };

  // Handle time selection from dropdown for new workplace
  const handleTimeSelectionForNew = (timeType, timeField, value) => {
    if (timeType === 'duration' && timeField === 'minutes') {
      // Handle duration selection
      setNewWorkplace(prev => ({
        ...prev,
        checkingDurationMinutes: value
      }));
    } else {
      // Handle time selection
      if (timeField === 'hour') {
        // Convert 12-hour to 24-hour format for storage
        const hour24 = convertTo24Hour(value, timeType);
        setNewWorkplace(prev => ({
          ...prev,
          [`${timeType}Hours`]: hour24
        }));
      } else {
        const formattedValue = String(value).padStart(2, '0');
        setNewWorkplace(prev => ({
          ...prev,
          [`${timeType}Minutes`]: formattedValue
        }));
      }
    }
    
    // Close the dropdown
    const key = `${timeType}_${timeField}`;
    setNewWorkplaceTimeDropdownVisible(prev => ({
      ...prev,
      [key]: false
    }));
  };

  // Combine hours and minutes into time string for API
  const combineTimeComponents = (hours, minutes) => {
    const h = String(hours || '09').padStart(2, '0');
    const m = String(minutes || '00').padStart(2, '0');
    return `${h}:${m}`;
  };

  // Format time input to proper API format (e.g., "09 : 30" -> "09:30", "9 : " -> "09:00")
  const formatTimeForAPI = (timeString) => {
    if (!timeString || typeof timeString !== 'string' || timeString.trim() === '') return '09:00';
    
    // Remove all spaces and clean the time
    const cleanTime = timeString.replace(/\s+/g, '').trim();
    
    // If it's already in proper format like "09:00" or "14:30", return as is
    if (/^\d{2}:\d{2}$/.test(cleanTime)) {
      return cleanTime;
    }
    
    // If it's already in proper format like "09:00:00", just return first part
    if (/^\d{2}:\d{2}:\d{2}$/.test(cleanTime)) {
      return cleanTime.substring(0, 5); // Return just HH:mm part
    }
    
    // If it's just a number (like "9" or "09")
    if (/^\d{1,2}$/.test(cleanTime)) {
      const hour = parseInt(cleanTime);
      if (hour >= 0 && hour <= 23) {
        return `${hour.toString().padStart(2, '0')}:00`;
      }
    }
    
    // If it's in format like "9:" (hour with colon but no minutes)
    if (/^\d{1,2}:$/.test(cleanTime)) {
      const hour = parseInt(cleanTime.replace(':', ''));
      if (hour >= 0 && hour <= 23) {
        return `${hour.toString().padStart(2, '0')}:00`;
      }
    }
    
    // If it's in format like "9:30" or "09:30"
    if (/^\d{1,2}:\d{1,2}$/.test(cleanTime)) {
      const [hours, minutes] = cleanTime.split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes);
      
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      }
    }
    
    // Default fallback
    return '09:00';
  };

  const handleReschedule = async () => {
    if (!shiftMinutes || isNaN(shiftMinutes)) {
      Alert.alert('Error', 'Please enter valid minutes');
      return;
    }

    try {
      const today = new Date();
      const startFrom = startOfDay(today).toISOString();
      
      await api.post(`/api/doctor/${doctorId}/appointments/reschedule`, {
        startFrom,
        shiftMinutes: parseInt(shiftMinutes),
        maxShiftMinutes: 1440
      });
      
      Alert.alert('Success', 'Appointments rescheduled successfully');
      setRescheduleModalVisible(false);
      setShiftMinutes('');
      fetchTodayAppointments(doctorId);
    } catch (e) {
      Alert.alert('Error', 'Failed to reschedule: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleCancelDay = async () => {
    // This function should probably use the separate CancelDay screen instead of inline reason
    // But for now, let's make it work with a simple text input
    Alert.prompt(
      'Cancel Day',
      'Please provide a reason for cancelling all appointments today:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async (reason) => {
            if (!reason || !reason.trim()) {
              Alert.alert('Error', 'Please provide a reason for cancellation');
              return;
            }

            try {
              const today = new Date();
              const dateStr = format(today, 'yyyy-MM-dd');
              
              const res = await api.post(`/api/doctor/${doctorId}/appointments/cancel-day`, {
                date: dateStr,
                reason: reason.trim()
              });
              
              Alert.alert('Success', `${res.data.cancelledCount} appointments cancelled successfully`);
              setCancelDayModalVisible(false);
              fetchTodayAppointments(doctorId);
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel appointments: ' + (e.response?.data?.error || e.message));
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleCancelAppointment = async (appointmentId, userId) => {
    // Store appointment details for cancellation
    setAppointmentToCancel({ appointmentId, userId });
    setSelectedCancelReason('');
    setCustomCancelReason('');
    setCancelReasonModalVisible(true);
  };

  const handleCancelReasonSelection = (reason) => {
    setSelectedCancelReason(reason);
    if (reason !== 'Other') {
      setCustomCancelReason('');
    } else {
      // Auto-focus and scroll to text input when "Other" is selected
      setTimeout(() => {
        if (customCancelReasonInputRef.current) {
          customCancelReasonInputRef.current.focus();
          // Scroll to the bottom to ensure the text input is visible
          if (cancelModalScrollRef.current) {
            cancelModalScrollRef.current.scrollToEnd({ animated: true });
          }
        }
      }, 100);
    }
  };

  const confirmCancelAppointment = async () => {
    if (!selectedCancelReason) {
      Alert.alert('Error', 'Please select a reason for cancellation');
      return;
    }

    if (selectedCancelReason === 'Other' && !customCancelReason.trim()) {
      Alert.alert('Error', 'Please specify your reason for cancellation');
      return;
    }

    try {
      const finalReason = selectedCancelReason === 'Other' ? customCancelReason.trim() : selectedCancelReason;
      
      // You can include the reason in the API call if your backend supports it
      await api.delete(`/api/user/${appointmentToCancel.userId}/appointments/${appointmentToCancel.appointmentId}`);
      
      Alert.alert('Success', 'Appointment cancelled successfully');
      setCancelReasonModalVisible(false);
      fetchTodayAppointments(doctorId);
      fetchUpcomingAppointments(doctorId);
    } catch (e) {
      Alert.alert('Error', 'Failed to cancel appointment: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleRescheduleAppointment = async (appointment, newMinutes) => {
    try {
      const newTime = new Date(new Date(appointment.appointmentTime).getTime() + newMinutes * 60000);
      await api.put(`/api/appointments/${appointment.id}/reschedule`, {
        newTime: newTime.toISOString()
      });
      Alert.alert('Success', 'Appointment rescheduled successfully');
      fetchTodayAppointments(doctorId);
      fetchUpcomingAppointments(doctorId);
    } catch (e) {
      Alert.alert('Error', 'Failed to reschedule appointment: ' + (e.response?.data?.error || e.message));
    }
  };

  const fetchHistoryWithDateRange = async (fromDate, toDate) => {
    if (!doctorId || !fromDate || !toDate) return;
    
    try {
      setLoading(true);
      const from = startOfDay(fromDate).toISOString();
      const to = endOfDay(toDate).toISOString();
      const res = await api.get(`/api/doctor/${doctorId}/appointments/history?from=${from}&to=${to}`);
      setHistoryAppointments(res.data || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch history: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderAppointment = ({item}) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => fetchUserDetails(item.userId)}
    >
      <View style={styles.appointmentHeader}>
        <Text style={styles.patientName}>{item.userName || `Patient #${item.userId}`}</Text>
        <View style={[styles.statusBadge, 
          item.status === 'BOOKED' ? styles.statusBooked : 
          item.status === 'CANCELLED' ? styles.statusCancelled : 
          item.status === 'COMPLETED' ? styles.statusCompleted : styles.statusRescheduled
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.appointmentTime}>
        📅 {format(new Date(item.appointmentTime), 'MMM dd, yyyy • hh:mm a')}
      </Text>
      <Text style={styles.queuePosition}>Queue Position: #{item.queuePosition}</Text>
      {item.workplace && (
        <Text style={styles.workplace}>📍 {item.workplace.workplaceName}</Text>
      )}
      {item.notes && <Text style={styles.notes}>📝 {item.notes}</Text>}
      
      {item.status === 'BOOKED' && (
        <View style={styles.appointmentActions}>
          <TouchableOpacity 
            style={styles.cancelBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleCancelAppointment(item.id, item.userId);
            }}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.rescheduleBtn}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedAppointment(item);
              setRescheduleModalVisible(true);
            }}
          >
            <Text style={styles.rescheduleBtnText}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHistoryCard = ({item}) => (
    <TouchableOpacity 
      style={[styles.appointmentCard, styles.historyCard]}
      onPress={() => fetchUserDetails(item.userId)}
    >
      <View style={styles.appointmentHeader}>
        <Text style={styles.patientName}>{item.userName || `Patient #${item.userId}`}</Text>
        <Text style={styles.historyDate}>
          {format(new Date(item.appointmentTime), 'MMM dd')}
        </Text>
      </View>
      {item.workplace && (
        <Text style={styles.workplace}>📍 {item.workplace.address}</Text>
      )}
      <View style={[styles.statusBadge, styles.statusCompleted]}>
        <Text style={styles.statusText}>COMPLETED</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {activeTab !== 'profile' && <TopBar name={name} />}
      
      {activeTab === 'profile' ? (
        // Profile View
        <ScrollView 
          style={styles.profileContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={profileLoading} onRefresh={() => fetchDetailedProfile(doctorId)} />}
        >
          {profileLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : detailedProfile ? (
            <>
              
              <View style={styles.profileCard}>
                <View style={styles.profilePhotoContainer}>
                  <View style={styles.profilePhoto}>
                    <Text style={styles.profilePhotoText}>
                      {detailedProfile.fullName?.charAt(0)?.toUpperCase() || 'D'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>Dr. {detailedProfile.fullName}</Text>
                  <Text style={styles.profileSpecialty}>{detailedProfile.specialization}</Text>
                  <Text style={styles.profileDesignation}>{detailedProfile.designation}</Text>
                  {/* <Text style={styles.profileEmail}>{detailedProfile.email}</Text>
                  <Text style={styles.profilePhone}>{detailedProfile.mobileNumber}</Text> */}
                </View>
              
              </View>
              
              {/* Personal Information */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Personal Information</Text>
                
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Full Name</Text>
                  {editingProfile ? (
                    <TextInput
                      style={styles.profileInput}
                      value={editedProfile.fullName}
                      onChangeText={(text) => setEditedProfile(prev => ({ ...prev, fullName: text }))}
                    />
                  ) : (
                    <Text style={styles.profileValue}>{detailedProfile.fullName}</Text>
                  )}
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Email</Text>
                  {editingProfile ? (
                    <TextInput
                      style={styles.profileInput}
                      value={editedProfile.email}
                      onChangeText={(text) => setEditedProfile(prev => ({ ...prev, email: text }))}
                    />
                  ) : (
                    <Text style={styles.profileValue}>{detailedProfile.email}</Text>
                  )}
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Mobile Number</Text>
                  <Text style={styles.profileValue}>{detailedProfile.mobileNumber}</Text>
                  {editingProfile && (
                    <Text style={styles.nonEditableText}>(Cannot be edited)</Text>
                  )}
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Specialization</Text>
                  {editingProfile ? (
                    <TextInput
                      style={styles.profileInput}
                      value={editedProfile.specialization}
                      onChangeText={(text) => setEditedProfile(prev => ({ ...prev, specialization: text }))}
                    />
                  ) : (
                    <Text style={styles.profileValue}>{detailedProfile.specialization}</Text>
                  )}
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Designation</Text>
                  {editingProfile ? (
                    <TextInput
                      style={styles.profileInput}
                      value={editedProfile.designation}
                      onChangeText={(text) => setEditedProfile(prev => ({ ...prev, designation: text }))}
                    />
                  ) : (
                    <Text style={styles.profileValue}>{detailedProfile.designation}</Text>
                  )}
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Address</Text>
                  {editingProfile ? (
                    <TextInput
                      style={[styles.profileInput, styles.addressInput]}
                      value={editedProfile.address}
                      onChangeText={(text) => setEditedProfile(prev => ({ ...prev, address: text }))}
                      multiline={true}
                    />
                  ) : (
                    <Text style={styles.profileValue}>{detailedProfile.address}</Text>
                  )}
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>City</Text>
                  {editingProfile ? (
                    <TextInput
                      style={styles.profileInput}
                      value={editedProfile.city || ''}
                      onChangeText={(text) => setEditedProfile(prev => ({ ...prev, city: text }))}
                    />
                  ) : (
                    <Text style={styles.profileValue}>{detailedProfile.city || 'Not specified'}</Text>
                  )}
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>State</Text>
                  {editingProfile ? (
                    <TextInput
                      style={styles.profileInput}
                      value={editedProfile.state || ''}
                      onChangeText={(text) => setEditedProfile(prev => ({ ...prev, state: text }))}
                    />
                  ) : (
                    <Text style={styles.profileValue}>{detailedProfile.state || 'Not specified'}</Text>
                  )}
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Pincode</Text>
                  {editingProfile ? (
                    <TextInput
                      style={styles.profileInput}
                      value={editedProfile.pincode}
                      onChangeText={(text) => setEditedProfile(prev => ({ ...prev, pincode: text }))}
                    />
                  ) : (
                    <Text style={styles.profileValue}>{detailedProfile.pincode}</Text>
                  )}
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Country</Text>
                  {editingProfile ? (
                    <TextInput
                      style={styles.profileInput}
                      value={editedProfile.country || ''}
                      onChangeText={(text) => setEditedProfile(prev => ({ ...prev, country: text }))}
                    />
                  ) : (
                    <Text style={styles.profileValue}>{detailedProfile.country || 'Not specified'}</Text>
                  )}
                </View>
              </View>
              
              {/* Edit Profile and Save Buttons */}
              <View style={styles.profileActions}>
                {editingProfile ? (
                  <>
                    <TouchableOpacity style={styles.cancelEditButton} onPress={() => {
                      setEditingProfile(false);
                      setEditedProfile({ ...detailedProfile });
                    }}>
                      <Text style={styles.cancelEditButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={styles.editProfileMainButton} onPress={() => setEditingProfile(true)}>
                    <Text style={styles.editProfileMainButtonText}>✏️ Edit Profile</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Workplaces Section */}
              <View style={styles.profileSection}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.profileSectionTitle}>Workplaces ({detailedProfile.workplaces?.length || 0})</Text>
                  <TouchableOpacity 
                    style={styles.addWorkplaceButton}
                    onPress={() => setAddWorkplaceModalVisible(true)}
                  >
                    <Text style={styles.addWorkplaceButtonText}>+ Add Workplace</Text>
                  </TouchableOpacity>
                </View>
                
                {(!detailedProfile.workplaces || detailedProfile.workplaces.length === 0) ? (
                  <View style={styles.emptyWorkplaces}>
                    <Text style={styles.emptyWorkplacesText}>No workplaces added yet</Text>
                  </View>
                ) : (
                  <>
                    {(showAllWorkplaces ? detailedProfile.workplaces : detailedProfile.workplaces.slice(0, 1)).map((workplace, index) => (
                      <View key={workplace.id} style={styles.workplaceProfileCard}>
                        <View style={styles.workplaceHeader}>
                          <Text style={styles.workplaceName}>{workplace.workplaceName}</Text>
                          <View style={styles.workplaceHeaderActions}>
                            {workplace.isPrimary && (
                              <View style={styles.primaryBadge}>
                                <Text style={styles.primaryBadgeText}>Primary</Text>
                              </View>
                            )}
                            <TouchableOpacity
                              style={styles.editWorkplaceButton}
                              onPress={() => {
                                console.log('🏥 WORKPLACE OBJECT:', workplace);
                                console.log('📋 Original workplace times:', {
                                  morningStartTime: workplace.morningStartTime,
                                  morningEndTime: workplace.morningEndTime,
                                  eveningStartTime: workplace.eveningStartTime,
                                  eveningEndTime: workplace.eveningEndTime
                                });
                                console.log('🔍 Data types:', {
                                  morningStartTime: typeof workplace.morningStartTime,
                                  morningEndTime: typeof workplace.morningEndTime,
                                  eveningStartTime: typeof workplace.eveningStartTime,
                                  eveningEndTime: typeof workplace.eveningEndTime
                                });
                                
                                // Format the workplace data with separate hour and minute components
                                const morningStart = parseTimeToComponents(workplace.morningStartTime);
                                const morningEnd = parseTimeToComponents(workplace.morningEndTime);
                                const eveningStart = parseTimeToComponents(workplace.eveningStartTime);
                                const eveningEnd = parseTimeToComponents(workplace.eveningEndTime);
                                
                                console.log('Parsed time components:', {
                                  morningStart,
                                  morningEnd,
                                  eveningStart,
                                  eveningEnd
                                });
                                
                                const formattedWorkplace = {
                                  ...workplace,
                                  morningStartHours: morningStart.hours,
                                  morningStartMinutes: morningStart.minutes,
                                  morningEndHours: morningEnd.hours,
                                  morningEndMinutes: morningEnd.minutes,
                                  eveningStartHours: eveningStart.hours,
                                  eveningStartMinutes: eveningStart.minutes,
                                  eveningEndHours: eveningEnd.hours,
                                  eveningEndMinutes: eveningEnd.minutes
                                };
                                
                                console.log('🏥 Duration from workplace:', workplace.checkingDurationMinutes);
                                // console.log('📋 Final formatted workplace:', {
                                //   morningStartHours: formattedWorkplace.morningStartHours,
                                //   morningStartMinutes: formattedWorkplace.morningStartMinutes,
                                //   morningEndHours: formattedWorkplace.morningEndHours,
                                //   morningEndMinutes: formattedWorkplace.morningEndMinutes,
                                //   eveningStartHours: formattedWorkplace.eveningStartHours,
                                //   eveningStartMinutes: formattedWorkplace.eveningStartMinutes,
                                //   eveningEndHours: formattedWorkplace.eveningEndHours,
                                //   eveningEndMinutes: formattedWorkplace.eveningEndMinutes,
                                //   checkingDurationMinutes: formattedWorkplace.checkingDurationMinutes
                                // });
                                
                                console.log('Formatted workplace times:', {
                                  morningStartTime: formattedWorkplace.morningStartTime,
                                  morningEndTime: formattedWorkplace.morningEndTime,
                                  eveningStartTime: formattedWorkplace.eveningStartTime,
                                  eveningEndTime: formattedWorkplace.eveningEndTime
                                });
                                
                                setSelectedWorkplaceForEdit(formattedWorkplace);
                                setEditWorkplaceModalVisible(true);
                              }}
                            >
                              <Text style={styles.editWorkplaceButtonText}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text style={styles.workplaceType}>{workplace.workplaceType}</Text>
                        <Text style={styles.workplaceAddress}>{workplace.address}</Text>
                        <Text style={styles.workplaceLocation}>{workplace.city}, {workplace.state} - {workplace.pincode}</Text>
                        <Text style={styles.workplaceContact}>Contact: {workplace.contactNumber || 'Not provided'}</Text>
                        
                        <View style={styles.timingSection}>
                          <Text style={styles.timingTitle}>Working Hours:</Text>
                          <Text style={styles.timingText}>
                            Morning: {formatTime(workplace.morningStartTime || '09:00')} - {formatTime(workplace.morningEndTime || '13:00')}
                          </Text>
                          <Text style={styles.timingText}>
                            Evening: {formatTime(workplace.eveningStartTime || '15:00')} - {formatTime(workplace.eveningEndTime || '19:00')}
                          </Text>
                          <Text style={styles.timingText}>
                            Duration per patient: {workplace.checkingDurationMinutes || 15} minutes
                          </Text>
                        </View>
                      </View>
                    ))}
                    
                    {detailedProfile.workplaces.length > 1 && (
                      <TouchableOpacity 
                        style={styles.loadMoreButton}
                        onPress={() => setShowAllWorkplaces(!showAllWorkplaces)}
                      >
                        <Text style={styles.loadMoreButtonText}>
                          {showAllWorkplaces ? 'Show Less' : `Load More (${detailedProfile.workplaces.length - 1} more)`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
              
              {/* Profile Actions - Only Logout */}
              <View style={styles.profileActions}>
                <TouchableOpacity style={[styles.logoutButton, {flex: 1}]} onPress={handleLogout}>
                  <Text style={styles.logoutButtonText}>🚪 Logout</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Failed to load profile</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => fetchDetailedProfile(doctorId)}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Bottom Spacing for Profile */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      ) : (
        // Home View
        <ScrollView 
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
        {/* Today's Schedule Section - Moved to Top */}
        <View style={styles.todayScheduleContainer}>
          {!todayScheduleExpanded ? (
            // Collapsed view - show as a simple card like other stats
            <TouchableOpacity 
              style={[styles.card, {borderLeftColor: '#3498db', borderLeftWidth: 4}]}
              onPress={() => setTodayScheduleExpanded(true)}
            >
              <Text style={styles.cardTitle}>📅 Today's Schedule</Text>
              <Text style={styles.cardSubtitle}>
                {workplaces.length} workplaces • {workplaces.reduce((total, wp) => total + (wp.todayAppointmentsCount || 0), 0)} appointments
              </Text>
            </TouchableOpacity>
          ) : (
            // Expanded view - show all workplaces with header
            <View style={styles.todayScheduleExpanded}>
              <TouchableOpacity 
                style={styles.todayScheduleHeader}
                onPress={() => setTodayScheduleExpanded(false)}
              >
                <Text style={styles.todayScheduleTitle}>📅 Today's Schedule</Text>
                <Text style={styles.expandIcon}>✕</Text>
              </TouchableOpacity>
              
              {workplaces.length === 0 ? (
              <View style={styles.emptyWorkplaceContainer}>
                <Text style={styles.emptyScheduleText}>� No workplaces added yet!</Text>
              </View>
            ) : (
              workplaces.map((item, index) => (
                <View
                  key={index}
                  style={styles.workplaceTileExpanded}
                >
                  <View style={styles.workplaceTileContent}>
                    <Text style={styles.workplaceName}>{item.workplaceName}</Text>
                    <Text style={styles.workplaceType}>{item.workplaceType}</Text>
                    <Text style={styles.workplaceAddress}>{item.address}</Text>
                    
                    <View style={styles.appointmentRow}>
                      <View style={styles.appointmentCountBadge}>
                        <Text style={styles.appointmentCountText}>
                          {item.todayAppointmentsCount || 0} today
                        </Text>
                      </View>
                      <View style={[styles.appointmentCountBadge, styles.futureBadge]}>
                        <Text style={styles.appointmentCountText}>
                          {item.futureAppointmentsCount || 0} upcoming
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.viewAppointmentsButton}
                    onPress={() => handleViewAppointments(item)}
                  >
                    <Text style={styles.viewAppointmentsButtonText}>View Appointments</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <Card 
              title="History" 
              subtitle={`${historyAppointments.length} past 2 weeks`}
              onPress={() => navigation.navigate('AppointmentHistory', { doctorId })}
              color="#9b59b6"
            />
            {/* <Card 
              title="Upcoming (2 days)" 
              subtitle={`${upcomingAppointments.length} appointments`}
              onPress={() => setUpcomingModalVisible(true)}
              color="#27ae60"
            /> */}
            <Card 
              title="Quick Booking QR" 
              subtitle="Generate QR codes"
              onPress={handleQuickBookingQR}
              color="#16a085"
            />
            {isAdmin && (
              <Card 
                title="🔔 FCM Test" 
                subtitle="Test notifications"
                onPress={handleFCMTest}
                color="#8e44ad"
              />
            )}
            <Card 
              title="Reschedule" 
              subtitle="Bulk time shift"
              onPress={() => navigation.navigate('BulkReschedule', { doctorId })}
              color="#f39c12"
            />
            <Card 
              title="Cancel Day" 
              subtitle="Cancel workspace day"
              onPress={() => navigation.navigate('CancelDay', { doctorId })}
              color="#e74c3c"
            />
          </View>
        </View>
        
        {/* Bottom Spacing to prevent navigation overlap */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      )}

      {/* Cancel Reason Modal */}
      <Modal
        visible={cancelReasonModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCancelReasonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView 
              ref={cancelModalScrollRef}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            >
              <Text style={styles.modalTitle}>Reason for Cancellation</Text>
              <Text style={styles.modalSubtitle}>
                Please select a reason for cancelling this appointment
              </Text>
              
              <View style={styles.reasonsList}>
              {DOCTOR_CANCEL_REASONS.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.reasonOption,
                    selectedCancelReason === reason && styles.selectedReasonOption
                  ]}
                  onPress={() => handleCancelReasonSelection(reason)}
                >
                  <View style={styles.reasonOptionContent}>
                    <View style={[
                      styles.radioButton,
                      selectedCancelReason === reason && styles.selectedRadioButton
                    ]}>
                      {selectedCancelReason === reason && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[
                      styles.reasonText,
                      selectedCancelReason === reason && styles.selectedReasonText
                    ]}>
                      {reason}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {selectedCancelReason === 'Other' && (
                <TextInput
                  ref={customCancelReasonInputRef}
                  style={styles.customReasonInput}
                  placeholder="Please specify your reason..."
                  multiline={true}
                  numberOfLines={3}
                  value={customCancelReason}
                  onChangeText={setCustomCancelReason}
                  textAlignVertical="top"
                />
              )}
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCancelReasonModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  !selectedCancelReason && styles.disabledButton
                ]}
                onPress={confirmCancelAppointment}
                disabled={!selectedCancelReason}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'appointments') onRefresh();
        }}
      />

      {/* Reschedule Modal */}
      <Modal visible={rescheduleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.actionModal}>
            <Text style={styles.modalTitle}>⏰ Reschedule Appointments</Text>
            <Text style={styles.modalSubtitle}>Shift all today's appointments by:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter minutes (e.g., 60 for 1 hour)"
              value={shiftMinutes}
              onChangeText={setShiftMinutes}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setRescheduleModalVisible(false);
                setShiftMinutes('');
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleReschedule}>
                <Text style={styles.confirmButtonText}>Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Day Modal */}
      <Modal visible={cancelDayModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.actionModal}>
            <Text style={styles.modalTitle}>❌ Cancel Entire Day</Text>
            <Text style={styles.modalSubtitle}>This will cancel all appointments for today.</Text>
            <Text style={styles.modalSubtitle}>Are you sure you want to proceed?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setCancelDayModalVisible(false);
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, styles.dangerButton]} onPress={handleCancelDay}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={historyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.historyModal}>
            <View style={styles.historyHeader}>
              <Text style={styles.modalTitle}>� Appointment History</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList 
              data={historyAppointments}
              keyExtractor={i=>String(i.id)}
              renderItem={renderAppointment}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>� No history found</Text>
                  <Text style={styles.emptyStateSubtext}>Past appointments will appear here</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Upcoming Appointments Modal */}
      <Modal visible={upcomingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.historyModal}>
            <View style={styles.historyHeader}>
              <Text style={styles.modalTitle}>📅 Upcoming Appointments</Text>
              <TouchableOpacity onPress={() => setUpcomingModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList 
              data={upcomingAppointments}
              keyExtractor={i=>String(i.id)}
              renderItem={renderAppointment}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>📅 No upcoming appointments</Text>
                  <Text style={styles.emptyStateSubtext}>Next 2 days appointments will appear here</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* User Details Modal */}
      <Modal visible={userDetailsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.userDetailsModal}>
            <View style={styles.historyHeader}>
              <Text style={styles.modalTitle}>👤 Patient Details</Text>
              <TouchableOpacity onPress={() => setUserDetailsModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
            ) : selectedUser ? (
              <ScrollView style={styles.userDetailsContent}>
                <View style={styles.userDetailSection}>
                  <Text style={styles.userDetailLabel}>Full Name</Text>
                  <Text style={styles.userDetailValue}>{selectedUser.fullName}</Text>
                </View>
                <View style={styles.userDetailSection}>
                  <Text style={styles.userDetailLabel}>Email</Text>
                  <Text style={styles.userDetailValue}>{selectedUser.email}</Text>
                </View>
                <View style={styles.userDetailSection}>
                  <Text style={styles.userDetailLabel}>Mobile</Text>
                  <Text style={styles.userDetailValue}>{selectedUser.mobileNumber}</Text>
                </View>
                <View style={styles.userDetailSection}>
                  <Text style={styles.userDetailLabel}>Address</Text>
                  <Text style={styles.userDetailValue}>{selectedUser.address}</Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Workplace Appointments Modal */}
      <Modal visible={workplaceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.historyModal}>
            <View style={styles.historyHeader}>
              <Text style={styles.modalTitle}>
                🏥 {selectedWorkplace?.name || 'Workplace'} - Today's Appointments
              </Text>
              <TouchableOpacity onPress={() => setWorkplaceModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {appointmentsByWorkplace.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>📅 No appointments today</Text>
                <Text style={styles.emptyStateSubtext}>No appointments scheduled for this location today</Text>
              </View>
            ) : (
              <FlatList
                data={appointmentsByWorkplace}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <View style={styles.workplaceAppointmentCard}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.patientName}>
                        {item.patientName || 'Patient Booked'}
                      </Text>
                      <Text style={styles.appointmentTime}>
                        {item.startTime} - {item.endTime}
                      </Text>
                    </View>
                    
                    <Text style={styles.patientAge}>Age: {item.patientAge || 'N/A'}</Text>
                    <Text style={styles.patientArea}>Area: {item.patientArea || 'N/A'}</Text>
                    <Text style={styles.appointmentStatus}>Status: {item.status || 'BOOKED'}</Text>
                    
                    <View style={styles.appointmentActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.cancelBtn]}
                        onPress={() => updateAppointmentStatus(item.appointmentId, 'CANCELLED')}
                      >
                        <Text style={styles.actionButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.rescheduleBtn]}
                        onPress={() => updateAppointmentStatus(item.appointmentId, 'RESCHEDULED')}
                      >
                        <Text style={styles.actionButtonText}>Reschedule</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.completeBtn]}
                        onPress={() => updateAppointmentStatus(item.appointmentId, 'COMPLETED')}
                      >
                        <Text style={styles.actionButtonText}>Complete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Doctor Profile Modal */}
      <Modal visible={profileModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <View style={styles.historyHeader}>
              <Text style={styles.modalTitle}>👤 Doctor Profile</Text>
              <View style={styles.profileHeaderActions}>
                <TouchableOpacity 
                  style={styles.editProfileBtn}
                  onPress={() => setEditMode(!editMode)}
                >
                  <Text style={styles.editProfileBtnText}>
                    {editMode ? 'Cancel' : 'Edit'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
            ) : doctorProfile ? (
              <ScrollView style={styles.profileContent}>
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>Personal Information</Text>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Full Name</Text>
                    {editMode ? (
                      <TextInput
                        style={styles.profileInput}
                        value={doctorProfile.fullName}
                        onChangeText={(text) => setDoctorProfile({...doctorProfile, fullName: text})}
                      />
                    ) : (
                      <Text style={styles.profileValue}>{doctorProfile.fullName}</Text>
                    )}
                  </View>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Email</Text>
                    <Text style={styles.profileValue}>{doctorProfile.email}</Text>
                  </View>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Mobile</Text>
                    {editMode ? (
                      <TextInput
                        style={styles.profileInput}
                        value={doctorProfile.mobileNumber}
                        onChangeText={(text) => setDoctorProfile({...doctorProfile, mobileNumber: text})}
                      />
                    ) : (
                      <Text style={styles.profileValue}>{doctorProfile.mobileNumber}</Text>
                    )}
                  </View>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Specialization</Text>
                    {editMode ? (
                      <TextInput
                        style={styles.profileInput}
                        value={doctorProfile.specialization}
                        onChangeText={(text) => setDoctorProfile({...doctorProfile, specialization: text})}
                      />
                    ) : (
                      <Text style={styles.profileValue}>{doctorProfile.specialization}</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.profileSection}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.profileSectionTitle}>Workplaces</Text>
                    <TouchableOpacity 
                      style={styles.addWorkplaceProfileBtn}
                      onPress={() => {
                        setProfileModalVisible(false);
                        navigation.navigate('DoctorRegistration');
                      }}
                    >
                      <Text style={styles.addWorkplaceProfileBtnText}>+ Add Workplace</Text>
                    </TouchableOpacity>
                  </View>
                  {workplaces.map((workplace, index) => (
                    <View key={index} style={styles.workplaceProfileItem}>
                      <Text style={styles.workplaceProfileName}>{workplace.name}</Text>
                      <Text style={styles.workplaceProfileAddress}>{workplace.address}</Text>
                    </View>
                  ))}
                </View>
                
                {editMode && (
                  <TouchableOpacity 
                    style={styles.saveProfileBtn}
                    onPress={() => updateDoctorProfile(doctorProfile)}
                  >
                    <Text style={styles.saveProfileBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Add Workplace Modal */}
      <Modal visible={addWorkplaceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.workplaceModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Workplace</Text>
              <TouchableOpacity onPress={() => {
                setAddWorkplaceModalVisible(false);
                closeAllTimeDropdowns();
              }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.workplaceForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Workplace Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newWorkplace.workplaceName}
                  onChangeText={(text) => setNewWorkplace(prev => ({...prev, workplaceName: text}))}
                  placeholder="Enter workplace name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Workplace Type *</Text>
                <View style={styles.typeSelector}>
                  {['CLINIC', 'HOSPITAL'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeOption, newWorkplace.workplaceType === type && styles.typeOptionSelected]}
                      onPress={() => setNewWorkplace(prev => ({...prev, workplaceType: type}))}
                    >
                      <Text style={[styles.typeOptionText, newWorkplace.workplaceType === type && styles.typeOptionTextSelected]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address *</Text>
                <TextInput
                  style={[styles.formInput, styles.addressInput]}
                  value={newWorkplace.address}
                  onChangeText={(text) => setNewWorkplace(prev => ({...prev, address: text}))}
                  placeholder="Enter full address"
                  multiline={true}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newWorkplace.city}
                    onChangeText={(text) => setNewWorkplace(prev => ({...prev, city: text}))}
                    placeholder="City"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>State</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newWorkplace.state}
                    onChangeText={(text) => setNewWorkplace(prev => ({...prev, state: text}))}
                    placeholder="State"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Pincode</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newWorkplace.pincode}
                    onChangeText={(text) => setNewWorkplace(prev => ({...prev, pincode: text}))}
                    placeholder="Pincode"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Country</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newWorkplace.country}
                    onChangeText={(text) => setNewWorkplace(prev => ({...prev, country: text}))}
                    placeholder="Country"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contact Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={newWorkplace.contactNumber}
                  onChangeText={(text) => setNewWorkplace(prev => ({...prev, contactNumber: text}))}
                  placeholder="Contact number"
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={styles.sectionTitle}>Working Hours</Text>
              <Text style={styles.timeFormatHint}>Select time from dropdowns</Text>
              
              <View style={styles.compactTimingContainer}>
                <View style={styles.compactTimingRow}>
                  <Text style={styles.compactTimingLabel}>Morning:</Text>
                  <View style={styles.compactTimeInputs}>
                    <TouchableOpacity
                      style={styles.compactTimeDropdown}
                      onPress={() => toggleTimeDropdownForNew('morningStart', 'hour')}
                    >
                      <Text style={styles.compactTimeDropdownText}>
                        {convertTo12Hour(newWorkplace.morningStartHours || '09')}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.compactColonText}>:</Text>
                    <TouchableOpacity
                      style={styles.compactTimeDropdown}
                      onPress={() => toggleTimeDropdownForNew('morningStart', 'minute')}
                    >
                      <Text style={styles.compactTimeDropdownText}>
                        {newWorkplace.morningStartMinutes || '00'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.compactToText}>-</Text>
                    <TouchableOpacity
                      style={styles.compactTimeDropdown}
                      onPress={() => toggleTimeDropdownForNew('morningEnd', 'hour')}
                    >
                      <Text style={styles.compactTimeDropdownText}>
                        {convertTo12Hour(newWorkplace.morningEndHours || '13')}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.compactColonText}>:</Text>
                    <TouchableOpacity
                      style={styles.compactTimeDropdown}
                      onPress={() => toggleTimeDropdownForNew('morningEnd', 'minute')}
                    >
                      <Text style={styles.compactTimeDropdownText}>
                        {newWorkplace.morningEndMinutes || '00'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.compactTimingRow}>
                  <Text style={styles.compactTimingLabel}>Evening:</Text>
                  <View style={styles.compactTimeInputs}>
                    <TouchableOpacity
                      style={styles.compactTimeDropdown}
                      onPress={() => toggleTimeDropdownForNew('eveningStart', 'hour')}
                    >
                      <Text style={styles.compactTimeDropdownText}>
                        {convertTo12Hour(newWorkplace.eveningStartHours || '15')}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.compactColonText}>:</Text>
                    <TouchableOpacity
                      style={styles.compactTimeDropdown}
                      onPress={() => toggleTimeDropdownForNew('eveningStart', 'minute')}
                    >
                      <Text style={styles.compactTimeDropdownText}>
                        {newWorkplace.eveningStartMinutes || '00'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.compactToText}>-</Text>
                    <TouchableOpacity
                      style={styles.compactTimeDropdown}
                      onPress={() => toggleTimeDropdownForNew('eveningEnd', 'hour')}
                    >
                      <Text style={styles.compactTimeDropdownText}>
                        {convertTo12Hour(newWorkplace.eveningEndHours || '19')}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.compactColonText}>:</Text>
                    <TouchableOpacity
                      style={styles.compactTimeDropdown}
                      onPress={() => toggleTimeDropdownForNew('eveningEnd', 'minute')}
                    >
                      <Text style={styles.compactTimeDropdownText}>
                        {newWorkplace.eveningEndMinutes || '00'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Duration per Patient (minutes)</Text>
                <TouchableOpacity
                  style={styles.durationDropdownButton}
                  onPress={() => toggleTimeDropdownForNew('duration', 'minutes')}
                >
                  <Text style={styles.durationDropdownText}>
                    {newWorkplace.checkingDurationMinutes || 15} minutes
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setNewWorkplace(prev => ({...prev, isPrimary: !prev.isPrimary}))}
                >
                  <Text style={styles.checkboxText}>
                    {newWorkplace.isPrimary ? '☑️' : '☐'} Set as Primary Workplace
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setAddWorkplaceModalVisible(false);
                    closeAllTimeDropdowns();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveWorkplaceButton} 
                  onPress={handleAddWorkplace}
                  disabled={profileLoading}
                >
                  {profileLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveWorkplaceButtonText}>Add Workplace</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Workplace Modal */}
      <Modal visible={editWorkplaceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.workplaceModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Workplace</Text>
              <TouchableOpacity onPress={() => {
                setEditWorkplaceModalVisible(false);
                setSelectedWorkplaceForEdit(null);
              }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedWorkplaceForEdit && (
              <ScrollView style={styles.workplaceForm} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Workplace Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={selectedWorkplaceForEdit.workplaceName || ''}
                    onChangeText={(text) => setSelectedWorkplaceForEdit(prev => ({...prev, workplaceName: text}))}
                    placeholder="Enter workplace name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Workplace Type *</Text>
                  <View style={styles.typeSelector}>
                    {['CLINIC', 'HOSPITAL'].map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeOption, (selectedWorkplaceForEdit.workplaceType || 'CLINIC') === type && styles.typeOptionSelected]}
                        onPress={() => setSelectedWorkplaceForEdit(prev => ({...prev, workplaceType: type}))}
                      >
                        <Text style={[styles.typeOptionText, (selectedWorkplaceForEdit.workplaceType || 'CLINIC') === type && styles.typeOptionTextSelected]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Address *</Text>
                  <TextInput
                    style={[styles.formInput, styles.addressInput]}
                    value={selectedWorkplaceForEdit.address || ''}
                    onChangeText={(text) => setSelectedWorkplaceForEdit(prev => ({...prev, address: text}))}
                    placeholder="Enter full address"
                    multiline={true}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>City</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedWorkplaceForEdit.city || ''}
                      onChangeText={(text) => setSelectedWorkplaceForEdit(prev => ({...prev, city: text}))}
                      placeholder="City"
                    />
                  </View>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>State</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedWorkplaceForEdit.state || ''}
                      onChangeText={(text) => setSelectedWorkplaceForEdit(prev => ({...prev, state: text}))}
                      placeholder="State"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Pincode</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedWorkplaceForEdit.pincode || ''}
                      onChangeText={(text) => setSelectedWorkplaceForEdit(prev => ({...prev, pincode: text}))}
                      placeholder="Pincode"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Country</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedWorkplaceForEdit.country || ''}
                      onChangeText={(text) => setSelectedWorkplaceForEdit(prev => ({...prev, country: text}))}
                      placeholder="Country"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Contact Number</Text>
                  <TextInput
                    style={styles.formInput}
                    value={selectedWorkplaceForEdit.contactNumber || ''}
                    onChangeText={(text) => setSelectedWorkplaceForEdit(prev => ({...prev, contactNumber: text}))}
                    placeholder="Contact number"
                    keyboardType="phone-pad"
                  />
                </View>

                <Text style={styles.sectionTitle}>Working Hours</Text>
                <Text style={styles.timeFormatHint}>Select time from dropdowns</Text>
                
                <View style={styles.compactTimingContainer}>
                  <View style={styles.compactTimingRow}>
                    <Text style={styles.compactTimingLabel}>Morning:</Text>
                    <View style={styles.compactTimeInputs}>
                      <TouchableOpacity
                        style={styles.compactTimeDropdown}
                        onPress={() => toggleTimeDropdown('morningStart', 'hour')}
                      >
                        <Text style={styles.compactTimeDropdownText}>
                          {convertTo12Hour(selectedWorkplaceForEdit.morningStartHours || '09')}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.compactColonText}>:</Text>
                      <TouchableOpacity
                        style={styles.compactTimeDropdown}
                        onPress={() => toggleTimeDropdown('morningStart', 'minute')}
                      >
                        <Text style={styles.compactTimeDropdownText}>
                          {selectedWorkplaceForEdit.morningStartMinutes || '00'}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.compactToText}>-</Text>
                      <TouchableOpacity
                        style={styles.compactTimeDropdown}
                        onPress={() => toggleTimeDropdown('morningEnd', 'hour')}
                      >
                        <Text style={styles.compactTimeDropdownText}>
                          {convertTo12Hour(selectedWorkplaceForEdit.morningEndHours || '13')}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.compactColonText}>:</Text>
                      <TouchableOpacity
                        style={styles.compactTimeDropdown}
                        onPress={() => toggleTimeDropdown('morningEnd', 'minute')}
                      >
                        <Text style={styles.compactTimeDropdownText}>
                          {selectedWorkplaceForEdit.morningEndMinutes || '00'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.compactTimingRow}>
                    <Text style={styles.compactTimingLabel}>Evening:</Text>
                    <View style={styles.compactTimeInputs}>
                      <TouchableOpacity
                        style={styles.compactTimeDropdown}
                        onPress={() => toggleTimeDropdown('eveningStart', 'hour')}
                      >
                        <Text style={styles.compactTimeDropdownText}>
                          {convertTo12Hour(selectedWorkplaceForEdit.eveningStartHours || '15')}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.compactColonText}>:</Text>
                      <TouchableOpacity
                        style={styles.compactTimeDropdown}
                        onPress={() => toggleTimeDropdown('eveningStart', 'minute')}
                      >
                        <Text style={styles.compactTimeDropdownText}>
                          {selectedWorkplaceForEdit.eveningStartMinutes || '00'}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.compactToText}>-</Text>
                      <TouchableOpacity
                        style={styles.compactTimeDropdown}
                        onPress={() => toggleTimeDropdown('eveningEnd', 'hour')}
                      >
                        <Text style={styles.compactTimeDropdownText}>
                          {convertTo12Hour(selectedWorkplaceForEdit.eveningEndHours || '19')}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.compactColonText}>:</Text>
                      <TouchableOpacity
                        style={styles.compactTimeDropdown}
                        onPress={() => toggleTimeDropdown('eveningEnd', 'minute')}
                      >
                        <Text style={styles.compactTimeDropdownText}>
                          {selectedWorkplaceForEdit.eveningEndMinutes || '00'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Duration per Patient (minutes)</Text>
                  <TouchableOpacity
                    style={styles.durationDropdownButton}
                    onPress={() => toggleTimeDropdown('duration', 'minutes')}
                  >
                    <Text style={styles.durationDropdownText}>
                      {selectedWorkplaceForEdit.checkingDurationMinutes || 15} minutes
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setSelectedWorkplaceForEdit(prev => ({...prev, isPrimary: !prev.isPrimary}))}
                  >
                    <Text style={styles.checkboxText}>
                      {selectedWorkplaceForEdit.isPrimary ? '☑️' : '☐'} Set as Primary Workplace
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => {
                      setEditWorkplaceModalVisible(false);
                      setSelectedWorkplaceForEdit(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveWorkplaceButton} 
                    onPress={handleEditWorkplace}
                    disabled={profileLoading}
                  >
                    {profileLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveWorkplaceButtonText}>Update Workplace</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Time Dropdown Modals */}
      {/* Morning Start Hour */}
      <Modal
        visible={timeDropdownVisible.morningStart_hour || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdown('morningStart', 'hour')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdown('morningStart', 'hour')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {HOUR_OPTIONS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelection('morningStart', 'hour', hour)}
                >
                  <Text style={styles.dropdownOptionText}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Morning Start Minute */}
      <Modal
        visible={timeDropdownVisible.morningStart_minute || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdown('morningStart', 'minute')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdown('morningStart', 'minute')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {MINUTE_OPTIONS.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelection('morningStart', 'minute', minute)}
                >
                  <Text style={styles.dropdownOptionText}>{String(minute).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Morning End Hour */}
      <Modal
        visible={timeDropdownVisible.morningEnd_hour || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdown('morningEnd', 'hour')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdown('morningEnd', 'hour')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {HOUR_OPTIONS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelection('morningEnd', 'hour', hour)}
                >
                  <Text style={styles.dropdownOptionText}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Morning End Minute */}
      <Modal
        visible={timeDropdownVisible.morningEnd_minute || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdown('morningEnd', 'minute')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdown('morningEnd', 'minute')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {MINUTE_OPTIONS.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelection('morningEnd', 'minute', minute)}
                >
                  <Text style={styles.dropdownOptionText}>{String(minute).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Evening Start Hour */}
      <Modal
        visible={timeDropdownVisible.eveningStart_hour || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdown('eveningStart', 'hour')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdown('eveningStart', 'hour')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {HOUR_OPTIONS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelection('eveningStart', 'hour', hour)}
                >
                  <Text style={styles.dropdownOptionText}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Evening Start Minute */}
      <Modal
        visible={timeDropdownVisible.eveningStart_minute || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdown('eveningStart', 'minute')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdown('eveningStart', 'minute')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {MINUTE_OPTIONS.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelection('eveningStart', 'minute', minute)}
                >
                  <Text style={styles.dropdownOptionText}>{String(minute).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Evening End Hour */}
      <Modal
        visible={timeDropdownVisible.eveningEnd_hour || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdown('eveningEnd', 'hour')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdown('eveningEnd', 'hour')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {HOUR_OPTIONS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelection('eveningEnd', 'hour', hour)}
                >
                  <Text style={styles.dropdownOptionText}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Evening End Minute */}
      <Modal
        visible={timeDropdownVisible.eveningEnd_minute || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdown('eveningEnd', 'minute')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdown('eveningEnd', 'minute')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {MINUTE_OPTIONS.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelection('eveningEnd', 'minute', minute)}
                >
                  <Text style={styles.dropdownOptionText}>{String(minute).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Duration Dropdown */}
      <Modal
        visible={timeDropdownVisible.duration_minutes || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdown('duration', 'minutes')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdown('duration', 'minutes')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {[5, 10, 15, 20, 25, 30, 45, 60].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelection('duration', 'minutes', duration)}
                >
                  <Text style={styles.dropdownOptionText}>{duration} minutes</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Workplace Time Dropdown Modals */}
      {/* New Workplace Morning Start Hour */}
      <Modal
        visible={newWorkplaceTimeDropdownVisible.morningStart_hour || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdownForNew('morningStart', 'hour')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdownForNew('morningStart', 'hour')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {HOUR_OPTIONS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelectionForNew('morningStart', 'hour', hour)}
                >
                  <Text style={styles.dropdownOptionText}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Workplace Morning Start Minute */}
      <Modal
        visible={newWorkplaceTimeDropdownVisible.morningStart_minute || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdownForNew('morningStart', 'minute')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdownForNew('morningStart', 'minute')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {MINUTE_OPTIONS.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelectionForNew('morningStart', 'minute', minute)}
                >
                  <Text style={styles.dropdownOptionText}>{String(minute).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Workplace Morning End Hour */}
      <Modal
        visible={newWorkplaceTimeDropdownVisible.morningEnd_hour || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdownForNew('morningEnd', 'hour')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdownForNew('morningEnd', 'hour')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {HOUR_OPTIONS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelectionForNew('morningEnd', 'hour', hour)}
                >
                  <Text style={styles.dropdownOptionText}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Workplace Morning End Minute */}
      <Modal
        visible={newWorkplaceTimeDropdownVisible.morningEnd_minute || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdownForNew('morningEnd', 'minute')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdownForNew('morningEnd', 'minute')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {MINUTE_OPTIONS.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelectionForNew('morningEnd', 'minute', minute)}
                >
                  <Text style={styles.dropdownOptionText}>{String(minute).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Workplace Evening Start Hour */}
      <Modal
        visible={newWorkplaceTimeDropdownVisible.eveningStart_hour || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdownForNew('eveningStart', 'hour')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdownForNew('eveningStart', 'hour')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {HOUR_OPTIONS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelectionForNew('eveningStart', 'hour', hour)}
                >
                  <Text style={styles.dropdownOptionText}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Workplace Evening Start Minute */}
      <Modal
        visible={newWorkplaceTimeDropdownVisible.eveningStart_minute || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdownForNew('eveningStart', 'minute')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdownForNew('eveningStart', 'minute')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {MINUTE_OPTIONS.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelectionForNew('eveningStart', 'minute', minute)}
                >
                  <Text style={styles.dropdownOptionText}>{String(minute).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Workplace Evening End Hour */}
      <Modal
        visible={newWorkplaceTimeDropdownVisible.eveningEnd_hour || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdownForNew('eveningEnd', 'hour')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdownForNew('eveningEnd', 'hour')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {HOUR_OPTIONS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelectionForNew('eveningEnd', 'hour', hour)}
                >
                  <Text style={styles.dropdownOptionText}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Workplace Evening End Minute */}
      <Modal
        visible={newWorkplaceTimeDropdownVisible.eveningEnd_minute || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdownForNew('eveningEnd', 'minute')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdownForNew('eveningEnd', 'minute')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {MINUTE_OPTIONS.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelectionForNew('eveningEnd', 'minute', minute)}
                >
                  <Text style={styles.dropdownOptionText}>{String(minute).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Workplace Duration Dropdown */}
      <Modal
        visible={newWorkplaceTimeDropdownVisible.duration_minutes || false}
        transparent
        animationType="fade"
        onRequestClose={() => toggleTimeDropdownForNew('duration', 'minutes')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => toggleTimeDropdownForNew('duration', 'minutes')}
        >
          <View style={styles.timeDropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {[5, 10, 15, 20, 25, 30, 45, 60].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={styles.dropdownOption}
                  onPress={() => handleTimeSelectionForNew('duration', 'minutes', duration)}
                >
                  <Text style={styles.dropdownOptionText}>{duration} minutes</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hi: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
  },
  menuButton: {
    padding: 8,
  },
  kebab: {
    fontSize: 24,
    color: '#7f8c8d',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  appointmentsSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  timeFormatHint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBooked: {
    backgroundColor: '#d5edda',
  },
  statusCancelled: {
    backgroundColor: '#f8d7da',
  },
  statusRescheduled: {
    backgroundColor: '#fff3cd',
  },
  statusCompleted: {
    backgroundColor: '#d5edda',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  queuePosition: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  workplace: {
    fontSize: 14,
    color: '#27ae60',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 4,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  rescheduleBtn: {
    flex: 1,
    backgroundColor: '#f39c12',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rescheduleBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  historyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  historyDate: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  bulkActions: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  bulkBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bulkRescheduleBtn: {
    backgroundColor: '#f39c12',
  },
  bulkCancelBtn: {
    backgroundColor: '#e74c3c',
  },
  bulkBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dateFilterContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  dateInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  filterBtn: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 60,
  },
  filterBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    padding: 20,
  },
  userDetailsModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '95%',
    maxHeight: '80%',
    padding: 20,
  },
  userDetailsContent: {
    maxHeight: 400,
  },
  userDetailSection: {
    marginBottom: 16,
  },
  userDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  userDetailValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  vitalsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  vitalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vitalLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  vitalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#bdc3c7',
    fontStyle: 'italic',
    marginTop: 8,
  },
  registrationModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    alignItems: 'center',
  },
  registrationButtons: {
    width: '100%',
    gap: 12,
    marginTop: 20,
  },
  completeRegBtn: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeRegBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    backgroundColor: '#ecf0f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  navItemActive: {
    backgroundColor: '#e3f2fd',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navIconActive: {
    color: '#2196f3',
  },
  navLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#2196f3',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
  
  // Today's Schedule Expanded Styles
  todayScheduleExpanded: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  workplacesScrollView: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 48,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 48,
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 48,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  historyModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '95%',
    maxHeight: '80%',
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    fontSize: 18,
    color: '#7f8c8d',
    padding: 4,
  },
  // Workplace Tiles Styles
  emptyWorkplaceContainer: {
    alignItems: 'center',
    padding: 40,
  },
  addWorkplaceBtn: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addWorkplaceBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  workplaceTile: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workplaceTileContent: {
    flex: 1,
  },
  workplaceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workplaceAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  appointmentCountBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  appointmentCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Workplace Appointment Card Styles
  workplaceAppointmentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  patientAge: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  patientArea: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  appointmentStatus: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#e74c3c',
  },
  rescheduleBtn: {
    backgroundColor: '#f39c12',
  },
  completeBtn: {
    backgroundColor: '#27ae60',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Available Slot Styles
  availableSlotInfo: {
    backgroundColor: '#d5edda',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  availableSlotText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
    marginBottom: 4,
  },
  slotDuration: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  // Today's Schedule Styles
  todayScheduleContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  todayScheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  todayScheduleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appointmentCount: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: 16,
    color: '#3498db',
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  emptyScheduleCollapsed: {
    padding: 20,
    alignItems: 'center',
  },
  emptyScheduleText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  workplacesCollapsedView: {
    padding: 16,
  },
  workplaceCollapsedTile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  workplaceCollapsedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  appointmentCountBadgeSmall: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  appointmentCountTextSmall: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  moreWorkplacesText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  workplacesExpandedContainer: {
    padding: 20,
  },
  workplaceTileExpanded: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  workplaceTileContent: {
    flex: 1,
    marginBottom: 12,
  },
  workplaceType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3498db',
    backgroundColor: '#e8f4fd',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  appointmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  futureBadge: {
    backgroundColor: '#27ae60',
  },
  viewAppointmentsButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  viewAppointmentsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Calendar Styles
  calendarContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  calendarTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginVertical: 20,
  },
  calendarDaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  calendarDay: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calendarDayToday: {
    backgroundColor: '#3498db',
    elevation: 4,
  },
  calendarDayFuture: {
    backgroundColor: '#ecf0f1',
    opacity: 0.7,
  },
  calendarDaySelected: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  calendarDayName: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 4,
  },
  calendarDayNameToday: {
    color: '#fff',
  },
  calendarDayNameFuture: {
    color: '#bdc3c7',
  },
  calendarDayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  calendarDayNumberToday: {
    color: '#fff',
  },
  calendarDayNumberFuture: {
    color: '#95a5a6',
  },
  calendarAppointmentsCount: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  appointmentsCountText: {
    fontSize: 10,
    color: '#3498db',
    fontWeight: '600',
  },
  appointmentsCountTextToday: {
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  selectedDayContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDayAppointments: {
    flex: 1,
    padding: 16,
  },
  emptyCalendarDay: {
    alignItems: 'center',
    padding: 40,
  },
  emptyCalendarText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  calendarAppointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  appointmentTimeSlot: {
    alignItems: 'center',
    marginRight: 16,
  },
  appointmentTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  appointmentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotBooked: {
    backgroundColor: '#27ae60',
  },
  statusDotAvailable: {
    backgroundColor: '#3498db',
  },
  statusDotCancelled: {
    backgroundColor: '#e74c3c',
  },
  appointmentDetails: {
    flex: 1,
  },
  calendarPatientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  calendarWorkplace: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  // Profile Modal Styles
  profileModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '95%',
    maxHeight: '85%',
    padding: 20,
  },
  profileHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  editProfileBtn: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editProfileBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  profileContent: {
    flex: 1,
  },
  profileSection: {
    marginBottom: 24,
  },
  profileSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileField: {
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  profileInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  addWorkplaceProfileBtn: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addWorkplaceProfileBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  workplaceProfileItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  workplaceProfileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workplaceProfileAddress: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  saveProfileBtn: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveProfileBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Calendar Container Styles
  calendarContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  calendarTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  calendarDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  calendarDay: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  calendarDayToday: {
    backgroundColor: '#3498db',
  },
  calendarDayFuture: {
    backgroundColor: '#ecf0f1',
  },
  calendarDaySelected: {
    backgroundColor: '#2980b9',
  },
  calendarDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  calendarDayNameToday: {
    color: '#fff',
  },
  calendarDayNameFuture: {
    color: '#95a5a6',
  },
  calendarDayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  calendarDayNumberToday: {
    color: '#fff',
  },
  calendarDayNumberFuture: {
    color: '#7f8c8d',
  },
  calendarAppointmentsCount: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  appointmentsCountText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  appointmentsCountTextToday: {
    backgroundColor: '#fff',
    color: '#3498db',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  selectedDayContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  selectedDayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectedDaySlots: {
    maxHeight: 400,
  },
  emptyCalendarDay: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCalendarText: {
    fontSize: 16,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  calendarSlotCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#95a5a6',
  },
  slotBooked: {
    borderLeftColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  slotAvailable: {
    borderLeftColor: '#27ae60',
    backgroundColor: '#f0f9f4',
  },
  slotCancelled: {
    borderLeftColor: '#f39c12',
    backgroundColor: '#fefbf3',
  },
  slotTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    minWidth: 80,
  },
  slotTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 8,
  },
  slotStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#95a5a6',
  },
  statusDotBooked: {
    backgroundColor: '#e74c3c',
  },
  statusDotAvailable: {
    backgroundColor: '#27ae60',
  },
  statusDotCancelled: {
    backgroundColor: '#f39c12',
  },
  slotDetails: {
    flex: 1,
  },
  slotPatientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  slotWorkplace: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  slotStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#95a5a6',
    textTransform: 'uppercase',
  },

  // Profile Container Styles
  profileContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  profileHeader: {
    marginBottom: 20,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
  },
  profileCard: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: 'center',
  },
  profilePhotoContainer: {
    marginBottom: 16,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  profileSpecialty: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#95a5a6',
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  profileValue: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  emptyWorkplaces: {
    padding: 20,
    alignItems: 'center',
  },
  emptyWorkplacesText: {
    fontSize: 16,
    color: '#95a5a6',
    marginBottom: 12,
  },
  addWorkplaceButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addWorkplaceButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  workplaceItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // New Profile Styles
  profileHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelEditButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelEditButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileDesignation: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  profileInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    marginLeft: 16,
  },
  addressInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  nonEditableText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  workplaceProfileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workplaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  workplaceLocation: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  workplaceContact: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  timingSection: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  timingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  timingText: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  loadMoreButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // New workplace and edit styles
  workplaceHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editWorkplaceButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editWorkplaceButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  editProfileMainButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  editProfileMainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  workplaceModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '95%',
    maxHeight: '85%',
    padding: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  workplaceForm: {
    maxHeight: 600,
  },
  formGroup: {
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2c3e50',
  },
  typeSelector: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
  },
  typeOptionSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  typeOptionTextSelected: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginVertical: 16,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  timingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    width: 80,
    marginRight: 8,
    flexShrink: 0,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    flexWrap: 'wrap',
    minWidth: 0,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    textAlign: 'center',
  },
  hourMinuteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginHorizontal: 2,
  },
  hourInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    width: 25,
    height: 32,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 4,
  },
  minuteInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    width: 25,
    height: 32,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 4,
  },
  colonText: {
    fontSize: 18,
    color: '#3498db',
    fontWeight: 'bold',
    marginHorizontal: 4,
    lineHeight: 20,
  },
  toText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  timeDropdown: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timeDropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  timeDropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    width: 120,
    margin: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  compactTimingContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  compactTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactTimingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    width: 70,
    marginRight: 8,
  },
  compactTimeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactTimeDropdown: {
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  compactTimeDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  compactColonText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: 'bold',
    marginHorizontal: 2,
  },
  compactToText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginHorizontal: 8,
  },
  durationDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  durationDropdownText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  checkboxContainer: {
    marginVertical: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  saveWorkplaceButton: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  saveWorkplaceButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Today's Schedule Styles
  workplacesScrollView: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  
  // Cancel Reason Modal Styles
  reasonsList: {
    marginBottom: 20,
  },
  reasonOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedReasonOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  reasonOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: '#2196f3',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196f3',
  },
  reasonText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  selectedReasonText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    marginTop: 10,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },

});
