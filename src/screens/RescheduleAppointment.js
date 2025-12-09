import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { UserAPIService, SlotsAPIService, DoctorAPIService } from '../services/doctorApiService';
import TopBar from '../components/TopBar';
import BottomNavigation from '../components/BottomNavigation';
import DatePicker from '../components/DatePicker';
import CalendarPromptService from '../services/calendarPromptService';

const RESCHEDULE_REASONS = [
  'Schedule conflict',
  'Personal emergency', 
  'Work commitment',
  'Transportation issues',
  'Doctor requested',
  'Medical reasons',
  'Family emergency',
  'Other'
];

const REVISIT_REASONS = [
  'Follow-up consultation',
  'Medication review',
  'Test results discussion',
  'Treatment progress check',
  'Routine check-up',
  'Doctor recommended',
  'Symptom monitoring',
  'Other'
];

// Helper function to format time slot in "09:00AM - 09:30AM" format
const formatTimeSlot = (startTime, endTime) => {
  // Check if both times are provided
  if (!startTime || !endTime) {
    console.error('formatTimeSlot: Missing time values', { startTime, endTime });
    return 'Invalid Time Slot';
  }
  
  const formatTime = (timeString) => {
    try {
      // Ensure timeString is a string
      const timeStr = String(timeString);
      
      // Handle both HH:mm:ss and HH:mm formats
      const timeParts = timeStr.split(':');
      
      if (timeParts.length < 2) {
        console.error('formatTime: Invalid time format', timeString);
        return 'Invalid Time';
      }
      
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      
      if (isNaN(hours)) {
        console.error('formatTime: Invalid hours', timeString);
        return 'Invalid Time';
      }
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      
      return `${hours.toString().padStart(2, '0')}:${minutes}${ampm}`;
    } catch (error) {
      console.error('formatTime error:', error, 'for time:', timeString);
      return 'Invalid Time';
    }
  };
  
  try {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  } catch (error) {
    console.error('formatTimeSlot error:', error);
    return 'Invalid Time Slot';
  }
};

