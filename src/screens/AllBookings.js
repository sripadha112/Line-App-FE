import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DoctorAPIService } from '../services/doctorApiService';
import TopBar from '../components/TopBar';
import BottomNavigation from '../components/BottomNavigation';
import API_BASE_URL from '../config';
import SecureStore from '../utils/secureStorage';
import { showAlert } from '../utils/alertUtils';
import { SkeletonAllBookings } from '../components/skeletons';

export default function AllBookings({ route, navigation }) {
  const { doctorId, workplaceId, workplaceName, refresh } = route.params;
  
  const [appointmentsByDate, setAppointmentsByDate] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [todaySectionCollapsed, setTodaySectionCollapsed] = useState(!refresh); // Expand if coming from refresh (revisit booking)
  const [familyMembersCache, setFamilyMembersCache] = useState({}); // Cache family members by userId

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Auto-refresh when screen comes into focus (after returning from other screens)
  useFocusEffect(
    React.useCallback(() => {
      console.log('AllBookings screen focused - refreshing appointments...');
      fetchAppointments();
    }, [doctorId, workplaceId])
  );

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await DoctorAPIService.fetchAppointmentsByWorkplace(doctorId, workplaceId);
      setAppointmentsByDate(data);
      
      // Fetch family members for appointments with patientMemberId
      await fetchFamilyMembersForAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showAlert('Error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembersForAppointments = async (appointmentsByDate) => {
    const userIdsToFetch = new Set();
    
    // Collect all userIds that have family appointments
    appointmentsByDate.forEach(dateGroup => {
      dateGroup.appointments.forEach(apt => {
        if (apt.patientMemberId || apt.patient_member_id) {
          userIdsToFetch.add(apt.userId);
        }
      });
    });

    // Fetch family members for each userId
    const newCache = { ...familyMembersCache };
    for (const userId of userIdsToFetch) {
      if (!newCache[userId]) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/${userId}/family-members`, {
            headers: {
              'Authorization': `Bearer ${await SecureStore.getItemAsync('accessToken')}`
            }
          });
          if (response.ok) {
            const familyMembers = await response.json();
            newCache[userId] = familyMembers;
          }
        } catch (error) {
          console.error(`Error fetching family members for user ${userId}:`, error);
        }
      }
    }
    setFamilyMembersCache(newCache);
  };

  const getFamilyMemberDetails = (appointment) => {
    const memberId = appointment.patientMemberId || appointment.patient_member_id;
    if (!memberId) return null;
    
    const familyMembers = familyMembersCache[appointment.userId];
    if (!familyMembers) return null;
    
    return familyMembers.find(member => member.id === memberId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const toggleSection = (date) => {
    setCollapsedSections(prev => ({
      ...prev,
      [date]: prev[date] === undefined ? false : !prev[date] // If undefined, expand it; otherwise toggle
    }));
  };

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const todayData = appointmentsByDate.find(item => item.appointmentDate === today);
    return todayData ? todayData.appointments : [];
  };

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointmentsByDate.filter(item => item.appointmentDate > today);
  };

  const handleViewProfile = (appointment) => {
    // Navigate to patient profile or show modal
    showAlert('View Profile', `Viewing profile for ${appointment.patientName}`);
  };

  const handleReschedule = (appointment) => {
    // Navigate to existing reschedule screen with appointment details
    navigation.navigate('RescheduleAppointment', {
      appointmentId: appointment.appointmentId,
      userId: appointment.userId || appointment.patientId, // Use whichever field contains the patient's user ID
      patientName: appointment.patientName,
      currentDateTime: appointment.appointmentDateTime,
      fromDoctorView: true // Add this parameter to indicate it's from doctor's side
    });
  };

  const handleComplete = async (appointment) => {
    showAlert(
      'Complete Appointment',
      'Please continue if an offline prescription has been given to the user, if not please give the prescription.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: async () => {
            try {
              setLoading(true);
              await DoctorAPIService.completeAppointment(appointment.appointmentId);
              showAlert('Success', 'Appointment marked as completed');
              // Refresh the appointments list
              await fetchAppointments();
            } catch (error) {
              console.error('Error completing appointment:', error);
              showAlert('Error', 'Failed to complete appointment. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleWritePrescription = (appointment) => {
    // Navigate to patient profile and prescription screen
    console.log('📝 Navigating with doctorId:', doctorId);
    console.log('📝 Navigating with appointment:', appointment);
    navigation.navigate('PatientProfilePrescription', {
      appointment: appointment,
      doctorId: doctorId // Pass doctorId from route params
    });
  };

  const handleCancel = (appointment) => {
    // Debug: Log the appointment object to see its structure
    console.log('🔍 Appointment object for cancel:', JSON.stringify(appointment, null, 2));
    console.log('🔍 Appointment ID:', appointment.appointmentId);
    console.log('🔍 Appointment fields:', Object.keys(appointment));
    
    showAlert(
      'Cancel Appointment',
      `Are you sure you want to cancel the appointment with ${appointment.patientName}?`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('🚀 About to cancel appointment with ID:', appointment.appointmentId);
              await DoctorAPIService.cancelAppointment(appointment.appointmentId);
              showAlert('Success', 'Appointment has been cancelled successfully');
              // Refresh the appointments list
              await fetchAppointments();
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              showAlert('Error', 'Failed to cancel appointment. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderPatientDetails = (appointment) => {
    const isFamily = isFamilyAppointment(appointment);
    const familyMember = isFamily ? getFamilyMemberDetails(appointment) : null;
    
    // Use family member details if available, otherwise use appointment details
    const displayName = familyMember ? familyMember.name : appointment.patientName;
    const displayAge = familyMember ? familyMember.age : appointment.age;
    const displayContact = familyMember ? familyMember.contact : appointment.mobileNumber;
    const displayGender = familyMember ? familyMember.gender : null;
    const displayRelationship = familyMember ? familyMember.relationship : null;
    
    return (
      <View style={styles.patientDetails}>
        {/* Show family member indicator if it's a family booking */}
        {isFamily && (
          <View style={styles.familyIndicator}>
            <Text style={styles.familyIndicatorText}>
              👪 Family Member Appointment{displayRelationship ? ` (${displayRelationship})` : ''}
            </Text>
            {displayName && <Text style={styles.familyMemberName}>{displayName}</Text>}
          </View>
        )}
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Age</Text>
            <Text style={styles.detailValue}>{displayAge || 'N/A'}</Text>
          </View>
          
          {displayGender && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>{displayGender}</Text>
            </View>
          )}
          
          {/* Hide Blood Group for family members - not available */}
          {!isFamily && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Blood Group</Text>
              <Text style={styles.detailValue}>{appointment.bloodGroup || 'N/A'}</Text>
            </View>
          )}
          
          {/* Hide Weight for family members - not available */}
          {!isFamily && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{appointment.weightKg ? `${appointment.weightKg} kg` : 'N/A'}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>BP</Text>
            <Text style={styles.detailValue}>
              {appointment.bloodPressureSystolic && appointment.bloodPressureDiastolic 
                ? `${appointment.bloodPressureSystolic}/${appointment.bloodPressureDiastolic}` 
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(appointment.status) }]}>
              <Text style={styles.statusTextSmall}>{appointment.status}</Text>
            </View>
          </View>
        </View>
        
        {displayContact && (
          <View style={styles.phoneRow}>
            <Text style={styles.phoneNumber}>📞 {displayContact}</Text>
          </View>
        )}
        
        {appointment.timeSlot && (
          <View style={styles.timeSlotRow}>
            <Text style={styles.timeSlot}>⏰ Time Slot: {appointment.timeSlot}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderAppointmentCard = ({ item }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          {item.appointmentDateTime && (
            <Text style={styles.appointmentTime}>
              {new Date(item.appointmentDateTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          )}
        </View>
      </View>
      
      {renderPatientDetails(item)}
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rescheduleButton]}
          onPress={() => handleReschedule(item)}
        >
          <Text style={styles.actionButtonText}>Reschedule</Text>
        </TouchableOpacity>
        
        {/* Complete button only for today's appointments */}
        {item.status?.toLowerCase() !== 'completed' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleComplete(item)}
          >
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* View Patient & Prescription button only for today's appointments */}
      <View style={styles.bottomButtonRow}>
          {!isFamilyAppointment(item) && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.prescriptionButton]}
              onPress={() => handleWritePrescription(item)}
            >
              <Text style={styles.actionButtonText}>📋 View Patient & Write Prescription</Text>
            </TouchableOpacity>
          )}
      </View>
    </View>
  );

  const renderUpcomingSection = ({ item }) => {
    const isCollapsed = collapsedSections[item.appointmentDate] !== false; // Default to collapsed
    
    return (
      <View style={styles.dateSection}>
        <TouchableOpacity 
          style={styles.dateSectionHeader}
          onPress={() => toggleSection(item.appointmentDate)}
        >
          <View style={styles.dateSectionInfo}>
            <Text style={styles.sectionDate}>
              {new Date(item.appointmentDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <Text style={styles.appointmentCount}>
              {item.appointments.length} appointment{item.appointments.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.collapseIcon}>
            {isCollapsed ? '▼' : '▲'}
          </Text>
        </TouchableOpacity>
        
        {!isCollapsed && item.appointments.map((appointment, index) => (
          <View key={`${item.appointmentDate}-${appointment.appointmentId || index}`} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{appointment.patientName}</Text>
                {appointment.appointmentDateTime && (
                  <Text style={styles.appointmentTime}>
                    {new Date(appointment.appointmentDateTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                )}
              </View>
            </View>
            
            {renderPatientDetails(appointment)}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rescheduleButton]}
                onPress={() => handleReschedule(appointment)}
              >
                <Text style={styles.actionButtonText}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancel(appointment)}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#27ae60';
      case 'confirmed': return '#3498db';
      case 'pending': return '#f39c12';
      case 'cancelled': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  // Robust check for whether an appointment is for a family member
  const isFamilyAppointment = (appt) => {
    if (!appt) return false;
    const cand = appt.patientMemberId ?? appt.patient_member_id ?? appt.familyMemberId ?? appt.family_member_id ?? appt.bookedForFamily ?? appt.isFamily;
    if (cand === undefined || cand === null) return false;
    if (typeof cand === 'number') return cand > 0;
    if (typeof cand === 'string') return cand.trim() !== '' && cand !== '0';
    return !!cand;
  };

  const todayAppointments = getTodayAppointments();
  const upcomingAppointments = getUpcomingAppointments();

  // Helper function to create a suitable title
  const getPageTitle = () => {
    if (workplaceName.length > 25) {
      return `${workplaceName.substring(0, 22)}... - Appointments`;
    }
    return `${workplaceName} - Appointments`;
  };

  return (
    <View style={styles.container}>
      <TopBar title={getPageTitle()} onBack={() => navigation.goBack()} />
      
      {loading ? (
        <SkeletonAllBookings count={6} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Today's Appointments Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Appointments</Text>
            <Text style={styles.sectionSubtitle}>
              Current appointments for today
            </Text>
            
            {todayAppointments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>🗓️ No appointments scheduled for today</Text>
                <Text style={styles.emptySubtext}>Enjoy your free day!</Text>
              </View>
            ) : (
              <View style={styles.dateSection}>
                <TouchableOpacity 
                  style={styles.dateSectionHeader}
                  onPress={() => setTodaySectionCollapsed(!todaySectionCollapsed)}
                >
                  <View style={styles.dateSectionInfo}>
                    <Text style={styles.sectionDate}>
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <Text style={styles.appointmentCount}>
                      {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.collapseIcon}>
                    {todaySectionCollapsed ? '▼' : '▲'}
                  </Text>
                </TouchableOpacity>
                
                {!todaySectionCollapsed && todayAppointments.map((appointment, index) => (
                  <View key={`today-${appointment.appointmentId || index}`} style={styles.appointmentCard}>
                    <View style={styles.appointmentHeader}>
                      <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>{appointment.patientName}</Text>
                        {appointment.appointmentDateTime && (
                          <Text style={styles.appointmentTime}>
                            {new Date(appointment.appointmentDateTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {renderPatientDetails(appointment)}
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={() => handleComplete(appointment)}
                      >
                        <Text style={styles.actionButtonText}>✓ Complete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.rescheduleButton]}
                        onPress={() => handleReschedule(appointment)}
                      >
                        <Text style={styles.actionButtonText}>Reschedule</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCancel(appointment)}
                      >
                        <Text style={styles.actionButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      {/* Hide Prescription button for family appointments */}
                      {!isFamilyAppointment(appointment) && (
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.prescriptionButton]}
                          onPress={() => handleWritePrescription(appointment)}
                        >
                          <Text style={styles.actionButtonText}>📋 View Patient & Write Prescription</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Upcoming Appointments Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <Text style={styles.sectionSubtitle}>
              Future appointments beyond today
            </Text>
            
            {upcomingAppointments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No upcoming appointments</Text>
              </View>
            ) : (
              <FlatList
                data={upcomingAppointments}
                renderItem={renderUpcomingSection}
                keyExtractor={(item) => `upcoming-${item.appointmentDate}`}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      )}

      <BottomNavigation 
        activeTab="appointments"
        userType="doctor"
        onTabChange={(tab) => {
          if (tab === 'appointments') {
            navigation.navigate('DoctorHome');
          } else if (tab === 'profile') {
            navigation.navigate('DoctorHome', { initialTab: 'profile' });
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
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Add space for bottom navigation
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeaderContent: {
    flex: 1,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dateSectionInfo: {
    flex: 1,
  },
  collapseIcon: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  sectionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  appointmentCount: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  patientInfo: {
    flex: 1,
    marginRight: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3498db',
  },
  patientDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  phoneRow: {
    marginTop: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  timeSlotRow: {
    marginTop: 4,
  },
  timeSlot: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'center',
  },
  statusTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  phoneNumber: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  bottomButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
  },
  profileButton: {
    backgroundColor: '#3498db',
  },
  rescheduleButton: {
    backgroundColor: '#f39c12',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  prescriptionButton: {
    backgroundColor: '#9b59b6',
    flex: 2,
    paddingHorizontal: 12,
  },
  completeButton: {
    backgroundColor: '#27ae60',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 4,
  },
  familyIndicator: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4caf50',
  },
  familyIndicatorText: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600',
  },
  familyMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
});
