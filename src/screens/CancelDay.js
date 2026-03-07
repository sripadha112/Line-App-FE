import React, { useState, useEffect, useRef } from 'react';
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
  ScrollView,
  Platform
} from 'react-native';
import { DoctorAPIService } from '../services/doctorApiService';
import TopBar from '../components/TopBar';
import BottomNavigation from '../components/BottomNavigation';
import DatePicker from '../components/DatePicker';
import { showAlert } from '../utils/alertUtils';

const REASONS = [
  'Personal emergency',
  'Medical emergency', 
  'Family emergency',
  'Equipment failure',
  'Facility unavailable',
  'Doctor illness',
  'Weather conditions',
  'Administrative issues',
  'Training/Conference',
  'Holiday',
  'Other'
];

// Generate time options for picker (30-minute intervals)
const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

export default function CancelDay({ route, navigation }) {
  const { doctorId } = route.params;
  
  const [workplaces, setWorkplaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState(null);
  
  // Mode: 'cancel' for cancel all appointments, 'block' for blocking slots
  const [mode, setMode] = useState('cancel');
  
  // Unblock modal state
  const [unblockModalVisible, setUnblockModalVisible] = useState(false);
  const [existingBlocks, setExistingBlocks] = useState([]);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  
  const [formData, setFormData] = useState({
    dateOption: 'today', // 'today', 'tomorrow', 'custom'
    customDateText: '',
    selectedReason: '',
    customReason: '',
    // Block specific options
    blockType: 'fullDay', // 'fullDay', 'timeRange'
    startTime: '09:00',
    endTime: '17:00',
    applyToAll: false, // Apply to all workplaces
  });
  const [submitting, setSubmitting] = useState(false);

  // Refs for auto-focus and scroll
  const modalScrollRef = useRef(null);
  const customReasonInputRef = useRef(null);

  useEffect(() => {
    fetchWorkplaces();
  }, []);

  const fetchWorkplaces = async () => {
    try {
      setLoading(true);
      const response = await DoctorAPIService.fetchWorkplaces(doctorId);
      setWorkplaces(response || []);
    } catch (error) {
      console.error('Error fetching workplaces:', error);
      showAlert('Error', 'Failed to fetch workplaces');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkplaces();
    setRefreshing(false);
  };

  const openModal = (workplace, actionMode) => {
    setSelectedWorkplace(workplace);
    setMode(actionMode);
    setModalVisible(true);
    // Reset form
    setFormData({
      dateOption: 'today',
      customDateText: '',
      selectedReason: '',
      customReason: '',
      blockType: 'fullDay',
      startTime: '',
      endTime: '',
      applyToAll: false,
    });
  };

  const getTargetDate = () => {
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    const formatLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const today = new Date();
    switch (formData.dateOption) {
      case 'today':
        return formatLocal(today);
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return formatLocal(tomorrow);
      case 'custom':
        return formData.customDateText;
      default:
        return formatLocal(today);
    }
  };

  const handleReasonSelection = (reason) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedReason: reason,
      customReason: reason !== 'Other' ? '' : prev.customReason
    }));

    if (reason === 'Other') {
      setTimeout(() => {
        if (customReasonInputRef.current) {
          customReasonInputRef.current.focus();
          if (modalScrollRef.current) {
            modalScrollRef.current.scrollToEnd({ animated: true });
          }
        }
      }, 100);
    }
  };

  const handleDateSelect = (selectedDate) => {
    setFormData(prev => ({
      ...prev,
      customDateText: selectedDate,
      dateOption: 'custom'
    }));
  };

  const validateForm = () => {
    if (formData.dateOption === 'custom' && !formData.customDateText.trim()) {
      showAlert('Validation Error', 'Please select a date');
      return false;
    }

    if (!formData.selectedReason) {
      showAlert('Validation Error', 'Please select a reason');
      return false;
    }

    if (formData.selectedReason === 'Other' && !formData.customReason.trim()) {
      showAlert('Validation Error', 'Please specify your reason');
      return false;
    }

    if (mode === 'block' && formData.blockType === 'timeRange') {
      if (!formData.startTime || !formData.endTime) {
        showAlert('Validation Error', 'Please specify start and end time for blocking');
        return false;
      }
    }

    return true;
  };

  // Show confirmation before blocking (warns about existing appointments)
  const confirmBlockAction = () => {
    if (!validateForm()) return;
    
    const targetDate = getTargetDate();
    const timeInfo = formData.blockType === 'fullDay' 
      ? 'the entire day' 
      : `${formData.startTime} to ${formData.endTime}`;
    
    showAlert(
      '⚠️ Confirm Block Action',
      `You are about to block ${timeInfo} on ${targetDate}.\n\n` +
      `IMPORTANT: Any existing appointments during this blocked time will be automatically CANCELLED and patients will be notified.\n\n` +
      `This action cannot be undone, but you can reschedule cancelled appointments manually.\n\n` +
      `Do you want to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed & Cancel Appointments', 
          style: 'destructive',
          onPress: () => executeBlockAction()
        }
      ]
    );
  };

  const executeBlockAction = async () => {
    try {
      setSubmitting(true);
      const finalReason = formData.selectedReason === 'Other' 
        ? formData.customReason.trim() 
        : formData.selectedReason;
      const targetDate = getTargetDate();

      const payload = {
        date: targetDate,
        workplaceId: formData.applyToAll ? null : selectedWorkplace.id,
        isFullDay: formData.blockType === 'fullDay',
        startTime: formData.blockType === 'timeRange' ? formData.startTime : null,
        endTime: formData.blockType === 'timeRange' ? formData.endTime : null,
        reason: finalReason,
        cancelExistingAppointments: true // Flag to cancel existing appointments
      };

      console.log('[CancelDay] Blocking slots with cancel:', payload);
      const response = await DoctorAPIService.blockSlots(doctorId, payload);
      
      let successMessage = formData.blockType === 'fullDay'
        ? `Entire day blocked for ${targetDate}.`
        : `Time slot blocked from ${formData.startTime} to ${formData.endTime} on ${targetDate}.`;
      
      if (response.cancelledAppointments > 0) {
        successMessage += `\n\n${response.cancelledAppointments} existing appointment(s) were cancelled and patients have been notified.`;
      }
      
      showAlert(
        'Success',
        response.message || successMessage,
        [{ text: 'OK', onPress: () => { setModalVisible(false); fetchWorkplaces(); } }]
      );
    } catch (error) {
      console.error('Error blocking:', error);
      showAlert(
        'Error',
        error.response?.data?.message || 'Failed to block appointments. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (mode === 'block') {
      // Show confirmation for blocking
      confirmBlockAction();
      return;
    }

    try {
      setSubmitting(true);
      const finalReason = formData.selectedReason === 'Other' 
        ? formData.customReason.trim() 
        : formData.selectedReason;
      const targetDate = getTargetDate();

      // Cancel all appointments for the day
      const payload = {
        date: targetDate,
        reason: finalReason
      };

      console.log('[CancelDay] Cancelling appointments:', payload);
      const response = await DoctorAPIService.cancelWorkspaceDayAppointments(selectedWorkplace.id, payload);
      
      showAlert(
        'Success',
        response.message || 'All appointments for the selected date have been cancelled successfully',
        [{ text: 'OK', onPress: () => { 
          setModalVisible(false); 
          if (Platform.OS === 'web') {
            window.history.back();
          } else {
            navigation.goBack();
          }
        } }]
      );
    } catch (error) {
      console.error('Error:', error);
      showAlert(
        'Error',
        error.response?.data?.message || 'Failed to cancel appointments. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Unblock functionality
  const openUnblockModal = async (workplace) => {
    setSelectedWorkplace(workplace);
    setUnblockModalVisible(true);
    setSelectedBlocks([]);
    await fetchExistingBlocks(workplace.id);
  };

  const fetchExistingBlocks = async (workplaceId) => {
    try {
      setLoadingBlocks(true);
      const blocks = await DoctorAPIService.getBlockedSlots(doctorId);
      // Filter blocks for this workplace or all workplaces (workplaceId = null)
      const filteredBlocks = blocks.filter(b => 
        b.workplaceId === workplaceId || b.workplaceId === null
      );
      setExistingBlocks(filteredBlocks);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      showAlert('Error', 'Failed to fetch existing blocks');
    } finally {
      setLoadingBlocks(false);
    }
  };

  const toggleBlockSelection = (blockId) => {
    setSelectedBlocks(prev => {
      if (prev.includes(blockId)) {
        return prev.filter(id => id !== blockId);
      } else {
        return [...prev, blockId];
      }
    });
  };

  const handleUnblock = async () => {
    if (selectedBlocks.length === 0) {
      showAlert('Selection Required', 'Please select at least one block to remove');
      return;
    }

    showAlert(
      'Confirm Unblock',
      `Are you sure you want to remove ${selectedBlocks.length} blocked slot(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              setSubmitting(true);
              for (const blockId of selectedBlocks) {
                await DoctorAPIService.removeBlockedSlot(blockId);
              }
              showAlert(
                'Success',
                `${selectedBlocks.length} blocked slot(s) have been removed successfully`,
                [{ text: 'OK', onPress: () => { setUnblockModalVisible(false); fetchWorkplaces(); } }]
              );
            } catch (error) {
              console.error('Error unblocking:', error);
              showAlert('Error', 'Failed to unblock slots. Please try again.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const formatBlockInfo = (block) => {
    const date = new Date(block.blockDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    if (block.isFullDay) {
      return `${date} - Full Day`;
    } else {
      return `${date} - ${block.startTime} to ${block.endTime}`;
    }
  };

  const renderDateOption = (option, label) => (
    <TouchableOpacity
      style={[
        styles.dateOption,
        formData.dateOption === option && styles.dateOptionSelected
      ]}
      onPress={() => setFormData(prev => ({ ...prev, dateOption: option }))}
    >
      <Text style={[
        styles.dateOptionText,
        formData.dateOption === option && styles.dateOptionTextSelected
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
      
      <View style={styles.actionButtonsContainer}>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => openModal(item, 'cancel')}
          >
            <Text style={styles.cancelButtonText} numberOfLines={1}>Cancel Day</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.blockButton}
            onPress={() => openModal(item, 'block')}
          >
            <Text style={styles.blockButtonText} numberOfLines={1}>Block</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.unblockButton}
            onPress={() => openUnblockModal(item)}
          >
            <Text style={styles.unblockButtonText} numberOfLines={1}>Unblock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTimePicker = (label, value, onChange) => (
    <View style={styles.timePickerContainer}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <ScrollView 
        style={styles.timeScrollPicker}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {TIME_OPTIONS.map((time) => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeOption,
              value === time && styles.timeOptionSelected
            ]}
            onPress={() => onChange(time)}
          >
            <Text style={[
              styles.timeOptionText,
              value === time && styles.timeOptionTextSelected
            ]}>
              {time}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <TopBar title="Manage Availability" onBack={() => navigation.goBack()} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading workplaces...</Text>
        </View>
      ) : (
        <>
          <View style={styles.infoNoteContainer}>
            <Text style={styles.infoNoteIcon}>💡</Text>
            <Text style={styles.infoNoteText}>
              You can block specific time slots or entire day for your clinic/hospital using the <Text style={styles.infoNoteHighlight}>Block</Text> button below.
            </Text>
          </View>
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
        </>
      )}

      {/* Cancel/Block Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView 
              ref={modalScrollRef}
              style={styles.modalScrollView} 
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalTitle, mode === 'block' && styles.modalTitleBlock]}>
                {mode === 'cancel' ? 'Cancel Day Appointments' : 'Block Time Slots'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedWorkplace?.workplaceName}
              </Text>
              
              {/* Date Selection */}
              <Text style={styles.sectionTitle}>Select Date:</Text>
              <View style={styles.dateContainer}>
                {renderDateOption('today', 'Today')}
                {renderDateOption('tomorrow', 'Tomorrow')}
                {renderDateOption('custom', 'Custom Date')}
              </View>

              {/* Custom Date Input */}
              {formData.dateOption === 'custom' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Date:</Text>
                  <DatePicker
                    selectedDate={formData.customDateText}
                    onDateSelect={handleDateSelect}
                    minDate={new Date().toISOString().split('T')[0]}
                    title="Select Date"
                    buttonTitle={formData.customDateText ? 
                      new Date(formData.customDateText).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Select Date'
                    }
                  />
                </View>
              )}

              {/* Block Type Selection (only for block mode) */}
              {mode === 'block' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Block Type</Text>
                  <View style={styles.blockTypeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.blockTypeOption,
                        formData.blockType === 'fullDay' && styles.blockTypeOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, blockType: 'fullDay' }))}
                    >
                      <Text style={[
                        styles.blockTypeText,
                        formData.blockType === 'fullDay' && styles.blockTypeTextSelected
                      ]}>Full Day</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.blockTypeOption,
                        formData.blockType === 'timeRange' && styles.blockTypeOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, blockType: 'timeRange' }))}
                    >
                      <Text style={[
                        styles.blockTypeText,
                        formData.blockType === 'timeRange' && styles.blockTypeTextSelected
                      ]}>Time Range</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Time Range Inputs (only for block mode with timeRange) */}
              {mode === 'block' && formData.blockType === 'timeRange' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Time Range</Text>
                  <View style={styles.timeRangePickerContainer}>
                    {renderTimePicker('Start Time', formData.startTime, 
                      (time) => setFormData(prev => ({ ...prev, startTime: time })))}
                    <Text style={styles.timeRangeSeparator}>to</Text>
                    {renderTimePicker('End Time', formData.endTime, 
                      (time) => setFormData(prev => ({ ...prev, endTime: time })))}
                  </View>
                </View>
              )}

              {/* Apply to All Workplaces (only for block mode) */}
              {mode === 'block' && (
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setFormData(prev => ({ ...prev, applyToAll: !prev.applyToAll }))}
                >
                  <View style={[styles.checkbox, formData.applyToAll && styles.checkboxChecked]}>
                    {formData.applyToAll && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Apply to all workplaces</Text>
                </TouchableOpacity>
              )}

              {/* Reason Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {mode === 'cancel' ? 'Reason for Cancellation *' : 'Reason for Blocking *'}
                </Text>
                <Text style={styles.subLabel}>
                  {mode === 'cancel' 
                    ? 'Please select a reason for canceling all appointments' 
                    : 'Please select a reason (users will see this message)'}
                </Text>
                
                <View style={styles.reasonsList}>
                  {REASONS.map((reason, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.reasonOption,
                        formData.selectedReason === reason && styles.selectedReasonOption
                      ]}
                      onPress={() => handleReasonSelection(reason)}
                    >
                      <View style={styles.reasonOptionContent}>
                        <View style={[
                          styles.radioButton,
                          formData.selectedReason === reason && styles.selectedRadioButton
                        ]}>
                          {formData.selectedReason === reason && <View style={styles.radioButtonInner} />}
                        </View>
                        <Text style={[
                          styles.reasonText,
                          formData.selectedReason === reason && styles.selectedReasonText
                        ]}>
                          {reason}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {formData.selectedReason === 'Other' && (
                    <TextInput
                      ref={customReasonInputRef}
                      style={styles.customReasonInput}
                      placeholder="Please specify your reason..."
                      multiline={true}
                      numberOfLines={3}
                      value={formData.customReason}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, customReason: text }))}
                      textAlignVertical="top"
                    />
                  )}
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.submitButton, 
                    mode === 'block' && styles.submitButtonBlock,
                    submitting && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {mode === 'cancel' ? 'Cancel Appointments' : 'Block Appointments'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Unblock Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={unblockModalVisible}
        onRequestClose={() => setUnblockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.unblockModalTitle}>Manage Blocked Slots</Text>
            <Text style={styles.modalSubtitle}>
              {selectedWorkplace?.workplaceName}
            </Text>
            
            {loadingBlocks ? (
              <View style={styles.loadingBlocksContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Loading blocked slots...</Text>
              </View>
            ) : existingBlocks.length === 0 ? (
              <View style={styles.noBlocksContainer}>
                <Text style={styles.noBlocksIcon}>✓</Text>
                <Text style={styles.noBlocksText}>No blocked slots found for this workplace</Text>
              </View>
            ) : (
              <ScrollView style={styles.blocksListContainer}>
                <Text style={styles.selectInstructions}>
                  Select the blocked slots you want to remove:
                </Text>
                {existingBlocks.map((block) => (
                  <TouchableOpacity
                    key={block.id}
                    style={[
                      styles.blockItem,
                      selectedBlocks.includes(block.id) && styles.blockItemSelected
                    ]}
                    onPress={() => toggleBlockSelection(block.id)}
                  >
                    <View style={[
                      styles.blockCheckbox,
                      selectedBlocks.includes(block.id) && styles.blockCheckboxChecked
                    ]}>
                      {selectedBlocks.includes(block.id) && (
                        <Text style={styles.blockCheckmark}>✓</Text>
                      )}
                    </View>
                    <View style={styles.blockInfo}>
                      <Text style={styles.blockDateText}>
                        {formatBlockInfo(block)}
                      </Text>
                      <Text style={styles.blockReasonText}>
                        {block.reason || 'No reason specified'}
                      </Text>
                      <Text style={styles.blockWorkplaceText}>
                        {block.workplaceName || 'All Workplaces'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setUnblockModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.modalCancelButtonText}>Close</Text>
              </TouchableOpacity>
              
              {existingBlocks.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.unblockSubmitButton,
                    (submitting || selectedBlocks.length === 0) && styles.submitButtonDisabled
                  ]}
                  onPress={handleUnblock}
                  disabled={submitting || selectedBlocks.length === 0}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      Unblock ({selectedBlocks.length})
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
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
  infoNoteContainer: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    alignItems: 'flex-start',
  },
  infoNoteIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  infoNoteHighlight: {
    fontWeight: 'bold',
    color: '#f39c12',
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
  },
  workplaceContent: {
    marginBottom: 12,
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
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    marginHorizontal: 2,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  blockButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    marginHorizontal: 2,
  },
  blockButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  unblockButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    marginHorizontal: 2,
  },
  unblockButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  actionButtonsContainer: {
    width: '100%',
    marginTop: 12,
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
  modalButtons: {
    flexDirection: 'row',
    paddingTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginHorizontal: 5,
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginHorizontal: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  subLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  reasonsList: {
    marginBottom: 10,
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
  modalTitleBlock: {
    color: '#f39c12',
  },
  blockTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  blockTypeOption: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  blockTypeOptionSelected: {
    backgroundColor: '#ffeaa7',
    borderColor: '#f39c12',
  },
  blockTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  blockTypeTextSelected: {
    color: '#d68910',
    fontWeight: '600',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#f39c12',
    borderColor: '#d68910',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  submitButtonBlock: {
    backgroundColor: '#f39c12',
  },
  // Time Picker Styles
  timePickerContainer: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  timeScrollPicker: {
    height: 150,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeOptionSelected: {
    backgroundColor: '#f39c12',
  },
  timeOptionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#2c3e50',
  },
  timeOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  timeRangePickerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  timeRangeSeparator: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 85,
    fontWeight: '600',
  },
  // Unblock Modal Styles
  unblockModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingBlocksContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noBlocksContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noBlocksIcon: {
    fontSize: 50,
    color: '#27ae60',
    marginBottom: 10,
  },
  noBlocksText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  blocksListContainer: {
    maxHeight: 300,
    marginVertical: 10,
  },
  selectInstructions: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  blockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  blockItemSelected: {
    backgroundColor: '#e8f5e9',
    borderColor: '#27ae60',
  },
  blockCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockCheckboxChecked: {
    backgroundColor: '#27ae60',
    borderColor: '#1e8449',
  },
  blockCheckmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  blockInfo: {
    flex: 1,
  },
  blockDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  blockReasonText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  blockWorkplaceText: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 2,
  },
  unblockSubmitButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 48,
  },
});
