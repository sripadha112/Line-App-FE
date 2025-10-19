// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   RefreshControl,
// } from 'react-native';
// import { UserAPIService } from '../services/doctorApiService';

// export default function ActiveBookings({ 
//   userId, 
//   onReschedule, 
//   onCancel, 
//   maxItemsToShow = null 
// }) {
//   const [appointments, setAppointments] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   useEffect(() => {
//     fetchAppointments();
//   }, [userId]);

//   const fetchAppointments = async () => {
//     try {
//       setLoading(true);
//       const appointmentsData = await UserAPIService.fetchAllUserAppointments(userId);
//       setAppointments(appointmentsData);
//     } catch (error) {
//       console.error('Error fetching appointments:', error);
//       Alert.alert('Error', 'Failed to load appointments');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = React.useCallback(async () => {
//     setRefreshing(true);
//     await fetchAppointments();
//     setRefreshing(false);
//   }, []);

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'BOOKED': return '#27ae60';
//       case 'CANCELLED': return '#e74c3c';
//       case 'RESCHEDULED': return '#f39c12';
//       case 'COMPLETED': return '#9b59b6';
//       default: return '#95a5a6';
//     }
//   };

//   const getActiveAppointments = () => {
//     if (!appointments || !appointments.appointmentsByDate) return [];
    
//     const allAppointments = [];
//     Object.keys(appointments.appointmentsByDate).forEach(date => {
//       const dayAppointments = appointments.appointmentsByDate[date];
//       // Only include active appointments (not cancelled or completed)
//       const activeAppointments = dayAppointments.filter(apt => 
//         apt.status === 'BOOKED' || apt.status === 'RESCHEDULED'
//       );
//       allAppointments.push(...activeAppointments.map(apt => ({ ...apt, date })));
//     });
    
//     // Sort by date (most recent first)
//     allAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));
    
//     // Limit items if maxItemsToShow is specified
//     return maxItemsToShow ? allAppointments.slice(0, maxItemsToShow) : allAppointments;
//   };

//   const renderAppointment = (appointment, index) => (
//     <View key={`${appointment.id}-${index}`} style={styles.appointmentCard}>
//       <View style={styles.appointmentHeader}>
//         <Text style={styles.appointmentId}>#{appointment.id}</Text>
//         <View style={[
//           styles.statusBadge,
//           { backgroundColor: getStatusColor(appointment.status) }
//         ]}>
//           <Text style={styles.statusText}>{appointment.status}</Text>
//         </View>
//       </View>
      
//       <Text style={styles.appointmentDate}>
//         📅 {appointment.date}
//       </Text>
      
//       <Text style={styles.appointmentTime}>
//         🕐 {appointment.slot}
//       </Text>
      
//       <Text style={styles.workplaceInfo}>
//         🏥 {appointment.workplaceName}
//       </Text>
      
//       <Text style={styles.workplaceAddress}>
//         📍 {appointment.workplaceAddress}
//       </Text>
      
//       <Text style={styles.queuePosition}>
//         🏃 Queue Position: #{appointment.queuePosition}
//       </Text>
      
//       {appointment.notes && (
//         <Text style={styles.notes}>📝 {appointment.notes}</Text>
//       )}
      
//       {/* Action Buttons */}
//       <View style={styles.actionButtons}>
//         <TouchableOpacity 
//           style={[styles.actionButton, styles.rescheduleButton]}
//           onPress={() => onReschedule && onReschedule(appointment.id)}
//         >
//           <Text style={styles.actionButtonText}>🔄 Reschedule</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={[styles.actionButton, styles.cancelButton]}
//           onPress={() => onCancel && onCancel(appointment.id)}
//         >
//           <Text style={styles.actionButtonText}>❌ Cancel</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   const activeAppointments = getActiveAppointments();

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.sectionTitle}>📋 Active Bookings</Text>
//         <View style={styles.loadingContainer}>
//           <Text style={styles.loadingText}>Loading appointments...</Text>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.headerContainer}>
//         <Text style={styles.sectionTitle}>📋 Active Bookings</Text>
//         {activeAppointments.length > 0 && (
//           <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
//             <Text style={styles.refreshText}>🔄 Refresh</Text>
//           </TouchableOpacity>
//         )}
//       </View>
      
//       {activeAppointments.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Text style={styles.emptyIcon}>📋</Text>
//           <Text style={styles.emptyTitle}>No Active Appointments</Text>
//           <Text style={styles.emptySubtitle}>
//             You don't have any upcoming appointments scheduled
//           </Text>
//         </View>
//       ) : (
//         <ScrollView 
//           style={styles.appointmentsList}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//           }
//           showsVerticalScrollIndicator={false}
//         >
//           {activeAppointments.map((appointment, index) => 
//             renderAppointment(appointment, index)
//           )}
//           {maxItemsToShow && activeAppointments.length >= maxItemsToShow && (
//             <TouchableOpacity style={styles.viewAllButton}>
//               <Text style={styles.viewAllText}>View All Appointments →</Text>
//             </TouchableOpacity>
//           )}
//         </ScrollView>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#fff',
//     margin: 10,
//     marginTop: 0,
//     borderRadius: 12,
//     padding: 20,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   headerContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#2c3e50',
//   },
//   refreshButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     backgroundColor: '#ecf0f1',
//     borderRadius: 15,
//   },
//   refreshText: {
//     fontSize: 12,
//     color: '#2c3e50',
//     fontWeight: '500',
//   },
//   loadingContainer: {
//     padding: 40,
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#7f8c8d',
//     fontStyle: 'italic',
//   },
//   emptyContainer: {
//     padding: 40,
//     alignItems: 'center',
//   },
//   emptyIcon: {
//     fontSize: 48,
//     marginBottom: 16,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 8,
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     textAlign: 'center',
//   },
//   appointmentsList: {
//     maxHeight: 400,
//   },
//   appointmentCard: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     borderLeftWidth: 4,
//     borderLeftColor: '#3498db',
//   },
//   appointmentHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   appointmentId: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#2c3e50',
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   statusText: {
//     color: '#fff',
//     fontSize: 10,
//     fontWeight: '600',
//     textTransform: 'uppercase',
//   },
//   appointmentDate: {
//     fontSize: 14,
//     color: '#2c3e50',
//     marginBottom: 4,
//     fontWeight: '500',
//   },
//   appointmentTime: {
//     fontSize: 14,
//     color: '#2c3e50',
//     marginBottom: 6,
//     fontWeight: '500',
//   },
//   workplaceInfo: {
//     fontSize: 14,
//     color: '#34495e',
//     marginBottom: 4,
//   },
//   workplaceAddress: {
//     fontSize: 12,
//     color: '#7f8c8d',
//     marginBottom: 6,
//   },
//   queuePosition: {
//     fontSize: 12,
//     color: '#7f8c8d',
//     marginBottom: 8,
//   },
//   notes: {
//     fontSize: 12,
//     color: '#7f8c8d',
//     fontStyle: 'italic',
//     marginBottom: 8,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 8,
//   },
//   actionButton: {
//     flex: 1,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginHorizontal: 4,
//   },
//   rescheduleButton: {
//     backgroundColor: '#f39c12',
//   },
//   cancelButton: {
//     backgroundColor: '#e74c3c',
//   },
//   actionButtonText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   viewAllButton: {
//     padding: 12,
//     alignItems: 'center',
//     backgroundColor: '#ecf0f1',
//     borderRadius: 8,
//     marginTop: 8,
//   },
//   viewAllText: {
//     color: '#3498db',
//     fontSize: 14,
//     fontWeight: '500',
//   },
// });
