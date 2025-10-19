import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { UserAPIService } from '../services/doctorApiService';
import TopBar from '../components/TopBar';
import BottomNavigation from '../components/BottomNavigation';

const CANCELLATION_REASONS = [
  'Personal emergency',
  'Schedule conflict',
  'Feeling better',
  'Doctor unavailable',
  'Travel issues',
  'Work commitment',
  'Family emergency',
  'Other'
];

export default function CancelAppointment({ route, navigation }) {
  const { userId, appointmentId } = route.params;
  
  const [allAppointments, setAllAppointments] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails();
    } else {
      fetchAllAppointments();
    }
  }, []);

  const fetchAllAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsData = await UserAPIService.fetchAllUserAppointments(userId);
      
      // Filter only BOOKED appointments that can be cancelled
      const cancellableAppointments = [];
      if (appointmentsData?.appointmentsByDate) {
        Object.values(appointmentsData.appointmentsByDate).forEach(dateAppointments => {
          dateAppointments.forEach(apt => {
            if (apt.status === 'BOOKED') {
              cancellableAppointments.push(apt);
            }
          });
        });
      }
      
      setAllAppointments(cancellableAppointments);
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

  const startCancelForAppointment = (selectedAppointment) => {
    setAppointment(selectedAppointment);
    setShowCancelForm(true);
  };

  const handleReasonSelection = (reason) => {
    setSelectedReason(reason);
    if (reason !== 'Other') {
      setCustomReason('');
    }
  };

  const proceedWithCancellation = () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for cancellation');
      return;
    }
    
    if (selectedReason === 'Other' && !customReason.trim()) {
      Alert.alert('Error', 'Please provide a custom reason for cancellation');
      return;
    }
    
    setShowConfirmModal(true);
  };

  const confirmCancellation = async () => {
    const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    
    try {
      setCancelling(true);
      
      // Call cancel appointment API
      await UserAPIService.cancelAppointment(appointmentId, {
        reason: finalReason,
        cancelledBy: 'user'
      });

      Alert.alert(
        'Appointment Cancelled',
        'Your appointment has been cancelled successfully. If applicable, any refund will be processed according to our policy.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowConfirmModal(false);
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to cancel appointment. Please try again or contact support.'
      );
    } finally {
      setCancelling(false);
    }
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

  const canCancelAppointment = (appointment) => {
    if (!appointment) return false;
    
    // Cannot cancel if already cancelled or completed
    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      return false;
    }
    
    // Check if appointment is in the future (basic check)
    // In a real app, you'd parse the actual appointment date/time
    return true;
  };

  if (loading) {
    return (
      <View style={styles.container}>
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
        style={styles.cancelButton}
        onPress={() => startCancelForAppointment(appointment)}
      >
        <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
      </TouchableOpacity>
    </View>
  );

  if (!appointment && !showCancelForm) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <Text style={styles.pageTitle}>❌ Select Appointment to Cancel</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading appointments...</Text>
            </View>
          ) : allAppointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Appointments to Cancel</Text>
              <Text style={styles.emptySubtitle}>You don't have any booked appointments that can be cancelled.</Text>
            </View>
          ) : (
            <ScrollView style={styles.appointmentsContainer} showsVerticalScrollIndicator={true}>
              {allAppointments.map(renderAppointmentCard)}
            </ScrollView>
          )}
        </ScrollView>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Appointment not found</Text>
        </View>
      </View>
    );
  }

  const canCancel = canCancelAppointment(appointment);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.pageTitle}>❌ Cancel Appointment</Text>
        
        {/* Appointment Details */}
        <View style={styles.appointmentCard}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
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
            <Text style={styles.detailLabel}>🕐 Time:</Text>
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
          
          {appointment.notes && (
            <View style={styles.appointmentDetail}>
              <Text style={styles.detailLabel}>📝 Notes:</Text>
              <Text style={styles.detailValue}>{appointment.notes}</Text>
            </View>
          )}
        </View>
        
        {!canCancel ? (
          <View style={styles.cannotCancelCard}>
            <Text style={styles.cannotCancelIcon}>⚠️</Text>
            <Text style={styles.cannotCancelTitle}>Cannot Cancel</Text>
            <Text style={styles.cannotCancelText}>
              {appointment.status === 'CANCELLED' 
                ? 'This appointment is already cancelled.'
                : appointment.status === 'COMPLETED'
                ? 'This appointment has already been completed.'
                : 'This appointment cannot be cancelled at this time.'
              }
            </Text>
          </View>
        ) : (
          <>
            {/* Cancellation Policy */}
            <View style={styles.policyCard}>
              <Text style={styles.policyTitle}>📋 Cancellation Policy</Text>
              <Text style={styles.policyText}>
                • Appointments can be cancelled up to 2 hours before the scheduled time{'\n'}
                • Cancellations within 2 hours may incur a fee{'\n'}
                • Refunds (if applicable) will be processed within 3-5 business days{'\n'}
                • Multiple last-minute cancellations may affect future booking privileges
              </Text>
            </View>
            
            {/* Reason Selection */}
            <View style={styles.reasonSection}>
              <Text style={styles.sectionTitle}>Why are you cancelling?</Text>
              <Text style={styles.sectionSubtitle}>
                Please select a reason to help us improve our service
              </Text>
              
              {CANCELLATION_REASONS.map((reason, index) => (
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
                  style={styles.customReasonInput}
                  placeholder="Please specify your reason..."
                  multiline={true}
                  numberOfLines={3}
                  value={customReason}
                  onChangeText={setCustomReason}
                  textAlignVertical="top"
                />
              )}
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelAppointmentButton,
                  !selectedReason && styles.disabledButton
                ]}
                onPress={proceedWithCancellation}
                disabled={!selectedReason}
              >
                <Text style={styles.cancelAppointmentButtonText}>
                  ❌ Cancel Appointment
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.keepAppointmentButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.keepAppointmentButtonText}>
                  ✅ Keep Appointment
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>⚠️</Text>
            <Text style={styles.modalTitle}>Confirm Cancellation</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to cancel this appointment?{'\n\n'}
              <Text style={styles.modalBoldText}>This action cannot be undone.</Text>
            </Text>
            
            <View style={styles.modalAppointmentInfo}>
              <Text style={styles.modalInfoText}>
                Appointment #{appointment.id}{'\n'}
                {appointment.slot} at {appointment.workplaceName}
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalKeepButton}
                onPress={() => setShowConfirmModal(false)}
                disabled={cancelling}
              >
                <Text style={styles.modalKeepText}>Keep Appointment</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  cancelling && styles.disabledButton
                ]}
                onPress={confirmCancellation}
                disabled={cancelling}
              >
                <Text style={styles.modalCancelText}>
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <BottomNavigation 
        activeTab="appointments"
        userType="user"
        userId={userId}
        currentScreen="CancelAppointment"
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
  appointmentCard: {
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
    borderLeftColor: '#e74c3c',
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
  cannotCancelCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  cannotCancelIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  cannotCancelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  cannotCancelText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  policyCard: {
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
    borderLeftColor: '#3498db',
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  policyText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  reasonSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  reasonOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  selectedReasonOption: {
    backgroundColor: '#ebf3fd',
    borderColor: '#3498db',
  },
  reasonOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioButton: {
    borderColor: '#3498db',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
  },
  reasonText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  selectedReasonText: {
    color: '#3498db',
    fontWeight: '500',
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    marginTop: 10,
    backgroundColor: '#f8f9fa',
    textAlignVertical: 'top',
  },
  actionButtons: {
    marginBottom: 20,
  },
  cancelAppointmentButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  cancelAppointmentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  keepAppointmentButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  keepAppointmentButtonText: {
    fontSize: 16,
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
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  modalBoldText: {
    fontWeight: '600',
    color: '#e74c3c',
  },
  modalAppointmentInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  modalInfoText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalKeepButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  modalKeepText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  appointmentsContainer: {
    maxHeight: 500,
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
  cancelButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
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
});
