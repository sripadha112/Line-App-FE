import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/apiConfig';
import * as SecureStore from 'expo-secure-store';

// Helper function to convert time object to string format for Java LocalTime
const formatTimeForAPI = (timeObj) => {
  if (!timeObj || typeof timeObj !== 'object') return null;
  const { hour, minute, second = 0 } = timeObj;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
};

// Convert 12-hour format to 24-hour format
const convertTo24Hour = (hour, isEvening) => {
  if (isEvening && hour !== 12) {
    return hour + 12;
  }
  if (!isEvening && hour === 12) {
    return 0;
  }
  return hour;
};

// Specialization options
const SPECIALIZATIONS = [
  'General Physician', 'Pediatrician', 'Gynecologist', 'Cardiologist', 'Dermatologist',
  'Orthopedic Surgeon', 'ENT Specialist', 'Ophthalmologist', 'Neurologist', 'Gastroenterologist',
  'Pulmonologist', 'Endocrinologist', 'Nephrologist', 'Oncologist', 'Psychiatrist',
  'Urologist', 'Dentist', 'Physiotherapist', 'General Surgeon', 'Radiologist', 'Diabetologist'
];

// Designation options
const DESIGNATIONS = [
  'Junior Doctor', 'Resident Doctor', 'Medical Officer', 'Consultant', 'Senior Consultant',
  'Surgeon', 'Chief Surgeon', 'Head of Department (HOD)', 'Medical Superintendent'
];

// Workplace type options
const WORKPLACE_TYPES = ['CLINIC', 'HOSPITAL'];

// Time options (1-12)
const TIME_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

// Minute options
const MINUTE_OPTIONS = [0, 15, 30, 45];

