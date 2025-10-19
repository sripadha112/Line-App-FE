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
  ScrollView
} from 'react-native';
import { DoctorAPIService } from '../services/doctorApiService';
import TopBar from '../components/TopBar';
import BottomNavigation from '../components/BottomNavigation';

export default function AppointmentHistory({ route, navigation }) {
  const { doctorId } = route.params;
  
  const [historyByWorkplace, setHistoryByWorkplace] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsedWorkplaces, setCollapsedWorkplaces] = useState({});

  useEffect(() => {
    fetchAppointmentHistory();
  }, []);

  const fetchAppointmentHistory = async () => {
    try {
      setLoading(true);
      const data = await DoctorAPIService.fetchAppointmentHistory(doctorId);
      
      // Check for potential duplicates
      const duplicates = data.filter((workplace, index) => 
        data.findIndex(w => 
          w.workplaceName === workplace.workplaceName && 
          w.workplaceAddress === workplace.workplaceAddress &&
          w.workplaceId !== workplace.workplaceId
        ) !== -1
      );
      
      if (duplicates.length > 0) {
        console.warn('Potential duplicate workplaces found:', duplicates.map(d => 
          `${d.workplaceName} (ID: ${d.workplaceId}) at ${d.workplaceAddress}`
        ));
      }
      
      setHistoryByWorkplace(data);
    } catch (error) {
      console.error('Error fetching appointment history:', error);
      Alert.alert('Error', 'Failed to fetch appointment history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointmentHistory();
    setRefreshing(false);
  };

  const toggleWorkplace = (workplaceId) => {
    setCollapsedWorkplaces(prev => ({
      ...prev,
      [workplaceId]: prev[workplaceId] === undefined ? false : !prev[workplaceId]
    }));
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

  const renderCompactAppointmentCard = ({ item }) => (
    <View style={styles.compactCard}>
      <View style={styles.compactHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.compactPatientName} numberOfLines={1}>
            {item.patientFullName}
          </Text>
          <Text style={styles.compactDate}>
            {new Date(item.appointmentDate).toLocaleDateString('en-GB')}
          </Text>
        </View>
        <View style={styles.timeAndStatus}>
          <Text style={styles.compactTime}>{item.timeSlot}</Text>
          <View style={[styles.compactStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.compactStatusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.compactDetails}>
        <Text style={styles.compactDetail}>📞 {item.mobileNumber}</Text>
        <Text style={styles.compactDetail}>👤 {item.age}y</Text>
      </View>
    </View>
  );

  const renderWorkplaceSection = ({ item }) => {
    const isCollapsed = collapsedWorkplaces[item.workplaceId] !== false; // Default collapsed
    
    // Check if we need to show address for differentiation
    const sameNameWorkplaces = historyByWorkplace.filter(wp => 
      wp.workplaceName === item.workplaceName && wp.workplaceId !== item.workplaceId
    );
    const shouldShowAddress = sameNameWorkplaces.length > 0;
    
    return (
      <View style={styles.workplaceSection}>
        <TouchableOpacity 
          style={styles.workplaceHeader}
          onPress={() => toggleWorkplace(item.workplaceId)}
        >
          <View style={styles.workplaceInfo}>
            <Text style={styles.workplaceName}>
              {item.workplaceName}
              {shouldShowAddress && (
                <Text style={styles.workplaceNameSuffix}> - {item.workplaceAddress}</Text>
              )}
            </Text>
            <Text style={styles.workplaceType}>{item.workplaceType}</Text>
            {!shouldShowAddress && (
              <Text style={styles.workplaceAddress} numberOfLines={1}>
                📍 {item.workplaceAddress}
              </Text>
            )}
            <Text style={styles.appointmentCount}>
              {item.appointments.length} appointment{item.appointments.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.collapseIcon}>
            {isCollapsed ? '▼' : '▲'}
          </Text>
        </TouchableOpacity>
        
        {!isCollapsed && (
          <FlatList
            data={item.appointments}
            renderItem={renderCompactAppointmentCard}
            keyExtractor={(appointment) => `${appointment.appointmentId || Math.random()}-${appointment.appointmentDate || ''}`}
            scrollEnabled={false}
            style={styles.appointmentsList}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TopBar title="Appointment History" onBack={() => navigation.goBack()} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading appointment history...</Text>
        </View>
      ) : (
        <FlatList
          data={historyByWorkplace}
          renderItem={renderWorkplaceSection}
          keyExtractor={(item) => `workplace-${item.workplaceId || Math.random()}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No appointment history found</Text>
            </View>
          }
        />
      )}

      <BottomNavigation 
        activeTab="appointments"
        userType="doctor"
        onTabChange={(tab) => {
          if (tab === 'appointments') {
            navigation.navigate('DoctorHome');
          } else if (tab === 'profile') {
            // Already handled by BottomNavigation component
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
  listContainer: {
    padding: 20,
    paddingBottom: 100, // Add space for bottom navigation
  },
  workplaceSection: {
    marginBottom: 16,
  },
  workplaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 8,
  },
  workplaceInfo: {
    flex: 1,
  },
  workplaceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 2,
  },
  workplaceNameSuffix: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  workplaceType: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
    marginBottom: 4,
  },
  workplaceAddress: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  appointmentCount: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  collapseIcon: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: 'bold',
  },
  appointmentsList: {
    marginTop: 4,
  },
  compactCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  patientInfo: {
    flex: 1,
    marginRight: 8,
  },
  compactPatientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  compactDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  timeAndStatus: {
    alignItems: 'flex-end',
  },
  compactTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3498db',
    marginBottom: 4,
  },
  compactStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compactStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  compactDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactDetail: {
    fontSize: 11,
    color: '#7f8c8d',
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
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
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
});
