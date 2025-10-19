import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { format } from 'date-fns';
import { UserAPIService } from '../../services/doctorApiService';

export default function ActiveBookings({ userId, onReschedule, onCancel, refreshTrigger }) {
  const [appointments, setAppointments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAppointments();
    }
  }, [userId]);

  // Refresh appointments when refreshTrigger changes
  useEffect(() => {
    if (userId && refreshTrigger) {
      console.log('🔄 ActiveBookings refresh triggered, refreshTrigger:', refreshTrigger);
      fetchAppointments();
    }
  }, [refreshTrigger, userId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching appointments for userId:', userId);
      const appointmentsData = await UserAPIService.fetchAllUserAppointments(userId);
      console.log('📅 Appointments data:', appointmentsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      setAppointments({ appointmentsByDate: {}, totalAppointments: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📅 Active Bookings</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your appointments...</Text>
        </View>
      </View>
    );
  }

  if (!appointments) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📅 Active Bookings</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Failed to load appointments</Text>
        </View>
      </View>
    );
  }

  const { appointmentsByDate, totalAppointments } = appointments;
  
  // Check if there are any BOOKED appointments
  const hasActiveAppointments = () => {
    if (!appointmentsByDate) return false;
    
    return Object.values(appointmentsByDate).some(appointmentsForDate => 
      appointmentsForDate.some(appointment => appointment.status === 'BOOKED')
    );
  };

  if (!hasActiveAppointments()) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📅 Active Bookings</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Active Appointments</Text>
          <Text style={styles.emptySubtitle}>Book your first appointment to get started</Text>
        </View>
      </View>
    );
  }

  const renderAppointment = (appointment) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentId}>#{appointment.id}</Text>
          <View style={[
            styles.statusBadge,
            appointment.status === 'BOOKED' && styles.statusBooked,
            appointment.status === 'CANCELLED' && styles.statusCancelled,
            appointment.status === 'RESCHEDULED' && styles.statusRescheduled,
            appointment.status === 'COMPLETED' && styles.statusCompleted,
          ]}>
            <Text style={styles.statusText}>{appointment.status}</Text>
          </View>
        </View>
      </View>
      
      {/* Doctor Name */}
      <Text style={styles.doctorName}>
        👨‍⚕️ Dr. {appointment.doctorName || 'N/A'}
      </Text>
      
      <Text style={styles.appointmentTime}>
        🕐 {appointment.slot} • {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}
      </Text>
      
      <Text style={styles.workplaceInfo}>
        🏥 {appointment.workplaceName} ({appointment.workplaceType})
      </Text>
      
      <Text style={styles.queuePosition}>
        📍 Queue Position: #{appointment.queuePosition}
      </Text>

      {/* Action Buttons - Only show for BOOKED appointments */}
      {appointment.status === 'BOOKED' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={() => onReschedule && onReschedule(appointment.id)}
          >
            <Text style={styles.rescheduleButtonText}>📅 Reschedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => onCancel && onCancel(appointment.id)}
          >
            <Text style={styles.cancelButtonText}>❌ Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render appointments with load more functionality
  const renderAllAppointments = () => {
    const allAppointments = [];
    let appointmentCount = 0;
    
    Object.entries(appointmentsByDate || {}).forEach(([date, appointmentsForDate]) => {
      // Filter only BOOKED appointments for Active Bookings section
      const activeAppointments = appointmentsForDate.filter(appointment => 
        appointment.status === 'BOOKED'
      );
      
      // Skip if no active appointments for this date
      if (activeAppointments.length === 0) {
        return;
      }
      
      // Add date header
      allAppointments.push(
        <View key={date} style={styles.dateSection}>
          <Text style={styles.dateHeader}>
            {format(new Date(date), 'EEEE, MMM dd, yyyy')}
          </Text>
        </View>
      );
      
      // Add appointments for this date
      activeAppointments.forEach(appointment => {
        appointmentCount++;
        
        // If showAll is false, only show first 2 appointments
        if (!showAll && appointmentCount > 2) {
          return; // Skip this appointment
        }
        
        allAppointments.push(renderAppointment(appointment));
      });
    });
    
    return allAppointments;
  };

  // Count total BOOKED appointments for the load more button
  const getTotalAppointmentCount = () => {
    let count = 0;
    Object.entries(appointmentsByDate || {}).forEach(([date, appointmentsForDate]) => {
      // Count only BOOKED appointments
      const activeAppointments = appointmentsForDate.filter(appointment => 
        appointment.status === 'BOOKED'
      );
      count += activeAppointments.length;
    });
    return count;
  };

  const totalAppointmentCount = getTotalAppointmentCount();
  const shouldShowLoadMore = !showAll && totalAppointmentCount > 2;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📅 Active Bookings</Text>
      </View>
      
      <View style={styles.sectionContent}>
        <Text style={styles.summaryText}>
          {totalAppointmentCount} active appointment{totalAppointmentCount !== 1 ? 's' : ''} scheduled
        </Text>
        
        <View style={styles.appointmentsContainer}>
          {renderAllAppointments()}
        </View>
        
        {/* Load More Button */}
        {shouldShowLoadMore && (
          <TouchableOpacity 
            style={styles.loadMoreButton}
            onPress={() => setShowAll(true)}
          >
            <Text style={styles.loadMoreText}>
              Load More ({totalAppointmentCount - 2} remaining)
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Show Less Button */}
        {showAll && totalAppointmentCount > 2 && (
          <TouchableOpacity 
            style={styles.showLessButton}
            onPress={() => setShowAll(false)}
          >
            <Text style={styles.showLessText}>Show Less</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  sectionContent: {
    flex: 1,
  },
  summaryText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
    fontWeight: '500',
  },
  appointmentsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  dateSection: {
    marginBottom: 8,
    marginTop: 6,
  },
  dateHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 6,
    paddingLeft: 4,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#95a5a6',
  },
  statusBooked: {
    backgroundColor: '#27ae60',
  },
  statusCancelled: {
    backgroundColor: '#e74c3c',
  },
  statusRescheduled: {
    backgroundColor: '#f39c12',
  },
  statusCompleted: {
    backgroundColor: '#9b59b6',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  appointmentTime: {
    fontSize: 13,
    color: '#2c3e50',
    marginBottom: 5,
    fontWeight: '500',
  },
  workplaceInfo: {
    fontSize: 13,
    color: '#34495e',
    marginBottom: 5,
  },
  queuePosition: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  rescheduleButton: {
    backgroundColor: '#3498db',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  rescheduleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginLeft: 10,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
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
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#3984cfff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  showLessButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  showLessText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});