export default function DoctorRegistrationScreen({ navigation, route }) {
  const { mobile, otp } = route.params || {};
  
  // Add error handling for missing parameters
  if (!mobile || !otp) {
    navigation.replace('Auth');
    return null;
  }

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: mobile,
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    specialization: '',
    designation: '',
    workspaces: [{
      workplaceName: '',
      workplaceType: 'CLINIC',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      morningStartTime: { hour: 9, minute: 0, second: 0, nano: 0 },
      morningEndTime: { hour: 12, minute: 0, second: 0, nano: 0 },
      eveningStartTime: { hour: 17, minute: 0, second: 0, nano: 0 },
      eveningEndTime: { hour: 20, minute: 0, second: 0, nano: 0 },
      checkingDurationMinutes: 15,
      isPrimary: true
    }]
  });
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState({
    specialization: false,
    designation: false,
    workplaceType: {}  // Object to track workplace type dropdowns by index
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addWorkspace = () => {
    setFormData(prev => ({
      ...prev,
      workspaces: [...prev.workspaces, {
        workplaceName: '',
        workplaceType: 'CLINIC',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        morningStartTime: { hour: 9, minute: 0, second: 0, nano: 0 },
        morningEndTime: { hour: 12, minute: 0, second: 0, nano: 0 },
        eveningStartTime: { hour: 17, minute: 0, second: 0, nano: 0 },
        eveningEndTime: { hour: 20, minute: 0, second: 0, nano: 0 },
        checkingDurationMinutes: 15,
        isPrimary: false
      }]
    }));
  };

  const removeWorkspace = (index) => {
    if (formData.workspaces.length > 1) {
      setFormData(prev => ({
        ...prev,
        workspaces: prev.workspaces.filter((_, i) => i !== index)
      }));
    }
  };

  const handleWorkspaceChange = (field, value, index) => {
    setFormData(prev => ({
      ...prev,
      workspaces: prev.workspaces.map((workspace, i) => 
        i === index ? { ...workspace, [field]: value } : workspace
      )
    }));
  };

  const handleWorkspaceTimeChange = (timeType, timeField, value, index) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      workspaces: prev.workspaces.map((workspace, i) => 
        i === index ? {
          ...workspace,
          [timeType]: {
            ...workspace[timeType],
            [timeField]: numValue
          }
        } : workspace
      )
    }));
  };

  const toggleDropdown = (type, index = null) => {
    if (type === 'workplaceType' && index !== null) {
      setDropdownVisible(prev => ({
        ...prev,
        workplaceType: {
          ...prev.workplaceType,
          [index]: !prev.workplaceType[index]
        }
      }));
    } else {
      setDropdownVisible(prev => ({
        ...prev,
        [type]: !prev[type]
      }));
    }
  };

  const selectOption = (type, value, index = null) => {
    if (type === 'workplaceType' && index !== null) {
      handleWorkspaceChange('workplaceType', value, index);
      setDropdownVisible(prev => ({
        ...prev,
        workplaceType: {
          ...prev.workplaceType,
          [index]: false
        }
      }));
    } else {
      handleInputChange(type, value);
      setDropdownVisible(prev => ({
        ...prev,
        [type]: false
      }));
    }
  };

  const handleRegister = async () => {
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'address', 'city', 'state', 'pincode', 'specialization', 'designation'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    // Validate workspace required fields
    const workspaceErrors = [];
    formData.workspaces.forEach((workspace, index) => {
      const workspaceRequiredFields = ['workplaceName', 'address', 'city', 'state', 'pincode'];
      const missingWorkspaceFields = workspaceRequiredFields.filter(field => !workspace[field].trim());
      if (missingWorkspaceFields.length > 0) {
        workspaceErrors.push(`Workspace ${index + 1}: ${missingWorkspaceFields.join(', ')}`);
      }
    });
    
    if (missingFields.length > 0 || workspaceErrors.length > 0) {
      const errorMessage = [
        ...(missingFields.length > 0 ? [`Personal fields: ${missingFields.join(', ')}`] : []),
        ...workspaceErrors
      ].join('\n');
      Alert.alert('Error', `Please fill in all required fields:\n${errorMessage}`);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const body = {
        mobileNumber: String(mobile).trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        country: formData.country,
        specialization: formData.specialization.trim(),
        designation: formData.designation.trim(),
        workspaces: formData.workspaces.map(workspace => ({
          workplaceName: workspace.workplaceName.trim(),
          workplaceType: workspace.workplaceType,
          address: workspace.address.trim(),
          city: workspace.city.trim(),
          state: workspace.state.trim(),
          pincode: workspace.pincode.trim(),
          country: workspace.country,
          morningStartTime: formatTimeForAPI(workspace.morningStartTime),
          morningEndTime: formatTimeForAPI(workspace.morningEndTime),
          eveningStartTime: formatTimeForAPI(workspace.eveningStartTime),
          eveningEndTime: formatTimeForAPI(workspace.eveningEndTime),
          checkingDurationMinutes: parseInt(workspace.checkingDurationMinutes) || 15,
          isPrimary: workspace.isPrimary
        }))
      };
      
      console.log('🔄 Registering doctor with data:', body);
      const res = await api.post(API_ENDPOINTS.REGISTRATION.DOCTOR, body);
      const data = res.data;
      
      console.log('✅ Doctor registration successful:', data);
      
      // Store user info for future use
      await SecureStore.setItemAsync('userId', String(data.doctorId || data.id));
      await SecureStore.setItemAsync('fullName', formData.fullName);
      await SecureStore.setItemAsync('role', 'DOCTOR');
      
      Alert.alert(
        'Registration Successful!', 
        'Your doctor account has been created successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to doctor home
              navigation.reset({ 
                index: 0, 
                routes: [{ 
                  name: 'DoctorHome', 
                  params: { userId: data.doctorId || data.id } 
                }] 
              });
            }
          }
        ]
      );
    } catch (e) {
      console.error('❌ Doctor registration failed:', e);
      Alert.alert('Registration Failed', e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.header}>
        <Text style={styles.title}>Doctor Registration</Text>
        <Text style={styles.subtitle}>Complete your profile to get started</Text>
      </View>

      <View style={styles.form}>
        {/* Personal Information */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={formData.fullName}
            onChangeText={(value) => handleInputChange('fullName', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.mobileNumber}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter your complete address"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your city"
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your state"
            value={formData.state}
            onChangeText={(value) => handleInputChange('state', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pincode *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter pincode"
            value={formData.pincode}
            onChangeText={(value) => handleInputChange('pincode', value)}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        {/* Professional Information */}
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Specialization *</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => toggleDropdown('specialization')}
          >
            <Text style={[styles.dropdownText, !formData.specialization && styles.placeholderText]}>
              {formData.specialization || 'Select specialization'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          
          <Modal
            visible={dropdownVisible.specialization}
            transparent
            animationType="fade"
            onRequestClose={() => toggleDropdown('specialization')}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              onPress={() => toggleDropdown('specialization')}
            >
              <View style={styles.dropdownModal}>
                <ScrollView style={styles.dropdownList}>
                  {SPECIALIZATIONS.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownOption}
                      onPress={() => selectOption('specialization', option)}
                    >
                      <Text style={styles.dropdownOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Designation *</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => toggleDropdown('designation')}
          >
            <Text style={[styles.dropdownText, !formData.designation && styles.placeholderText]}>
              {formData.designation || 'Select designation'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          
          <Modal
            visible={dropdownVisible.designation}
            transparent
            animationType="fade"
            onRequestClose={() => toggleDropdown('designation')}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              onPress={() => toggleDropdown('designation')}
            >
              <View style={styles.dropdownModal}>
                <ScrollView style={styles.dropdownList}>
                  {DESIGNATIONS.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownOption}
                      onPress={() => selectOption('designation', option)}
                    >
                      <Text style={styles.dropdownOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        {/* Workplaces Section */}
        <Text style={styles.sectionTitle}>Workplaces</Text>
        <Text style={styles.sectionNote}>
          Add the places where your patients consult you. You can add multiple workplaces.
        </Text>

        {formData.workspaces.map((workspace, index) => (
          <View key={index} style={styles.workspaceContainer}>
            <View style={styles.workspaceHeader}>
              <Text style={styles.workspaceTitle}>
                Workplace {index + 1} {workspace.isPrimary && '(Primary)'}
              </Text>
              {formData.workspaces.length > 1 && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => removeWorkspace(index)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Workplace Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter workplace name"
                value={workspace.workplaceName}
                onChangeText={(value) => handleWorkspaceChange('workplaceName', value, index)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Workplace Type</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => toggleDropdown('workplaceType', index)}
              >
                <Text style={[styles.dropdownText, !workspace.workplaceType && styles.placeholderText]}>
                  {workspace.workplaceType || 'Select workplace type'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              
              <Modal
                visible={dropdownVisible.workplaceType[index] || false}
                transparent
                animationType="fade"
                onRequestClose={() => toggleDropdown('workplaceType', index)}
              >
                <TouchableOpacity 
                  style={styles.modalOverlay}
                  onPress={() => toggleDropdown('workplaceType', index)}
                >
                  <View style={styles.dropdownModal}>
                    <ScrollView style={styles.dropdownList}>
                      {WORKPLACE_TYPES.map((option, optionIndex) => (
                        <TouchableOpacity
                          key={optionIndex}
                          style={styles.dropdownOption}
                          onPress={() => selectOption('workplaceType', option, index)}
                        >
                          <Text style={styles.dropdownOptionText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Workplace Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter workplace address"
                value={workspace.address}
                onChangeText={(value) => handleWorkspaceChange('address', value, index)}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Workplace City *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter workplace city"
                value={workspace.city}
                onChangeText={(value) => handleWorkspaceChange('city', value, index)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Workplace State *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter workplace state"
                value={workspace.state}
                onChangeText={(value) => handleWorkspaceChange('state', value, index)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Workplace Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter workplace pincode"
                value={workspace.pincode}
                onChangeText={(value) => handleWorkspaceChange('pincode', value, index)}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            {/* Working Hours for this workplace */}
            <Text style={styles.subSectionTitle}>Working Hours</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Consultation Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                value={String(workspace.checkingDurationMinutes)}
                onChangeText={(value) => handleWorkspaceChange('checkingDurationMinutes', parseInt(value) || 15, index)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeGroup}>
                <Text style={styles.label}>Morning Start</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="9"
                    value={String(workspace.morningStartTime.hour)}
                    onChangeText={(value) => handleWorkspaceTimeChange('morningStartTime', 'hour', value, index)}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.timeColon}>:</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="00"
                    value={String(workspace.morningStartTime.minute).padStart(2, '0')}
                    onChangeText={(value) => handleWorkspaceTimeChange('morningStartTime', 'minute', value, index)}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.timePeriod}>AM</Text>
                </View>
              </View>

              <View style={styles.timeGroup}>
                <Text style={styles.label}>Morning End</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="12"
                    value={String(workspace.morningEndTime.hour)}
                    onChangeText={(value) => handleWorkspaceTimeChange('morningEndTime', 'hour', value, index)}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.timeColon}>:</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="00"
                    value={String(workspace.morningEndTime.minute).padStart(2, '0')}
                    onChangeText={(value) => handleWorkspaceTimeChange('morningEndTime', 'minute', value, index)}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.timePeriod}>PM</Text>
                </View>
              </View>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeGroup}>
                <Text style={styles.label}>Evening Start</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="5"
                    value={String(workspace.eveningStartTime.hour - 12)}
                    onChangeText={(value) => handleWorkspaceTimeChange('eveningStartTime', 'hour', parseInt(value) + 12, index)}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.timeColon}>:</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="00"
                    value={String(workspace.eveningStartTime.minute).padStart(2, '0')}
                    onChangeText={(value) => handleWorkspaceTimeChange('eveningStartTime', 'minute', value, index)}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.timePeriod}>PM</Text>
                </View>
              </View>

              <View style={styles.timeGroup}>
                <Text style={styles.label}>Evening End</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="8"
                    value={String(workspace.eveningEndTime.hour - 12)}
                    onChangeText={(value) => handleWorkspaceTimeChange('eveningEndTime', 'hour', parseInt(value) + 12, index)}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.timeColon}>:</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="00"
                    value={String(workspace.eveningEndTime.minute).padStart(2, '0')}
                    onChangeText={(value) => handleWorkspaceTimeChange('eveningEndTime', 'minute', value, index)}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.timePeriod}>PM</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={styles.addWorkspaceButton}
          onPress={addWorkspace}
        >
          <Text style={styles.addWorkspaceButtonText}>+ Add Another Workplace</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.registerButton, loading && styles.disabledButton]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>
            {loading ? 'Registering...' : 'Complete Registration'}
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    paddingBottom: 50,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
    paddingBottom: 5,
  },
  sectionNote: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 15,
    fontStyle: 'italic',
    backgroundColor: '#e8f4fd',
    padding: 10,
    borderRadius: 5,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 15,
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
  },
  // Dropdown styles
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  placeholderText: {
    color: '#6c757d',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6c757d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 300,
    width: '80%',
    margin: 20,
  },
  dropdownList: {
    maxHeight: 250,
  },
  dropdownOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  // Workspace styles
  workspaceContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  workspaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  workspaceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addWorkspaceButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addWorkspaceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Time input styles
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  timeInput: {
    width: 50,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    minWidth: 50,
  },
  timeColon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginHorizontal: 5,
  },
  timePeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginLeft: 8,
    minWidth: 25,
  },
  registerButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
