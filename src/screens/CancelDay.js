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

export default function CancelDay({ route, navigation }) {
  const { doctorId } = route.params;
  
  const [workplaces, setWorkplaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelDayModalVisible, setCancelDayModalVisible] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState(null);
  const [cancelDayData, setCancelDayData] = useState({
    dateOption: 'today', // 'today', 'tomorrow', 'custom'
    customDateText: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkplaces();
  }, []);

  const fetchWorkplaces = async () => {
    try {
      setLoading(true);
      const response = await DoctorAPIService.fetchWorkplaces(doctorId);
      // console.log('Workplaces data:', response);
      setWorkplaces(response || []);
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

  const openCancelDayModal = (workplace) => {
    setSelectedWorkplace(workplace);
    setCancelDayModalVisible(true);
    // Reset form
    setCancelDayData({
      dateOption: 'today',
      customDateText: '',
      reason: '',
    });
  };

  const getCancelDate = () => {
    const today = new Date();
    switch (cancelDayData.dateOption) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      case 'custom':
        return cancelDayData.customDateText;
      default:
        return today.toISOString().split('T')[0];
    }
  };

  const handleCancelDay = async () => {
    if (!selectedWorkplace) return;

    // Validation
    if (cancelDayData.dateOption === 'custom' && !cancelDayData.customDateText.trim()) {
      Alert.alert('Validation Error', 'Please specify the date');
      return;
    }

    if (!cancelDayData.reason.trim()) {
      Alert.alert('Validation Error', 'Please provide a reason for cancellation');
      return;
    }

    try {
      setSubmitting(true);

      const cancelDate = getCancelDate();
      const payload = {
        date: cancelDate,
        reason: cancelDayData.reason
      };

      const response = await DoctorAPIService.cancelWorkspaceDayAppointments(selectedWorkplace.id, payload);
      
      // Show success message
      Alert.alert(
        'Success',
        response.message || 'All appointments for the selected date have been cancelled successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setCancelDayModalVisible(false);
              navigation.goBack(); // Go back to previous screen
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error canceling day appointments:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to cancel appointments. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderCancelDateOption = (option, label) => (
    <TouchableOpacity
      style={[
        styles.dateOption,
        cancelDayData.dateOption === option && styles.dateOptionSelected
      ]}
      onPress={() => setCancelDayData(prev => ({ ...prev, dateOption: option }))}
    >
      <Text style={[
        styles.dateOptionText,
        cancelDayData.dateOption === option && styles.dateOptionTextSelected
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
        style={styles.cancelButton}
        onPress={() => openCancelDayModal(item)}
      >
        <Text style={styles.cancelButtonText}>Cancel Day</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TopBar title="Cancel Day" onBack={() => navigation.goBack()} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading workplaces...</Text>
        </View>
      ) : (
        <FlatList
          data={workplaces}
          renderItem={renderWorkplaceCard}
          keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
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

      {/* Cancel Day Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelDayModalVisible}
        onRequestClose={() => setCancelDayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Cancel Day Appointments</Text>
              <Text style={styles.modalSubtitle}>
                {selectedWorkplace?.workplaceName}
              </Text>
              
              {/* Date Selection */}
              <Text style={styles.sectionTitle}>Select Date to Cancel:</Text>
              <View style={styles.dateContainer}>
                {renderCancelDateOption('today', 'Today')}
                {renderCancelDateOption('tomorrow', 'Tomorrow')}
                {renderCancelDateOption('custom', 'Custom Date')}
              </View>

              {/* Custom Date Input */}
              {cancelDayData.dateOption === 'custom' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Enter Date (YYYY-MM-DD):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2024-01-15"
                    value={cancelDayData.customDateText}
                    onChangeText={(text) => setCancelDayData(prev => ({ ...prev, customDateText: text }))}
                  />
                </View>
              )}

              {/* Reason Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason for Cancellation *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Please provide a reason for canceling all appointments..."
                  value={cancelDayData.reason}
                  onChangeText={(text) => setCancelDayData(prev => ({ ...prev, reason: text }))}
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              {/* Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setCancelDayModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleCancelDay}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Cancel Day</Text>
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
    padding: 16,
    paddingBottom: 100,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  workplaceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workplaceContent: {
    flex: 1,
    marginRight: 16,
  },
  workplaceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workplaceType: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 4,
    fontWeight: '500',
  },
  workplaceAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  dateOption: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateOptionSelected: {
    backgroundColor: '#e74c3c',
    borderColor: '#c0392b',
  },
  dateOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  dateOptionTextSelected: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
