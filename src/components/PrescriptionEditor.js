import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import MedicineSearchModal from '../components/MedicineSearchModal';
import API_BASE_URL from '../config';
import SecureStore from '../utils/secureStorage';

export default function PrescriptionEditor({
  userId,
  doctorId,
  appointmentId,
  prescriptionId,
  onSave,
  onCancel,
}) {
  const [medicalNotes, setMedicalNotes] = useState('');
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  useEffect(() => {
    if (prescriptionId) {
      loadPrescription();
    }
  }, [prescriptionId]);

  const loadPrescription = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/${prescriptionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load prescription');

      const data = await response.json();
      setMedicalNotes(data.medicalNotes || '');
      setSelectedMedicines(data.medicines || []);
    } catch (error) {
      console.error('Error loading prescription:', error);
      Alert.alert('Error', 'Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = (medicine) => {
    setEditingMedicine({
      medicineId: medicine.id,
      medicineName: medicine.medicineName,
      composition: `${medicine.composition1 || ''}${medicine.composition2 ? ', ' + medicine.composition2 : ''}`,
      manufacturer: medicine.manufacturer,
      frequency: {
        morning: false,
        afternoon: false,
        evening: false,
        fasting: false,
      },
      duration: '',
      instructions: '',
    });
  };

  const toggleFrequency = (time) => {
    setEditingMedicine({
      ...editingMedicine,
      frequency: {
        ...editingMedicine.frequency,
        [time]: !editingMedicine.frequency[time],
      },
    });
  };

  const handleSaveMedicine = () => {
    const hasFrequency = Object.values(editingMedicine.frequency).some(v => v === true);
    if (!hasFrequency || !editingMedicine.duration) {
      Alert.alert('Error', 'Please select frequency and duration');
      return;
    }

    // Convert frequency object to string
    const frequencyString = Object.keys(editingMedicine.frequency)
      .filter(key => editingMedicine.frequency[key])
      .map(key => key.charAt(0).toUpperCase() + key.slice(1))
      .join(', ');

    setSelectedMedicines([...selectedMedicines, {
      ...editingMedicine,
      frequency: frequencyString, // Save as string for backend
    }]);
    setEditingMedicine(null);
  };

  const handleRemoveMedicine = (index) => {
    Alert.alert(
      'Remove Medicine',
      'Are you sure you want to remove this medicine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = [...selectedMedicines];
            updated.splice(index, 1);
            setSelectedMedicines(updated);
          },
        },
      ]
    );
  };

  const handleSavePrescription = async () => {
    if (!medicalNotes.trim() && selectedMedicines.length === 0) {
      Alert.alert('Error', 'Please add medical notes or medicines');
      return;
    }

    try {
      setLoading(true);
      
      console.log('💾 Starting prescription save...');
      console.log('📋 API_BASE_URL:', API_BASE_URL);
      console.log('📋 userId:', userId);
      console.log('📋 doctorId:', doctorId);
      console.log('📋 appointmentId:', appointmentId);
      console.log('📋 prescriptionId:', prescriptionId);
      console.log('📋 medicalNotes length:', medicalNotes.trim().length);
      console.log('📋 medicines count:', selectedMedicines.length);
      
      const token = await SecureStore.getItemAsync('accessToken');
      console.log('🔑 Token exists:', !!token);

      const body = {
        userId,
        doctorId,
        appointmentId,
        medicalNotes: medicalNotes.trim(),
        medicines: selectedMedicines,
      };

      console.log('📦 Request body:', JSON.stringify(body, null, 2));

      const url = prescriptionId
        ? `${API_BASE_URL}/api/prescriptions/${prescriptionId}`
        : `${API_BASE_URL}/api/prescriptions`;

      console.log('🌐 Full URL:', url);
      console.log('🌐 Method:', prescriptionId ? 'PUT' : 'POST');

      const response = await fetch(url, {
        method: prescriptionId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response body:', errorText);
        throw new Error(`Failed to save prescription: ${response.status} - ${errorText}`);
      }

      const savedPrescription = await response.json();
      console.log('✅ Prescription saved:', savedPrescription);
      Alert.alert('Success', 'Prescription saved successfully');
      onSave && onSave(savedPrescription);
    } catch (error) {
      console.error('❌ Error saving prescription:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      Alert.alert('Error', `Failed to save prescription: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !editingMedicine) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Medical Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Enter diagnosis, observations, and recommendations..."
            multiline
            numberOfLines={6}
            value={medicalNotes}
            onChangeText={setMedicalNotes}
            textAlignVertical="top"
          />
        </View>

        {/* Medicines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medicines</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowMedicineSearch(true)}
            >
              <Text style={styles.addButtonText}>+ Add Medicine</Text>
            </TouchableOpacity>
          </View>

          {selectedMedicines.map((medicine, index) => (
            <View key={index} style={styles.medicineCard}>
              <View style={styles.medicineHeader}>
                <Text style={styles.medicineName}>{medicine.medicineName}</Text>
                <TouchableOpacity onPress={() => handleRemoveMedicine(index)}>
                  <Text style={styles.removeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              {medicine.composition && (
                <Text style={styles.medicineComposition}>{medicine.composition}</Text>
              )}
              <View style={styles.medicineDetails}>
                <Text style={styles.medicineDetail}>
                  <Text style={styles.label}>Dosage:</Text> {medicine.dosage}
                </Text>
                <Text style={styles.medicineDetail}>
                  <Text style={styles.label}>Frequency:</Text> {medicine.frequency}
                </Text>
                <Text style={styles.medicineDetail}>
                  <Text style={styles.label}>Duration:</Text> {medicine.duration}
                </Text>
                {medicine.instructions && (
                  <Text style={styles.medicineDetail}>
                    <Text style={styles.label}>Instructions:</Text> {medicine.instructions}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {selectedMedicines.length === 0 && (
            <Text style={styles.emptyText}>No medicines added yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePrescription}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Prescription'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Medicine Search Modal */}
      <MedicineSearchModal
        visible={showMedicineSearch}
        onClose={() => setShowMedicineSearch(false)}
        onSelectMedicine={handleAddMedicine}
      />

      {/* Medicine Details Modal */}
      {editingMedicine && (
        <Modal
          visible={!!editingMedicine}
          animationType="slide"
          transparent
        >
          <View style={styles.modalOverlay}>
            <View style={styles.medicineModal}>
              <Text style={styles.modalTitle}>Add Medicine Details</Text>
              
              <Text style={styles.selectedMedicineName}>{editingMedicine.medicineName}</Text>
              {editingMedicine.composition && (
                <Text style={styles.selectedMedicineComposition}>{editingMedicine.composition}</Text>
              )}

              <Text style={styles.sectionLabel}>Frequency *</Text>
              <View style={styles.frequencyButtons}>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    editingMedicine.frequency.morning && styles.frequencyButtonActive
                  ]}
                  onPress={() => toggleFrequency('morning')}
                >
                  <Text style={[
                    styles.frequencyButtonText,
                    editingMedicine.frequency.morning && styles.frequencyButtonTextActive
                  ]}>
                    {editingMedicine.frequency.morning && '✓ '}Morning
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    editingMedicine.frequency.afternoon && styles.frequencyButtonActive
                  ]}
                  onPress={() => toggleFrequency('afternoon')}
                >
                  <Text style={[
                    styles.frequencyButtonText,
                    editingMedicine.frequency.afternoon && styles.frequencyButtonTextActive
                  ]}>
                    {editingMedicine.frequency.afternoon && '✓ '}Afternoon
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    editingMedicine.frequency.evening && styles.frequencyButtonActive
                  ]}
                  onPress={() => toggleFrequency('evening')}
                >
                  <Text style={[
                    styles.frequencyButtonText,
                    editingMedicine.frequency.evening && styles.frequencyButtonTextActive
                  ]}>
                    {editingMedicine.frequency.evening && '✓ '}Evening
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    editingMedicine.frequency.fasting && styles.frequencyButtonActive
                  ]}
                  onPress={() => toggleFrequency('fasting')}
                >
                  <Text style={[
                    styles.frequencyButtonText,
                    editingMedicine.frequency.fasting && styles.frequencyButtonTextActive
                  ]}>
                    {editingMedicine.frequency.fasting && '✓ '}Fasting
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.input, styles.durationSelector]}
                onPress={() => setShowDurationPicker(true)}
              >
                <Text style={editingMedicine.duration ? styles.durationText : styles.durationPlaceholder}>
                  {editingMedicine.duration || 'Select Duration *'}
                </Text>
                <Text style={styles.durationArrow}>▼</Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.input, styles.instructionsInput]}
                placeholder="Instructions (optional)"
                multiline
                numberOfLines={3}
                value={editingMedicine.instructions}
                onChangeText={(text) => setEditingMedicine({...editingMedicine, instructions: text})}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setEditingMedicine(null)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveMedicine}
                >
                  <Text style={styles.modalSaveButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Duration Picker Modal */}
      {showDurationPicker && (
        <Modal
          visible={showDurationPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDurationPicker(false)}
        >
          <TouchableOpacity
            style={styles.pickerModalOverlay}
            activeOpacity={1}
            onPress={() => setShowDurationPicker(false)}
          >
            <View style={styles.pickerModalContainer}>
              <Text style={styles.pickerModalTitle}>Select Duration</Text>
              <ScrollView style={styles.pickerScrollView}>
                {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={styles.pickerOption}
                    onPress={() => {
                      setEditingMedicine({
                        ...editingMedicine,
                        duration: `${day} ${day === 1 ? 'Day' : 'Days'}`
                      });
                      setShowDurationPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>
                      {day} {day === 1 ? 'Day' : 'Days'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  medicineCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  removeButton: {
    fontSize: 20,
    color: '#e74c3c',
    padding: 4,
  },
  medicineComposition: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  medicineDetails: {
    marginTop: 8,
  },
  medicineDetail: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    paddingVertical: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  medicineModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  selectedMedicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  selectedMedicineComposition: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  frequencyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
    marginBottom: 8,
  },
  frequencyButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  frequencyButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  frequencyButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  instructionsInput: {
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  durationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  durationPlaceholder: {
    fontSize: 16,
    color: '#95a5a6',
  },
  durationArrow: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    padding: 20,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerScrollView: {
    maxHeight: 300,
  },
  pickerOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
});
