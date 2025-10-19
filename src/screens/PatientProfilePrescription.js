import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { DoctorAPIService } from '../services/doctorApiService';
import TopBar from '../components/TopBar';
import * as SecureStore from 'expo-secure-store';

export default function PatientProfilePrescription({ route, navigation }) {
  const { appointment } = route.params;
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [newPrescription, setNewPrescription] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [editingSections, setEditingSections] = useState({});
  const [sectionTempValues, setSectionTempValues] = useState({});
  const [activeFields, setActiveFields] = useState({});
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [currentDropdownField, setCurrentDropdownField] = useState('');
  const [prescriptionExpanded, setPrescriptionExpanded] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    getDoctorName();
  }, []);

  const getDoctorName = async () => {
    try {
      const doctorData = await SecureStore.getItemAsync('doctorData');
      console.log('Raw doctor data from SecureStore:', doctorData);
      if (doctorData) {
        const doctor = JSON.parse(doctorData);
        console.log('Parsed doctor object:', doctor);
        const name = doctor.fullName || doctor.name || doctor.doctorName || 'Doctor';
        console.log('Doctor name extracted:', name);
        setDoctorName(name);
      } else {
        console.log('No doctor data found in SecureStore');
        setDoctorName('Doctor');
      }
    } catch (error) {
      console.error('Error getting doctor name:', error);
      setDoctorName('Doctor');
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userId = appointment.userId || appointment.patientId;
      if (!userId) {
        Alert.alert('Error', 'Patient ID not found');
        navigation.goBack();
        return;
      }
      
      const profile = await DoctorAPIService.getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load patient profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getSectionName = (fieldName) => {
    const vitalFields = ['heightCm', 'weightKg', 'age', 'bloodGroup', 'bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 'bodyTemperature', 'bloodOxygenLevel'];
    const conditionFields = ['hasDiabetes', 'hasHypertension', 'hasHeartDisease', 'hasKidneyDisease', 'hasLiverDisease'];
    const historyFields = ['currentMedications', 'allergies', 'chronicDiseases', 'previousSurgeries', 'vaccinations', 'familyMedicalHistory'];
    
    if (vitalFields.includes(fieldName)) return 'vitals';
    if (conditionFields.includes(fieldName)) return 'conditions';
    if (historyFields.includes(fieldName)) return 'history';
    return 'other';
  };

  const saveSectionEdit = (sectionName) => {
    const sectionChanges = sectionTempValues[sectionName] || {};
    const formattedChanges = formatDataForAPI(sectionChanges);
    setEditedFields(prev => ({ ...prev, ...formattedChanges }));
    setEditingSections(prev => ({ ...prev, [sectionName]: false }));
    setSectionTempValues(prev => ({ ...prev, [sectionName]: {} }));
    // Clear active fields for this section
    setActiveFields(prev => {
      const newActiveFields = { ...prev };
      Object.keys(newActiveFields).forEach(fieldName => {
        if (getSectionName(fieldName) === sectionName) {
          delete newActiveFields[fieldName];
        }
      });
      return newActiveFields;
    });
  };

  const cancelSectionEdit = (sectionName) => {
    setEditingSections(prev => ({ ...prev, [sectionName]: false }));
    setSectionTempValues(prev => ({ ...prev, [sectionName]: {} }));
    // Clear active fields for this section
    setActiveFields(prev => {
      const newActiveFields = { ...prev };
      Object.keys(newActiveFields).forEach(fieldName => {
        if (getSectionName(fieldName) === sectionName) {
          delete newActiveFields[fieldName];
        }
      });
      return newActiveFields;
    });
  };

  const getFieldValue = (fieldName) => {
    const sectionName = getSectionName(fieldName);
    const sectionTemp = sectionTempValues[sectionName] || {};
    if (sectionTemp[fieldName] !== undefined) return sectionTemp[fieldName];
    return editedFields[fieldName] !== undefined ? editedFields[fieldName] : (userProfile[fieldName] || '');
  };

  const formatDataForAPI = (data) => {
    const arrayFields = ['currentMedications', 'allergies', 'chronicDiseases', 'previousSurgeries', 'vaccinations'];
    const formattedData = { ...data };

    arrayFields.forEach(fieldName => {
      if (formattedData[fieldName] !== undefined) {
        if (typeof formattedData[fieldName] === 'string') {
          // Convert comma-separated string to array
          formattedData[fieldName] = formattedData[fieldName]
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        }
      }
    });

    return formattedData;
  };

  const handleSaveAndComplete = async () => {
    if (!newPrescription.trim()) {
      Alert.alert('Error', 'Please add a prescription before saving');
      return;
    }

    Alert.alert(
      'Save & Complete',
      'This will save all changes and mark the appointment as completed. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save & Complete', 
          onPress: async () => {
            try {
              setSaving(true);
              
              // Prepare update data and format arrays properly
              const updateData = formatDataForAPI({
                ...editedFields
              });

              // Replace medical notes with new prescription and doctor's name
              if (newPrescription.trim()) {
                const prescriptionWithDoctor = `${newPrescription.trim()}, by: ${doctorName}`;
                updateData.medicalNotes = prescriptionWithDoctor;
              }

              console.log('Doctor Name:', doctorName);
              console.log('New Prescription:', newPrescription);
              console.log('Existing Medical Notes:', userProfile.medicalNotes);
              console.log('Updated Medical Notes:', updateData.medicalNotes);
              console.log('Complete update data being sent to API:', JSON.stringify(updateData, null, 2));

              // Update profile
              const userId = appointment.userId || appointment.patientId;
              await DoctorAPIService.updateUserProfile(userId, updateData);

              // Complete appointment
              await DoctorAPIService.completeAppointment(appointment.appointmentId);

              Alert.alert(
                'Success',
                'Patient profile updated and appointment completed successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Error saving and completing:', error);
              Alert.alert('Error', 'Failed to save changes. Please try again.');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const renderEditableField = (label, fieldName, value, multiline = false, sectionName = null) => {
    const displayValue = getFieldValue(fieldName);
    const isFieldActive = sectionName && activeFields[fieldName];

    const handleFieldChange = (newValue) => {
      if (sectionName) {
        // For sections with section-level save/cancel
        if (!editingSections[sectionName]) {
          setEditingSections(prev => ({ ...prev, [sectionName]: true }));
        }
        setSectionTempValues(prev => ({
          ...prev,
          [sectionName]: {
            ...prev[sectionName],
            [fieldName]: newValue
          }
        }));
      } else {
        // For fields without section-level save/cancel (backward compatibility)
        setEditedFields(prev => ({ ...prev, [fieldName]: newValue }));
      }
    };

    const handleFieldPress = () => {
      if (sectionName) {
        // Enable editing mode for the section if not already enabled
        if (!editingSections[sectionName]) {
          setEditingSections(prev => ({ ...prev, [sectionName]: true }));
        }
        
        // Make only this specific field active
        setActiveFields(prev => ({ ...prev, [fieldName]: true }));
        
        // Initialize temp value for this field with current value
        setSectionTempValues(prev => ({ 
          ...prev, 
          [sectionName]: {
            ...prev[sectionName],
            [fieldName]: displayValue || ''
          }
        }));
      } else {
        // For individual field editing (backward compatibility)
        handleFieldEdit(fieldName, displayValue);
      }
    };

    return (
      <View style={styles.compactFieldContainer}>
        <View style={styles.compactFieldRow}>
          <Text style={styles.compactFieldLabel}>{label}:</Text>
          {isFieldActive ? (
            <TextInput
              style={[styles.compactFieldInput, multiline && styles.multilineInput]}
              value={sectionTempValues[sectionName]?.[fieldName] !== undefined ? 
                     String(sectionTempValues[sectionName][fieldName]) : 
                     String(displayValue)}
              onChangeText={handleFieldChange}
              multiline={multiline}
              numberOfLines={multiline ? 2 : 1}
              placeholder="Tap to edit"
              autoFocus={true}
            />
          ) : (
            <TouchableOpacity
              style={styles.compactFieldValue}
              onPress={handleFieldPress}
            >
              <Text style={[
                styles.compactFieldText, 
                editedFields[fieldName] && styles.editedText,
                sectionTempValues[sectionName]?.[fieldName] !== undefined && styles.pendingEditText
              ]}>
                {displayValue || 'Tap to add'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderArrayField = (label, fieldName, value, sectionName = null) => {
    const arrayValue = Array.isArray(value) ? value.join(', ') : (value || '');
    return renderEditableField(label, fieldName, arrayValue, true, sectionName);
  };

  const renderDropdownField = (label, fieldName, value, options, sectionName = null) => {
    const displayValue = getFieldValue(fieldName);

    const handleDropdownPress = () => {
      if (sectionName) {
        // Enable editing mode for the section if not already enabled
        if (!editingSections[sectionName]) {
          setEditingSections(prev => ({ ...prev, [sectionName]: true }));
        }
        
        // Make only this specific field active
        setActiveFields(prev => ({ ...prev, [fieldName]: true }));
        
        // Initialize temp value for this field with current value
        setSectionTempValues(prev => ({ 
          ...prev, 
          [sectionName]: {
            ...prev[sectionName],
            [fieldName]: displayValue || ''
          }
        }));
      }
      setCurrentDropdownField(fieldName);
      setDropdownOptions(options);
      setDropdownVisible(true);
    };

    const handleOptionSelect = (selectedValue) => {
      if (sectionName && editingSections[sectionName]) {
        setSectionTempValues(prev => ({
          ...prev,
          [sectionName]: {
            ...prev[sectionName],
            [fieldName]: selectedValue
          }
        }));
      } else {
        setEditedFields(prev => ({ ...prev, [fieldName]: selectedValue }));
      }
      setDropdownVisible(false);
    };

    return (
      <View style={styles.compactFieldContainer}>
        <View style={styles.compactFieldRow}>
          <Text style={styles.compactFieldLabel}>{label}:</Text>
          <TouchableOpacity
            style={styles.compactFieldValue}
            onPress={handleDropdownPress}
          >
            <Text style={[
              styles.compactFieldText, 
              editedFields[fieldName] && styles.editedText,
              sectionTempValues[sectionName]?.[fieldName] !== undefined && styles.pendingEditText
            ]}>
              {displayValue || 'Tap to select'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSectionHeader = (title, sectionName) => {
    const isEditing = editingSections[sectionName];
    const hasActiveFields = Object.keys(activeFields).some(fieldName => 
      getSectionName(fieldName) === sectionName && activeFields[fieldName]
    );
    
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {isEditing && hasActiveFields && (
          <View style={styles.sectionButtons}>
            <TouchableOpacity 
              style={styles.sectionSaveButton} 
              onPress={() => saveSectionEdit(sectionName)}
            >
              <Text style={styles.sectionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sectionCancelButton} 
              onPress={() => cancelSectionEdit(sectionName)}
            >
              <Text style={styles.sectionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar title="Patient Profile" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading patient profile...</Text>
        </View>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <TopBar title="Patient Profile" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load patient profile</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <TopBar title="Patient Profile" onBack={() => navigation.goBack()} />
      
      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {/* Patient Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.patientName}>{userProfile.fullName}</Text>
              <Text style={styles.patientContact}>📞 {userProfile.mobileNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{userProfile.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{userProfile.address || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Emergency Contact:</Text>
              <Text style={styles.infoValue}>
                {userProfile.emergencyContactName || 'N/A'} 
                {userProfile.emergencyContactNumber && ` (${userProfile.emergencyContactNumber})`}
              </Text>
            </View>
          </View>
        </View>

        {/* Medical Vitals */}
        <View style={styles.section}>
          {renderSectionHeader('Medical Vitals', 'vitals')}
          <View style={styles.sectionContent}>
            {renderEditableField('Height (cm)', 'heightCm', userProfile.heightCm, false, 'vitals')}
            {renderEditableField('Weight (kg)', 'weightKg', userProfile.weightKg, false, 'vitals')}
            {renderEditableField('Age', 'age', userProfile.age, false, 'vitals')}
            {renderDropdownField('Blood Group', 'bloodGroup', userProfile.bloodGroup, ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 'vitals')}
            {renderEditableField('BP Systolic', 'bloodPressureSystolic', userProfile.bloodPressureSystolic, false, 'vitals')}
            {renderEditableField('BP Diastolic', 'bloodPressureDiastolic', userProfile.bloodPressureDiastolic, false, 'vitals')}
            {renderEditableField('Heart Rate (bpm)', 'heartRate', userProfile.heartRate, false, 'vitals')}
            {renderEditableField('Temperature (°F)', 'bodyTemperature', userProfile.bodyTemperature, false, 'vitals')}
            {renderEditableField('Oxygen Level (%)', 'bloodOxygenLevel', userProfile.bloodOxygenLevel, false, 'vitals')}
          </View>
        </View>

        {/* Medical Conditions */}
        <View style={styles.section}>
          {renderSectionHeader('Medical Conditions', 'conditions')}
          <View style={styles.sectionContent}>
            <View style={styles.conditionsGrid}>
              <View style={styles.conditionItem}>
                <Text style={styles.conditionLabel}>Diabetes:</Text>
                <TouchableOpacity
                  style={styles.conditionToggle}
                  onPress={() => {
                    const sectionName = 'conditions';
                    if (!editingSections[sectionName]) {
                      setEditingSections(prev => ({ ...prev, [sectionName]: true }));
                      setSectionTempValues(prev => ({ ...prev, [sectionName]: {} }));
                    }
                    // Set the field as active
                    setActiveFields(prev => ({ ...prev, 'hasDiabetes': true }));
                    setSectionTempValues(prev => ({
                      ...prev,
                      [sectionName]: {
                        ...prev[sectionName],
                        hasDiabetes: !getFieldValue('hasDiabetes')
                      }
                    }));
                  }}
                >
                  <Text style={[styles.conditionValue, getFieldValue('hasDiabetes') && styles.conditionActive]}>
                    {getFieldValue('hasDiabetes') ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.conditionItem}>
                <Text style={styles.conditionLabel}>Hypertension:</Text>
                <TouchableOpacity
                  style={styles.conditionToggle}
                  onPress={() => {
                    const sectionName = 'conditions';
                    if (!editingSections[sectionName]) {
                      setEditingSections(prev => ({ ...prev, [sectionName]: true }));
                      setSectionTempValues(prev => ({ ...prev, [sectionName]: {} }));
                    }
                    // Set the field as active
                    setActiveFields(prev => ({ ...prev, 'hasHypertension': true }));
                    setSectionTempValues(prev => ({
                      ...prev,
                      [sectionName]: {
                        ...prev[sectionName],
                        hasHypertension: !getFieldValue('hasHypertension')
                      }
                    }));
                  }}
                >
                  <Text style={[styles.conditionValue, getFieldValue('hasHypertension') && styles.conditionActive]}>
                    {getFieldValue('hasHypertension') ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.conditionItem}>
                <Text style={styles.conditionLabel}>Heart Disease:</Text>
                <TouchableOpacity
                  style={styles.conditionToggle}
                  onPress={() => {
                    const sectionName = 'conditions';
                    if (!editingSections[sectionName]) {
                      setEditingSections(prev => ({ ...prev, [sectionName]: true }));
                      setSectionTempValues(prev => ({ ...prev, [sectionName]: {} }));
                    }
                    // Set the field as active
                    setActiveFields(prev => ({ ...prev, 'hasHeartDisease': true }));
                    setSectionTempValues(prev => ({
                      ...prev,
                      [sectionName]: {
                        ...prev[sectionName],
                        hasHeartDisease: !getFieldValue('hasHeartDisease')
                      }
                    }));
                  }}
                >
                  <Text style={[styles.conditionValue, getFieldValue('hasHeartDisease') && styles.conditionActive]}>
                    {getFieldValue('hasHeartDisease') ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.conditionItem}>
                <Text style={styles.conditionLabel}>Kidney Disease:</Text>
                <TouchableOpacity
                  style={styles.conditionToggle}
                  onPress={() => {
                    const sectionName = 'conditions';
                    if (!editingSections[sectionName]) {
                      setEditingSections(prev => ({ ...prev, [sectionName]: true }));
                      setSectionTempValues(prev => ({ ...prev, [sectionName]: {} }));
                    }
                    // Set the field as active
                    setActiveFields(prev => ({ ...prev, 'hasKidneyDisease': true }));
                    setSectionTempValues(prev => ({
                      ...prev,
                      [sectionName]: {
                        ...prev[sectionName],
                        hasKidneyDisease: !getFieldValue('hasKidneyDisease')
                      }
                    }));
                  }}
                >
                  <Text style={[styles.conditionValue, getFieldValue('hasKidneyDisease') && styles.conditionActive]}>
                    {getFieldValue('hasKidneyDisease') ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.conditionItem}>
                <Text style={styles.conditionLabel}>Liver Disease:</Text>
                <TouchableOpacity
                  style={styles.conditionToggle}
                  onPress={() => {
                    const sectionName = 'conditions';
                    if (!editingSections[sectionName]) {
                      setEditingSections(prev => ({ ...prev, [sectionName]: true }));
                      setSectionTempValues(prev => ({ ...prev, [sectionName]: {} }));
                    }
                    // Set the field as active
                    setActiveFields(prev => ({ ...prev, 'hasLiverDisease': true }));
                    setSectionTempValues(prev => ({
                      ...prev,
                      [sectionName]: {
                        ...prev[sectionName],
                        hasLiverDisease: !getFieldValue('hasLiverDisease')
                      }
                    }));
                  }}
                >
                  <Text style={[styles.conditionValue, getFieldValue('hasLiverDisease') && styles.conditionActive]}>
                    {getFieldValue('hasLiverDisease') ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Medical History */}
        <View style={styles.section}>
          {renderSectionHeader('Medical History', 'history')}
          <View style={styles.sectionContent}>
            {renderArrayField('Current Medications', 'currentMedications', userProfile.currentMedications, 'history')}
            {renderArrayField('Allergies', 'allergies', userProfile.allergies, 'history')}
            {renderArrayField('Chronic Diseases', 'chronicDiseases', userProfile.chronicDiseases, 'history')}
            {renderArrayField('Previous Surgeries', 'previousSurgeries', userProfile.previousSurgeries, 'history')}
            {renderArrayField('Vaccinations', 'vaccinations', userProfile.vaccinations, 'history')}
            {renderEditableField('Family Medical History', 'familyMedicalHistory', userProfile.familyMedicalHistory, true, 'history')}
          </View>
        </View>

        {/* Previous Prescriptions */}
        {userProfile.prescription && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithButton}>
              <Text style={styles.sectionTitle}>Previous Prescriptions</Text>
              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => setPrescriptionExpanded(!prescriptionExpanded)}
              >
                <Text style={styles.expandButtonText}>
                  {prescriptionExpanded ? '🔽 Collapse' : '🔼 Expand'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[
              styles.prescriptionHistoryContainer,
              prescriptionExpanded && styles.prescriptionHistoryExpanded
            ]}>
              <ScrollView 
                style={styles.prescriptionHistory}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <Text style={styles.prescriptionText}>{userProfile.prescription}</Text>
              </ScrollView>
            </View>
          </View>
        )}

        {/* New Prescription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Prescription</Text>
          <TextInput
            style={styles.prescriptionInput}
            placeholder="Enter new prescription here..."
            value={newPrescription}
            onChangeText={setNewPrescription}
            multiline={true}
            numberOfLines={6}
            textAlignVertical="top"
            returnKeyType="default"
            blurOnSubmit={false}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveCompleteButton, saving && styles.buttonDisabled]}
          onPress={handleSaveAndComplete}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveCompleteButtonText}>Save & Complete Appointment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {currentDropdownField === 'bloodGroup' ? 'Blood Group' : 'Option'}</Text>
            {dropdownOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalOption}
                onPress={() => {
                  const fieldName = currentDropdownField;
                  const sectionName = getSectionName(fieldName);
                  
                  if (editingSections[sectionName]) {
                    // If section is being edited, update temp values
                    setSectionTempValues(prev => ({
                      ...prev,
                      [sectionName]: {
                        ...prev[sectionName],
                        [fieldName]: option
                      }
                    }));
                  } else {
                    // Otherwise update edited fields directly
                    setEditedFields(prev => ({ ...prev, [fieldName]: option }));
                  }
                  setDropdownVisible(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 8,
  },
  sectionContent: {
    flex: 1,
  },
  sectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionSaveButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sectionCancelButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sectionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  infoGrid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    textAlign: 'right',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  patientContact: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  compactFieldContainer: {
    marginBottom: 8,
  },
  compactFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    flex: 1,
  },
  compactFieldValue: {
    flex: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  compactFieldText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  compactFieldInput: {
    flex: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3498db',
    fontSize: 14,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: '45%',
    paddingVertical: 4,
  },
  editedText: {
    color: '#3498db',
    fontWeight: '500',
  },
  pendingEditText: {
    color: '#f39c12',
    fontWeight: '500',
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  conditionLabel: {
    fontSize: 14,
    color: '#34495e',
    flex: 1,
  },
  conditionToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 50,
    alignItems: 'center',
  },
  conditionValue: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  conditionActive: {
    color: '#e74c3c',
    fontWeight: '500',
  },
  prescriptionHistoryContainer: {
    height: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  prescriptionHistoryExpanded: {
    height: 300,
  },
  prescriptionHistory: {
    flex: 1,
    padding: 12,
    paddingBottom: 20,
  },
  sectionHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expandButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expandButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  prescriptionText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 22,
    paddingBottom: 30,
  },
  prescriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  saveCompleteButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  saveCompleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    minWidth: 250,
    maxWidth: 300,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
});
