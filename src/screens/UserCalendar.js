import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { UserAPIService } from '../services/doctorApiService';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import BottomNavigation from '../components/BottomNavigation';

export default function UserCalendar({ route, navigation }) {
  const { userId, status, title } = route.params;
  
  const [appointments, setAppointments] = useState(null);
  const [selectedDate, setSelectedDate] = useState(0); // Index for days array
  const [loading, setLoading] = useState(true);
  const [calendarDays, setCalendarDays] = useState([]);

  // Check if this is a filtered view
  const isFilteredView = status && title;
  const pageTitle = isFilteredView ? title : '📅 Your Appointments';

  useEffect(() => {
    setupCalendar();
    fetchAppointments();
  }, []);

  // Reset state when route parameters change (especially when coming from bottom nav)
  useEffect(() => {
    setupCalendar();
  }, [status, title]); // Re-setup calendar when filter parameters change

  const setupCalendar = () => {
    const today = new Date();
    const days = [];
    
    if (isFilteredView) {
      // For filtered views, show past 2 days, today, and future 2 days (total 5 days)
      for (let i = -2; i <= 2; i++) {
        const date = addDays(today, i);
        days.push({
          date: date,
          dayName: format(date, 'EEE'),
          dayNumber: format(date, 'd'),
          monthName: format(date, 'MMM'),
          isToday: i === 0,
          isFuture: i > 0,
          isPast: i < 0,
          formattedDate: format(date, 'yyyy-MM-dd')
        });
      }
      // Set selected date to today for filtered views
      setSelectedDate(2); // Today is at index 2 (middle of the range)
    } else {
      // Create 3 days: today and next 2 days for normal calendar
      for (let i = 0; i < 3; i++) {
        const date = addDays(today, i);
        days.push({
          date: date,
          dayName: format(date, 'EEE'),
          dayNumber: format(date, 'd'),
          monthName: format(date, 'MMM'),
          isToday: i === 0,
          isFuture: i > 0,
          formattedDate: format(date, 'yyyy-MM-dd')
        });
      }
    }
    
    setCalendarDays(days);
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsData = await UserAPIService.fetchAllUserAppointments(userId);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDate = (dateString) => {
    if (!appointments || !appointments.appointmentsByDate) return [];
    
    const dayAppointments = appointments.appointmentsByDate[dateString] || [];
    
    // If filtered view, only return appointments with the specified status
    if (isFilteredView && status) {
      return dayAppointments.filter(appointment => appointment.status === status);
    }
    
    // For normal calendar view, return all appointments
    return dayAppointments;
  };

  const renderAppointment = ({ item: appointment }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
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
      
      <Text style={styles.appointmentTime}>
        🕐 {appointment.slot}
      </Text>
      
      <Text style={styles.workplaceInfo}>
        🏥 {appointment.workplaceName}
      </Text>
      
      <Text style={styles.workplaceAddress}>
        📍 {appointment.workplaceAddress}
      </Text>
      
      <Text style={styles.queuePosition}>
        📍 Queue Position: #{appointment.queuePosition}
      </Text>
      
      {appointment.notes && (
        <Text style={styles.notes}>📝 {appointment.notes}</Text>
      )}
    </View>
  );

  // Check if there are any appointments with the filtered status across all dates
  const hasAnyFilteredAppointments = () => {
    if (!isFilteredView || !appointments || !appointments.appointmentsByDate) return true;
    
    return Object.values(appointments.appointmentsByDate).some(dayAppointments =>
      dayAppointments.some(appointment => appointment.status === status)
    );
  };

  const selectedDay = calendarDays[selectedDate];
  const selectedDateAppointments = selectedDay ? getAppointmentsForDate(selectedDay.formattedDate) : [];

  // Show global empty state if no filtered appointments exist at all
  if (isFilteredView && !loading && appointments && !hasAnyFilteredAppointments()) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#f8f9fa" />
        <View style={styles.container}>
          <ScrollView style={styles.content}>
            <Text style={styles.pageTitle}>{pageTitle}</Text>
            
            <View style={styles.globalEmptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No {status?.charAt(0) + status?.slice(1).toLowerCase()} Appointments</Text>
              <Text style={styles.emptySubtitle}>
                You have no {status?.toLowerCase()} appointments in your history.
              </Text>
              
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>← Go Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        <ScrollView style={styles.content}>
        <Text style={styles.pageTitle}>{pageTitle}</Text>
        
        {/* Calendar Days */}
        <View style={styles.daysContainer}>
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCard,
                isFilteredView && styles.dayCardSmall,
                day.isToday && styles.dayToday,
                day.isFuture && styles.dayFuture,
                day.isPast && styles.dayPast,
                selectedDate === index && styles.daySelected
              ]}
              onPress={() => setSelectedDate(index)}
            >
              <Text style={[
                styles.dayName,
                day.isToday && styles.dayNameToday,
                day.isFuture && styles.dayNameFuture,
                day.isPast && styles.dayNamePast,
                selectedDate === index && styles.dayNameSelected
              ]}>
                {day.dayName}
              </Text>
              <Text style={[
                styles.dayNumber,
                day.isToday && styles.dayNumberToday,
                day.isFuture && styles.dayNumberFuture,
                day.isPast && styles.dayNumberPast,
                selectedDate === index && styles.dayNumberSelected
              ]}>
                {day.dayNumber}
              </Text>
              <Text style={[
                styles.monthName,
                day.isToday && styles.monthNameToday,
                day.isFuture && styles.monthNameFuture,
                day.isPast && styles.monthNamePast,
                selectedDate === index && styles.monthNameSelected
              ]}>
                {day.monthName}
              </Text>
              <View style={styles.appointmentsCount}>
                <Text style={[
                  styles.countText,
                  day.isToday && styles.countTextToday,
                  selectedDate === index && styles.countTextSelected
                ]}>
                  {getAppointmentsForDate(day.formattedDate).length} apt{getAppointmentsForDate(day.formattedDate).length !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Selected Day Appointments */}
        <View style={styles.selectedDayContainer}>
          <Text style={styles.selectedDayTitle}>
            {selectedDay ? (
              selectedDay.isToday ? 'Today' : 
              format(selectedDay.date, 'EEEE, MMMM d, yyyy')
            ) : 'Select a day'}
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading appointments...</Text>
            </View>
          ) : selectedDateAppointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>
                {isFilteredView ? `No ${status?.toLowerCase()} Appointments` : 'No Appointments'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isFilteredView 
                  ? `You have no ${status?.toLowerCase()} appointments for this day`
                  : 'You have no appointments scheduled for this day'
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={selectedDateAppointments}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderAppointment}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('BookAppointment', { userId })}
          >
            <Text style={styles.quickActionText}>📅 Book New Appointment</Text>
          </TouchableOpacity>
        </View>
        
        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      <BottomNavigation 
        activeTab="calendar"
        userType="user"
        onTabChange={(tab) => {
          switch (tab) {
            case 'appointments':
              navigation.navigate('UserHome', { userId });
              break;
            case 'calendar':
              // If currently in filtered view, reset to normal calendar
              if (isFilteredView) {
                navigation.replace('UserCalendar', { userId });
              }
              // If already on normal calendar, do nothing
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
    padding: 20,
    paddingTop: 30, // Add extra top padding for better spacing
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dayCard: {
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
  dayCardSmall: {
    padding: 12, // Reduced padding for history view
  },
  dayToday: {
    backgroundColor: '#3498db',
  },
  dayFuture: {
    backgroundColor: '#ecf0f1',
  },
  dayPast: {
    backgroundColor: '#f8f9fa',
  },
  daySelected: {
    backgroundColor: '#2980b9',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  dayNameToday: {
    color: '#fff',
  },
  dayNameFuture: {
    color: '#95a5a6',
  },
  dayNamePast: {
    color: '#95a5a6',
  },
  dayNameSelected: {
    color: '#fff',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  dayNumberToday: {
    color: '#fff',
  },
  dayNumberFuture: {
    color: '#7f8c8d',
  },
  dayNumberPast: {
    color: '#7f8c8d',
  },
  dayNumberSelected: {
    color: '#fff',
  },
  monthName: {
    fontSize: 10,
    fontWeight: '500',
    color: '#95a5a6',
    marginBottom: 8,
  },
  monthNameToday: {
    color: '#ecf0f1',
  },
  monthNameFuture: {
    color: '#bdc3c7',
  },
  monthNamePast: {
    color: '#bdc3c7',
  },
  monthNameSelected: {
    color: '#ecf0f1',
  },
  monthNameToday: {
    color: '#ecf0f1',
  },
  monthNameFuture: {
    color: '#bdc3c7',
  },
  monthNameSelected: {
    color: '#ecf0f1',
  },
  appointmentsCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  countTextToday: {
    color: '#fff',
  },
  countTextSelected: {
    color: '#fff',
  },
  selectedDayContainer: {
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
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
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
  appointmentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 6,
    fontWeight: '500',
  },
  workplaceInfo: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
  },
  workplaceAddress: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  queuePosition: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  notes: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#ecf0f1',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#2c3e50',
  },
  bottomSpacing: {
    height: 120, // Increased to accommodate bottom navigation
  },
  globalEmptyContainer: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
