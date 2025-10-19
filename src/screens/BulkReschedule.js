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
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { DoctorAPIService } from '../services/doctorApiService';
import TopBar from '../components/TopBar';
import BottomNavigation from '../components/BottomNavigation';

export default function BulkReschedule({ route, navigation }) {
  const { doctorId } = route.params;
  
  const [workplaces, setWorkplaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    extendHours: '',
    extendMinutes: '',
    reason: '',
    dateOption: 'none', // 'none', 'today', 'tomorrow', 'custom'
    customDateText: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkplaces();
  }, []);

  const fetchWorkplaces = async () => {
    try {
      setLoading(true);
      const data = await DoctorAPIService.fetchWorkplaces(doctorId);
    //   console.log('Workplace data structure:', data[0]); // Debug log
      setWorkplaces(data);
    } catch (error) {
      console.error('Error fetching workplaces:', error);
      Alert.alert('Error', 'Failed to fetch workplaces');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkplaces();
    setRefreshing(false);
  };

  const openRescheduleModal = (workplace) => {
    setSelectedWorkplace(workplace);
    setRescheduleModalVisible(true);
    // Reset form
    setRescheduleData({
      extendHours: '',
      extendMinutes: '',
      reason: '',
      dateOption: 'none',
      customDateText: '',
    });
  };

  const getNewDate = () => {
    // Use local date components to avoid UTC shifts caused by toISOString()
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    const formatLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const today = new Date();
    switch (rescheduleData.dateOption) {
      case 'today':
        return formatLocal(today);
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return formatLocal(tomorrow);
      case 'custom':
        return rescheduleData.customDateText;
      default:
        return null;
    }
  };

  const handleBulkReschedule = async () => {
    if (!selectedWorkplace) return;

    // Validation - at least one option must be selected (time or date)
    const hasTimeExtension = rescheduleData.extendHours || rescheduleData.extendMinutes;
    const hasDateChange = rescheduleData.dateOption !== 'none';
    
    if (!hasTimeExtension && !hasDateChange) {
      Alert.alert('Validation Error', 'Please specify either time extension or date change');
      return;
    }

    if (rescheduleData.dateOption === 'custom' && !rescheduleData.customDateText.trim()) {
      Alert.alert('Validation Error', 'Please enter a custom date');
      return;
    }

    if (rescheduleData.dateOption === 'custom') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(rescheduleData.customDateText)) {
        Alert.alert('Validation Error', 'Please enter date in YYYY-MM-DD format');
        return;
      }
    }

    if (!rescheduleData.reason.trim()) {
      Alert.alert('Validation Error', 'Please provide a reason for rescheduling');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare payload  
      const workspaceId = selectedWorkplace.id || selectedWorkplace.workplaceId;
      if (!workspaceId) {
        Alert.alert('Error', 'Invalid workplace selected');
        return;
      }
      
      // Build payload per new API contract
      const payload = {
        workspaceId: workspaceId,
        extendHours: rescheduleData.extendHours ? parseInt(rescheduleData.extendHours) : 0,
        extendMinutes: rescheduleData.extendMinutes ? parseInt(rescheduleData.extendMinutes) : 0,
        // API expects empty string when no new date is provided (not null)
        newDate: getNewDate() || '',
        reason: rescheduleData.reason.trim(),
      };

      // Debug: log payload and doctorId before calling API
      try {
        console.log('[bulk-reschedule] calling API with doctorId:', doctorId);
        console.log('[bulk-reschedule] payload:', JSON.stringify(payload, null, 2));
      } catch (e) {}

      // Call service with doctorId (route param)
      const response = await DoctorAPIService.bulkRescheduleAppointments(doctorId, payload);
      
      // Show success message
      Alert.alert(
        'Success',
        response.message || 'Appointments have been rescheduled successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setRescheduleModalVisible(false);
              navigation.goBack(); // Go back to previous screen
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error bulk rescheduling:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to reschedule appointments. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderDateOption = (option, label) => (
    <TouchableOpacity
      style={[
        styles.dateOption,
        rescheduleData.dateOption === option && styles.dateOptionSelected
      ]}
      onPress={() => setRescheduleData(prev => ({ ...prev, dateOption: option }))}
    >
      <Text style={[
        styles.dateOptionText,
        rescheduleData.dateOption === option && styles.dateOptionTextSelected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderWorkplaceCard = ({ item }) => (
    <View style={styles.workplaceCard}>
      <View style={styles.workplaceContent}>
        <Text style={styles.workplaceName}>{item.workplaceName}</Text>
        <Text style={styles.workplaceType}>{item.workplaceType}</Text>
        <Text style={styles.workplaceAddress}>{item.address}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.rescheduleButton}
        onPress={() => openRescheduleModal(item)}
      >
        <Text style={styles.rescheduleButtonText}>Reschedule All</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TopBar title="Bulk Reschedule" onBack={() => navigation.goBack()} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading workplaces...</Text>
        </View>
      ) : (
        <FlatList
          data={workplaces}
          renderItem={renderWorkplaceCard}
                    keyExtractor={(item, index) => `workplace-${item.id || item.workplaceId || item.workplaceName || index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No workplaces found</Text>
            </View>
          }
        />
      )}

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Reschedule All Appointments
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedWorkplace?.workplaceName}
              </Text>
              
              <View style={styles.warningNote}>
                <Text style={styles.warningText}>
                  ⚠️ This will reschedule ALL your appointments at this workplace. 
                  Please provide either time extension or date change.
                </Text>
              </View>

              {/* Time Extension Section */}
              <Text style={styles.sectionTitle}>Time Extension (Optional)</Text>
              <View style={styles.timeInputRow}>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.inputLabel}>Hours</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={rescheduleData.extendHours}
                    onChangeText={(text) => setRescheduleData(prev => ({ ...prev, extendHours: text }))}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.inputLabel}>Minutes</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={rescheduleData.extendMinutes}
                    onChangeText={(text) => setRescheduleData(prev => ({ ...prev, extendMinutes: text }))}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>

              {/* Date Change Section */}
              <Text style={styles.sectionTitle}>Date Change (Optional)</Text>
              <View style={styles.dateOptionsContainer}>
                {renderDateOption('none', 'No Change')}
                {renderDateOption('today', 'Today')}
                {renderDateOption('tomorrow', 'Tomorrow')}
                {renderDateOption('custom', 'Custom Date')}
              </View>

              {/* Custom Date Input */}
              {rescheduleData.dateOption === 'custom' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Enter Custom Date:</Text>
                  <Text style={styles.formatHint}>Format: YYYY-MM-DD (e.g., 2025-10-16)</Text>
                  <TextInput
                    style={styles.input}
                    value={rescheduleData.customDateText}
                    onChangeText={(text) => setRescheduleData(prev => ({ 
                      ...prev, 
                      customDateText: text 
                    }))}
                    placeholder="2025-10-16"
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              {/* Reason Section */}
              <Text style={styles.sectionTitle}>Reason *</Text>
              <TextInput
                style={styles.reasonInput}
                value={rescheduleData.reason}
                onChangeText={(text) => setRescheduleData(prev => ({ ...prev, reason: text }))}
                placeholder="Enter reason for rescheduling..."
                multiline
                numberOfLines={3}
              />

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setRescheduleModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleBulkReschedule}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Reschedule All</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  workplaceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  workplaceContent: {
    flex: 1,
    marginRight: 16,
  },
  workplaceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
  },
  workplaceType: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginBottom: 4,
  },
  workplaceAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  rescheduleButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  rescheduleButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  warningNote: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeInputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 4,
  },
  formatHint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  dateOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dateOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  dateOptionSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  dateOptionText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  dateOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  customDateButton: {
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  customDateText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#f39c12',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