export default function RescheduleAppointment({ route, navigation }) {
  const { userId: routeUserId, appointmentId, fromDoctorView, fromRevisit, patientData, appointment: routeAppointment } = route.params;
  
  // For revisit mode, extract userId from appointment object, otherwise use routeUserId
  const userId = fromRevisit 
    ? (routeAppointment?.userId || routeAppointment?.patientId || routeUserId)
    : routeUserId;
    
  console.log('🔍 RescheduleAppointment params:', { userId, appointmentId, fromRevisit, hasRouteAppointment: !!routeAppointment });
  
  const [allAppointments, setAllAppointments] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [allSlotsData, setAllSlotsData] = useState({}); // Store all slots grouped by date
  const [availableDates, setAvailableDates] = useState([]); // Array of available dates
  const [selectedDate, setSelectedDate] = useState(null); // Currently selected date
  const [currentDateSlots, setCurrentDateSlots] = useState([]); // Slots for current selected date
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showSlotSelection, setShowSlotSelection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);
  const [customSelectedDate, setCustomSelectedDate] = useState(null); // Date selected from calendar picker

  // Refs for auto-focus and scroll
  const modalScrollRef = useRef(null);
  const customReasonInputRef = useRef(null);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails();
    } else if (fromRevisit) {
      // In revisit mode, go directly to slot selection with the passed appointment
      if (routeAppointment) {
        setAppointment(routeAppointment);
        setShowSlotSelection(true);
        fetchAvailableSlots(routeAppointment.workplaceId, routeAppointment.doctorId);
      }
    } else {
      // Normal mode: fetch all appointments to select from
      fetchAllAppointments();
    }
  }, []);

  const fetchAllAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsData = await UserAPIService.fetchAllUserAppointments(userId);
      
      // Filter only BOOKED appointments that can be rescheduled
      const bookableAppointments = [];
      if (appointmentsData?.appointmentsByDate) {
        Object.values(appointmentsData.appointmentsByDate).forEach(dateAppointments => {
          dateAppointments.forEach(apt => {
            if (apt.status === 'BOOKED') {
              bookableAppointments.push(apt);
            }
          });
        });
      }
      
      setAllAppointments(bookableAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      // Fetch current appointment details
      const appointmentsData = await UserAPIService.fetchAllUserAppointments(userId);
      const currentAppointment = findAppointmentById(appointmentsData, appointmentId);
      
      if (currentAppointment) {
        setAppointment(currentAppointment);
        // Fetch available slots for the same workplace using the doctorId from appointment
        await fetchAvailableSlots(currentAppointment.workplaceId, currentAppointment.doctorId);
      } else {
        Alert.alert('Error', 'Appointment not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      Alert.alert('Error', 'Failed to load appointment details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const findAppointmentById = (appointmentsData, targetId) => {
    if (!appointmentsData || !appointmentsData.appointmentsByDate) return null;
    
    for (const date in appointmentsData.appointmentsByDate) {
      const appointment = appointmentsData.appointmentsByDate[date].find(
        apt => apt.id === targetId
      );
      if (appointment) return appointment;
    }
    return null;
  };

  const fetchAvailableSlots = async (workplaceId, doctorId, selectedDateForSlots = null) => {
    try {
      if (!doctorId) {
        console.error('Doctor ID not provided');
        Alert.alert('Error', 'Doctor information not available');
        return;
      }
      
      console.log('🔍 Fetching slots for doctorId:', doctorId, 'workplaceId:', workplaceId);
      
      const params = { doctorId };
      if (selectedDateForSlots) {
        params.date = selectedDateForSlots;
      }
      
      const slotsData = await SlotsAPIService.getAvailableSlots(workplaceId, params);
      
      // console.log('📅 Received slots data:', slotsData);
      
      // Check if we received the structured response
      if (!slotsData.slotsByDate) {
        console.warn('⚠️ No slotsByDate found in response:', slotsData);
        setAllSlotsData({});
        setAvailableDates([]);
        setCurrentDateSlots([]);
        return;
      }
      
      // Store all slots data and process dates
      const currentAppointmentSlot = appointment?.slot;
      const now = new Date();
      const processedSlotsByDate = {};
      const dates = [];
      
      Object.entries(slotsData.slotsByDate).forEach(([date, timeSlots]) => {
        // Create a Date object for this slot to check if it's in the future
        const [datePart] = date.split('T'); // Handle ISO dates
        const slotDate = new Date(datePart + 'T12:00:00'); // Use noon to avoid timezone issues
        
        // Only include future dates
        if (slotDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          const dateSlots = [];
          
          // Process timeSlots (could be empty array)
          if (timeSlots && timeSlots.length > 0) {
            timeSlots.forEach((timeSlot, index) => {
              // Skip current appointment slot
              if (timeSlot === currentAppointmentSlot) return;
              
              dateSlots.push({
                id: `${date}-${index}`,
                date: date,
                slotTime: timeSlot,
                dateTime: `${date}T${convertTo24Hour(timeSlot)}`,
                isAvailable: true,
                workplaceId: slotsData.workplaceId,
                doctorId: slotsData.doctorId,
                doctorName: slotsData.doctorName,
                workplaceName: slotsData.workplaceName
              });
            });
          }
          
          // Include date even if no slots available
          processedSlotsByDate[date] = dateSlots;
          dates.push(date);
        }
      });
      
      // Sort dates chronologically
      dates.sort();
      
      // console.log('🎯 Processed slots by date:', processedSlotsByDate);
      // console.log('📅 Available dates:', dates);
      
      setAllSlotsData(processedSlotsByDate);
      setAvailableDates(dates);
      
      // Set appropriate selected date
      if (selectedDateForSlots && dates.includes(selectedDateForSlots)) {
        setSelectedDate(selectedDateForSlots);
        setCurrentDateSlots(processedSlotsByDate[selectedDateForSlots] || []);
      } else if (dates.length > 0) {
        setSelectedDate(dates[0]);
        setCurrentDateSlots(processedSlotsByDate[dates[0]] || []);
      } else {
        setSelectedDate(null);
        setCurrentDateSlots([]);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      Alert.alert('Error', 'Failed to load available slots');
    }
  };

  const startRescheduleForAppointment = async (selectedAppointment) => {
    setAppointment(selectedAppointment);
    setShowSlotSelection(true);
    await fetchAvailableSlots(selectedAppointment.workplaceId, selectedAppointment.doctorId);
  };

  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
  };

  const goToPreviousDate = () => {
    if (!selectedDate || availableDates.length === 0) return;
    
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex > 0) {
      const newDate = availableDates[currentIndex - 1];
      setSelectedDate(newDate);
      setCurrentDateSlots(allSlotsData[newDate] || []);
      setSelectedSlot(null); // Clear selected slot when changing date
    }
  };

  const goToNextDate = () => {
    if (!selectedDate || availableDates.length === 0) return;
    
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex < availableDates.length - 1) {
      const newDate = availableDates[currentIndex + 1];
      setSelectedDate(newDate);
      setCurrentDateSlots(allSlotsData[newDate] || []);
      setSelectedSlot(null); // Clear selected slot when changing date
    }
  };

  const getCurrentDateIndex = () => {
    if (!selectedDate || availableDates.length === 0) return 0;
    return availableDates.indexOf(selectedDate) + 1;
  };

  const handleDatePickerSelect = async (date) => {
    if (!appointment) return;
    
    try {
      setLoading(true);
      setCustomSelectedDate(date);
      
      // Clear current slot selection when date changes
      setSelectedSlot(null);
      
      if (date) {
        // Load slots for specific date
        await fetchAvailableSlots(appointment.workplaceId, appointment.doctorId, date);
      } else {
        // Load default slots (next 3 days)
        await fetchAvailableSlots(appointment.workplaceId, appointment.doctorId, null);
      }
    } catch (error) {
      console.error('Error loading slots for selected date:', error);
      Alert.alert('Error', 'Failed to load slots for selected date. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const proceedWithReschedule = () => {
    console.log('🔄 proceedWithReschedule called - fromRevisit:', fromRevisit);
    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a new time slot');
      return;
    }

    if (fromRevisit) {
      console.log('📅 Showing revisit confirmation popup for:', selectedSlot.slotTime);
      // For revisit appointments, show simple confirmation instead of reason modal
      Alert.alert(
        'Confirm Next Visit',
        `Reschedule current appointment to ${selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })} at ${selectedSlot.slotTime} as a revisit appointment?\n\nThis will be marked as a revisit booked by doctor.`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Confirm',
            onPress: () => handleFinalSubmission('Revisit booked by doctor') // Use default reason for revisits
          }
        ]
      );
    } else {
      // For regular reschedules, show reason modal
      setShowReasonModal(true);
    }
  };

  const handleReasonSelection = (reason) => {
    setSelectedReason(reason);
    if (reason !== 'Other') {
      setCustomReason('');
    } else {
      // Auto-focus and scroll to text input when "Other" is selected
      setTimeout(() => {
        if (customReasonInputRef.current) {
          customReasonInputRef.current.focus();
          // Scroll to the bottom to ensure the text input is visible
          if (modalScrollRef.current) {
            modalScrollRef.current.scrollToEnd({ animated: true });
          }
        }
      }, 100);
    }
  };

  const handleFinalSubmission = async (reason) => {
    try {
      setRescheduling(true);
      
      // Debug logging
      const finalReason = reason;
      
      console.log('🔍 Selected slot data:', selectedSlot);
      console.log('📅 Selected date:', selectedDate);
      console.log('📝 Reason:', finalReason);
      
      // Show calendar prompt for rescheduling (unless it's a revisit)
      let calendarChoice = { updateCalendar: false };
      if (!fromRevisit) {
        const appointmentDetails = {
          doctorName: appointment.doctorName || 'Doctor',
          workplaceName: appointment.workplaceName,
          oldDate: new Date(appointment.appointmentDate || appointment.requestedTime).toLocaleDateString(),
          oldTime: appointment.slot,
          newDate: new Date(selectedDate).toLocaleDateString(),
          newTime: selectedSlot.slotTime
        };

        calendarChoice = await CalendarPromptService.promptForReschedule(appointmentDetails);
      }
      
      // Validate required data
      if (!selectedSlot || !selectedDate) {
        throw new Error('Missing required data: selectedSlot or selectedDate');
      }
      
      // Check if slot has slotTime property (same as booking flow)
      if (!selectedSlot.slotTime) {
        throw new Error('Missing slotTime in selectedSlot');
      }
      
      console.log('⏰ Slot time from selectedSlot:', selectedSlot.slotTime);
      
      let result;
      
      // Both revisits and regular reschedules use the same data structure
      const rescheduleData = {
        appointmentId: appointmentId,
        reason: fromRevisit ? 'Revisit booked by doctor' : finalReason,
        newAppointmentDate: selectedDate,
        newTimeSlot: selectedSlot.slotTime  // Use slotTime directly (already formatted)
      };
      
      console.log('📤 Sending reschedule data:', rescheduleData);
      
      result = await UserAPIService.rescheduleAppointment(appointmentId, rescheduleData);

      // If this is a revisit and reschedule was successful, complete the original appointment
      if (fromRevisit && result && appointmentId) {
        try {
          console.log('📤 Auto-completing original appointment:', appointmentId);
          await DoctorAPIService.completeAppointment(appointmentId);
          console.log('✅ Original appointment completed successfully');
        } catch (completeError) {
          console.error('❌ Error completing original appointment:', completeError);
          // Continue with success message - reschedule was successful, completion can be done manually
        }
      }

      // Show success message with calendar integration status
      const successMessage = result.message || (fromRevisit 
        ? 'Appointment rescheduled as revisit successfully! Original appointment has been completed.'
        : 'Your appointment has been rescheduled successfully!');

      CalendarPromptService.showSuccessMessage('reschedule', {
        success: true,
        calendarIntegrated: result.calendarEventUpdated || calendarChoice.updateCalendar,
        message: successMessage
      });

      // Navigate back after a short delay
      setTimeout(() => {
        setShowReasonModal(false);
        if (fromRevisit && appointment) {
          // Reset navigation stack and navigate to AllBookings page
          navigation.reset({
            index: 1,
            routes: [
              { name: 'DoctorHome' },
              { 
                name: 'AllBookings', 
                params: {
                  doctorId: appointment.doctorId,
                  workplaceId: appointment.workplaceId,
                  workplaceName: appointment.workplaceName || 'Workplace',
                  refresh: true
                }
              }
            ]
          });
        } else {
          // Regular reschedule - go back to previous screen
          navigation.goBack();
        }
      }, 1500);

    } catch (error) {
      console.error(fromRevisit ? 'Error rescheduling revisit appointment:' : 'Error rescheduling appointment:', error);
      Alert.alert(
        'Error',
        error.message || (fromRevisit 
          ? 'Failed to reschedule appointment as revisit. Please try again.'
          : 'Failed to reschedule appointment. Please try again.')
      );
    } finally {
      setRescheduling(false);
    }
  };

  const confirmReschedule = async () => {
    if (!selectedReason) {
      Alert.alert('Error', fromRevisit 
        ? 'Please select a reason for booking the next visit'
        : 'Please select a reason for rescheduling'
      );
      return;
    }

    if (selectedReason === 'Other' && !customReason.trim()) {
      Alert.alert('Error', 'Please specify your reason for rescheduling');
      return;
    }

    const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    await handleFinalSubmission(finalReason);
  };

  const formatSlotDateTime = (slot) => {
    const date = new Date(slot.dateTime);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `${dateStr} at ${slot.slotTime}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BOOKED': return '#27ae60';
      case 'CANCELLED': return '#e74c3c';
      case 'RESCHEDULED': return '#f39c12';
      case 'COMPLETED': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  const convertTo24Hour = (timeStr) => {
    // Convert time format like "9:00AM - 9:30AM" to "09:00:00"
    const [startTime] = timeStr.split(' - ');
    const [time, period] = startTime.split(/(?=[AP]M)/);
    let [hours, minutes] = time.split(':');
    
    hours = parseInt(hours);
    minutes = parseInt(minutes) || 0;
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  if (loading) {
    return (
      <View style={[
        styles.container,
        fromDoctorView && {
          paddingTop: 20,
          paddingBottom: 20
        }
      ]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading appointment details...</Text>
        </View>
      </View>
    );
  }

  const renderAppointmentCard = (appointment) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <Text style={styles.appointmentId}>#{appointment.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
          <Text style={styles.statusText}>{appointment.status}</Text>
        </View>
      </View>
      
      <Text style={styles.appointmentTime}>
        🕐 {appointment.slot} • {new Date(appointment.appointmentDate).toLocaleDateString()}
      </Text>
      
      <Text style={styles.workplaceInfo}>
        🏥 {appointment.workplaceName}
      </Text>
      
      <Text style={styles.queuePosition}>
        📍 Queue Position: #{appointment.queuePosition}
      </Text>
      
      <TouchableOpacity 
        style={styles.rescheduleButton}
        onPress={() => startRescheduleForAppointment(appointment)}
      >
        <Text style={styles.rescheduleButtonText}>Reschedule</Text>
      </TouchableOpacity>
    </View>
  );

  if (!appointment && !showSlotSelection) {
    return (
      <View style={[
        styles.container,
        fromDoctorView && {
          paddingTop: 20,
          paddingBottom: 20
        }
      ]}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>
            {fromRevisit ? '� Book Next Visit' : '�🔄 Select Appointment to Reschedule'}
          </Text>
          
          {!loading && allAppointments.length > 0 && (
            <Text style={styles.appointmentsSubtitle}>
              📋 Your Appointments (Scroll to see more)
            </Text>
          )}
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading appointments...</Text>
            </View>
          ) : allAppointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Appointments to Reschedule</Text>
              <Text style={styles.emptySubtitle}>You don't have any booked appointments that can be rescheduled.</Text>
            </View>
          ) : (
            <View style={styles.appointmentsWrapper}>
              {allAppointments.map(renderAppointmentCard)}
            </View>
          )}
        </View>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[
        styles.container,
        fromDoctorView && {
          paddingTop: 20,
          paddingBottom: 20
        }
      ]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Appointment not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      fromDoctorView && {
        paddingTop: 20,
        paddingBottom: 20
      }
    ]}>
      <ScrollView style={styles.content}>
        <Text style={styles.pageTitle}>
          {fromRevisit ? '� Book Next Visit' : '�🔄 Reschedule Appointment'}
        </Text>
        
        {/* Current Appointment Details */}
        <View style={styles.currentAppointmentCard}>
          <Text style={styles.sectionTitle}>Current Appointment</Text>
          <View style={styles.appointmentHeader}>
            <Text style={styles.appointmentId}>#{appointment.id}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(appointment.status) }
            ]}>
              <Text style={styles.statusText}>{appointment.status}</Text>
            </View>
          </View>
          
          <View style={styles.appointmentDetail}>
            <Text style={styles.detailLabel}>🕐 Current Time:</Text>
            <Text style={styles.detailValue}>{appointment.slot}</Text>
          </View>
          
          <View style={styles.appointmentDetail}>
            <Text style={styles.detailLabel}>🏥 Workplace:</Text>
            <Text style={styles.detailValue}>{appointment.workplaceName}</Text>
          </View>
          
          <View style={styles.appointmentDetail}>
            <Text style={styles.detailLabel}>📍 Address:</Text>
            <Text style={styles.detailValue}>{appointment.workplaceAddress}</Text>
          </View>
          
          <View style={styles.appointmentDetail}>
            <Text style={styles.detailLabel}>🏃 Queue Position:</Text>
            <Text style={styles.detailValue}>#{appointment.queuePosition}</Text>
          </View>
        </View>
        
        {/* Available Slots */}
        <View style={styles.slotsSection}>
          <Text style={styles.sectionTitle}>Select New Time Slot</Text>
          
          {/* Date Picker Section */}
          <View style={styles.datePickerSection}>
            <Text style={styles.datePickerLabel}>Select New Appointment Date:</Text>
            <DatePicker
              selectedDate={customSelectedDate}
              onDateSelect={handleDatePickerSelect}
              title="Select New Appointment Date"
              buttonTitle={customSelectedDate ? null : "Select specific date or use default (next 3 days)"}
              minDate={new Date().toISOString().split('T')[0]}
              maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // 30 days from now
            />
            {customSelectedDate && (
              <Text style={styles.selectedDateInfo}>
                📅 Showing slots for: {new Date(customSelectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            )}
            {!customSelectedDate && (
              <Text style={styles.defaultDateInfo}>
                📅 Showing available slots for the next 3 days
              </Text>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading slots...</Text>
            </View>
          ) : availableDates.length === 0 ? (
            <View style={styles.noSlotsContainer}>
              <Text style={styles.noSlotsIcon}>⚠️</Text>
              <Text style={styles.noSlotsTitle}>No Available Slots</Text>
              <Text style={styles.noSlotsSubtitle}>
                {customSelectedDate 
                  ? `No slots available for ${new Date(customSelectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. Please select a different date.`
                  : 'There are currently no available slots for rescheduling at this workplace. Please try again later or contact support.'
                }
              </Text>
            </View>
          ) : (
            <>
              {/* Date Navigation - Only show if not using custom date picker */}
              {!customSelectedDate && availableDates.length > 1 && (
                <View style={styles.dateNavigation}>
                  <TouchableOpacity 
                    style={[
                      styles.dateNavButton,
                      availableDates.indexOf(selectedDate) === 0 && styles.disabledButton
                    ]}
                    onPress={goToPreviousDate}
                    disabled={availableDates.indexOf(selectedDate) === 0}
                  >
                    <Text style={[
                      styles.dateNavButtonText,
                      availableDates.indexOf(selectedDate) === 0 && styles.disabledButtonText
                    ]}>
                      ← Previous
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={styles.dateInfo}>
                    <Text style={styles.currentDate}>
                      {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </Text>
                    <Text style={styles.dateCounter}>
                      {getCurrentDateIndex()} of {availableDates.length}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.dateNavButton,
                      availableDates.indexOf(selectedDate) === availableDates.length - 1 && styles.disabledButton
                    ]}
                    onPress={goToNextDate}
                    disabled={availableDates.indexOf(selectedDate) === availableDates.length - 1}
                  >
                    <Text style={[
                      styles.dateNavButtonText,
                      availableDates.indexOf(selectedDate) === availableDates.length - 1 && styles.disabledButtonText
                    ]}>
                      Next →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Current Date Display for Custom Selected Date */}
              {customSelectedDate && (
                <View style={styles.customDateDisplay}>
                  <Text style={styles.customDateText}>
                    {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              )}

              {/* Slots for Selected Date */}
              <Text style={styles.slotsTitle}>📅 Available Time Slots</Text>
              <View style={styles.slotsContainer}>
                <ScrollView 
                  style={styles.slotsScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {currentDateSlots.length === 0 ? (
                    <View style={styles.noSlotsContainer}>
                      <Text style={styles.noSlotsIcon}>🚫</Text>
                      <Text style={styles.noSlotsTitle}>No Available Slots</Text>
                      <Text style={styles.noSlotsMessage}>
                        There are no available slots for {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}.
                      </Text>
                      <Text style={styles.noSlotsSubMessage}>
                        Please check another day using the date navigation above.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.slotsGrid}>
                      {currentDateSlots.map((slot) => (
                        <TouchableOpacity
                          key={slot.id}
                          style={[
                            styles.slotCard,
                            selectedSlot?.id === slot.id && styles.selectedSlotCard
                          ]}
                          onPress={() => handleSlotSelection(slot)}
                        >
                          <Text style={[
                            styles.slotTime,
                            selectedSlot?.id === slot.id && styles.selectedSlotTime
                          ]}>
                            {slot.slotTime}
                          </Text>
                          <View style={[
                            styles.availabilityBadge,
                            slot.isAvailable ? styles.availableBadge : styles.unavailableBadge
                          ]}>
                            <Text style={styles.availabilityText}>
                              {slot.isAvailable ? 'Available' : 'Unavailable'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </View>
            </>
          )}
        </View>
        
        {/* Action Buttons */}
        {availableDates.length > 0 && currentDateSlots.length > 0 && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.rescheduleButton,
                !selectedSlot && styles.disabledButton
              ]}
              onPress={proceedWithReschedule}
              disabled={!selectedSlot}
            >
              <Text style={styles.rescheduleButtonText}>
                {fromRevisit ? '� Book Next Visit' : '�🔄 Reschedule Appointment'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      {/* Reason Modal */}
      <Modal
        visible={showReasonModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReasonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reason for Rescheduling</Text>
            <Text style={styles.modalSubtitle}>
              {fromRevisit 
                ? 'Please select a reason for booking the next visit'
                : 'Please select a reason for rescheduling your appointment'
              }
            </Text>
            
            <ScrollView 
              ref={modalScrollRef}
              style={styles.reasonsList} 
              showsVerticalScrollIndicator={false}
            >
              {(fromRevisit ? REVISIT_REASONS : RESCHEDULE_REASONS).map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.reasonOption,
                    selectedReason === reason && styles.selectedReasonOption
                  ]}
                  onPress={() => handleReasonSelection(reason)}
                >
                  <View style={styles.reasonOptionContent}>
                    <View style={[
                      styles.radioButton,
                      selectedReason === reason && styles.selectedRadioButton
                    ]}>
                      {selectedReason === reason && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[
                      styles.reasonText,
                      selectedReason === reason && styles.selectedReasonText
                    ]}>
                      {reason}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {selectedReason === 'Other' && (
                <TextInput
                  ref={customReasonInputRef}
                  style={styles.customReasonInput}
                  placeholder="Please specify your reason..."
                  multiline={true}
                  numberOfLines={3}
                  value={customReason}
                  onChangeText={setCustomReason}
                  textAlignVertical="top"
                />
              )}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowReasonModal(false)}
                disabled={rescheduling}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  (rescheduling || !selectedReason) && styles.disabledButton
                ]}
                onPress={confirmReschedule}
                disabled={rescheduling || !selectedReason}
              >
                <Text style={styles.modalConfirmText}>
                  {rescheduling ? 'Processing...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Only show bottom navigation if not accessed from doctor's view or revisit */}
      {!fromDoctorView && !fromRevisit && (
        <BottomNavigation 
          activeTab="appointments"
          userType="user"
          userId={userId}
          currentScreen="RescheduleAppointment"
          navigation={navigation}
          onTabChange={(tab) => {
            switch (tab) {
              case 'appointments':
                navigation.navigate('UserHome', { userId });
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
    paddingBottom: 100,
  },
  content: {
    flex: 1,
    padding: 20,
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
    textAlign: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  currentAppointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  appointmentId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  appointmentDetail: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 2,
  },
  slotsSection: {
    marginBottom: 20,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dateNavButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
  },
  dateNavButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#7f8c8d',
  },
  dateInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  currentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  dateCounter: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  noSlotsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  noSlotsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noSlotsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  noSlotsSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    paddingLeft: 4,
  },
  slotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 12,
  },
  slotsContainer: {
    height: 450,
    marginBottom: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  noSlotsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  noSlotsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noSlotsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12,
    textAlign: 'center',
  },
  noSlotsMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  noSlotsSubMessage: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  slotsScrollView: {
    flex: 1,
    padding: 4,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
    gap: 4,
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
    width: '32%', // Three slots per row for more compact view
    alignItems: 'center',
  },
  selectedSlotCard: {
    borderColor: '#3498db',
    backgroundColor: '#ebf3fd',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedSlotTime: {
    color: '#3498db',
  },
  availabilityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  availableBadge: {
    backgroundColor: '#27ae60',
  },
  unavailableBadge: {
    backgroundColor: '#e74c3c',
  },
  availabilityText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  slotDate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  selectedSlotDate: {
    color: '#2980b9',
  },
  slotCapacity: {
    fontSize: 12,
    color: '#95a5a6',
  },
  selectedSlotCapacity: {
    color: '#2980b9',
  },
  actionButtons: {
    marginBottom: 15,
  },
  rescheduleButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  rescheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacing: {
    height: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  reasonsList: {
    maxHeight: 300,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  appointmentsSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  appointmentsWrapper: {
    marginBottom: 20,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  workplaceInfo: {
    fontSize: 14,
    color: '#2980b9',
    marginBottom: 8,
  },
  queuePosition: {
    fontSize: 14,
    color: '#8e44ad',
    marginBottom: 12,
  },
  rescheduleButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  rescheduleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  datePickerSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  selectedDateInfo: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  defaultDateInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  customDateDisplay: {
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  customDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2980b9',
  },
});
