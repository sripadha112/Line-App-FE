import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { UserAPIService } from '../services/doctorApiService';
import { api } from '../services/api';

export default function EditProfile({ route, navigation }) {
  const { userId, userDetails } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    age: '',
    bloodGroup: '',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    
    // Physical Information
    heightCm: '',
    weightKg: '',
    
    // Vital Signs
    heartRate: '',
    bodyTemperature: '',
    bloodOxygenLevel: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    
    // Medical Conditions
    hasDiabetes: false,
    hasHypertension: false,
    hasHeartDisease: false,
    hasKidneyDisease: false,
    hasLiverDisease: false,
    
    // Medical History Lists
    currentMedications: [],
    allergies: [],
    chronicDiseases: [],
    previousSurgeries: [],
    vaccinations: [],
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactRelation: '',
  });

  const [medications, setMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [surgeries, setSurgeries] = useState('');
  const [vaccinations, setVaccinations] = useState('');

  useEffect(() => {
    if (userDetails) {
      setFormData({
        fullName: userDetails.fullName || '',
        email: userDetails.email || '',
        age: userDetails.age ? userDetails.age.toString() : '',
        bloodGroup: userDetails.bloodGroup || '',
        
        address: userDetails.address || '',
        city: userDetails.city || '',
        state: userDetails.state || '',
        pincode: userDetails.pincode || '',
        country: userDetails.country || '',
        
        heightCm: userDetails.heightCm ? userDetails.heightCm.toString() : '',
        weightKg: userDetails.weightKg ? userDetails.weightKg.toString() : '',
        
        heartRate: userDetails.heartRate ? userDetails.heartRate.toString() : '',
        bodyTemperature: userDetails.bodyTemperature ? userDetails.bodyTemperature.toString() : '',
        bloodOxygenLevel: userDetails.bloodOxygenLevel ? userDetails.bloodOxygenLevel.toString() : '',
        bloodPressureSystolic: userDetails.bloodPressureSystolic ? userDetails.bloodPressureSystolic.toString() : '',
        bloodPressureDiastolic: userDetails.bloodPressureDiastolic ? userDetails.bloodPressureDiastolic.toString() : '',
        
        hasDiabetes: userDetails.hasDiabetes || false,
        hasHypertension: userDetails.hasHypertension || false,
        hasHeartDisease: userDetails.hasHeartDisease || false,
        hasKidneyDisease: userDetails.hasKidneyDisease || false,
        hasLiverDisease: userDetails.hasLiverDisease || false,
        
        currentMedications: userDetails.currentMedications || [],
        allergies: userDetails.allergies || [],
        chronicDiseases: userDetails.chronicDiseases || [],
        previousSurgeries: userDetails.previousSurgeries || [],
        vaccinations: userDetails.vaccinations || [],
        
        emergencyContactName: userDetails.emergencyContactName || '',
        emergencyContactNumber: userDetails.emergencyContactNumber || '',
        emergencyContactRelation: userDetails.emergencyContactRelation || '',
      });

      // Set list strings for editing
      setMedications(userDetails.currentMedications ? userDetails.currentMedications.join(', ') : '');
      setAllergies(userDetails.allergies ? userDetails.allergies.join(', ') : '');
      setChronicDiseases(userDetails.chronicDiseases ? userDetails.chronicDiseases.join(', ') : '');
      setSurgeries(userDetails.previousSurgeries ? userDetails.previousSurgeries.join(', ') : '');
      setVaccinations(userDetails.vaccinations ? userDetails.vaccinations.join(', ') : '');
    }
  }, [userDetails]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBooleanChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const parseListString = (str) => {
    return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Prepare data for API
      const updatedData = {
        ...formData,
        // Convert string numbers to integers/floats
        age: formData.age ? parseInt(formData.age) : null,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
        bodyTemperature: formData.bodyTemperature ? parseFloat(formData.bodyTemperature) : null,
        bloodOxygenLevel: formData.bloodOxygenLevel ? parseFloat(formData.bloodOxygenLevel) : null,
        bloodPressureSystolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : null,
        bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : null,
        
        // Convert comma-separated strings to arrays
        currentMedications: parseListString(medications),
        allergies: parseListString(allergies),
        chronicDiseases: parseListString(chronicDiseases),
        previousSurgeries: parseListString(surgeries),
        vaccinations: parseListString(vaccinations),
      };

      console.log('Updating profile with data:', updatedData);

      const response = await UserAPIService.updateProfile(userId, updatedData);
      
      console.log('Profile update response:', response);

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#f8f9fa" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
            <Text style={[styles.saveButtonText, loading && styles.disabledText]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Personal Information</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.age}
                  onChangeText={(value) => handleInputChange('age', value)}
                  placeholder="Enter age"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Blood Group</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.bloodGroup}
                  onChangeText={(value) => handleInputChange('bloodGroup', value)}
                  placeholder="Enter blood group (e.g., A+, B-, O+)"
                />
              </View>
            </View>
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Address Information</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={formData.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  placeholder="Enter address"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.city}
                  onChangeText={(value) => handleInputChange('city', value)}
                  placeholder="Enter city"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.state}
                  onChangeText={(value) => handleInputChange('state', value)}
                  placeholder="Enter state"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PIN Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.pincode}
                  onChangeText={(value) => handleInputChange('pincode', value)}
                  placeholder="Enter PIN code"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.country}
                  onChangeText={(value) => handleInputChange('country', value)}
                  placeholder="Enter country"
                />
              </View>
            </View>
          </View>

          {/* Physical Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📏 Physical Information</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.heightCm}
                  onChangeText={(value) => handleInputChange('heightCm', value)}
                  placeholder="Enter height in cm"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.weightKg}
                  onChangeText={(value) => handleInputChange('weightKg', value)}
                  placeholder="Enter weight in kg"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Vital Signs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💓 Vital Signs</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Heart Rate (bpm)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.heartRate}
                  onChangeText={(value) => handleInputChange('heartRate', value)}
                  placeholder="Enter heart rate"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Body Temperature (°F)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.bodyTemperature}
                  onChangeText={(value) => handleInputChange('bodyTemperature', value)}
                  placeholder="Enter body temperature"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Blood Oxygen Level (%)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.bloodOxygenLevel}
                  onChangeText={(value) => handleInputChange('bloodOxygenLevel', value)}
                  placeholder="Enter oxygen level"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Blood Pressure - Systolic</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.bloodPressureSystolic}
                  onChangeText={(value) => handleInputChange('bloodPressureSystolic', value)}
                  placeholder="Enter systolic pressure"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Blood Pressure - Diastolic</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.bloodPressureDiastolic}
                  onChangeText={(value) => handleInputChange('bloodPressureDiastolic', value)}
                  placeholder="Enter diastolic pressure"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Medical Conditions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏥 Medical Conditions</Text>
            <View style={styles.formCard}>
              {[
                { key: 'hasDiabetes', label: 'Diabetes' },
                { key: 'hasHypertension', label: 'Hypertension' },
                { key: 'hasHeartDisease', label: 'Heart Disease' },
                { key: 'hasKidneyDisease', label: 'Kidney Disease' },
                { key: 'hasLiverDisease', label: 'Liver Disease' },
              ].map((condition) => (
                <View key={condition.key} style={styles.checkboxGroup}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => handleBooleanChange(condition.key, !formData[condition.key])}
                  >
                    <View style={[styles.checkboxInner, formData[condition.key] && styles.checkboxChecked]}>
                      {formData[condition.key] && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>{condition.label}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Medical History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Medical History</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Medications</Text>
                <Text style={styles.helpText}>Separate multiple medications with commas</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={medications}
                  onChangeText={setMedications}
                  placeholder="e.g., Aspirin 100mg, Metformin 500mg"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Allergies</Text>
                <Text style={styles.helpText}>Separate multiple allergies with commas</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={allergies}
                  onChangeText={setAllergies}
                  placeholder="e.g., Peanuts, Shellfish, Latex"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Chronic Diseases</Text>
                <Text style={styles.helpText}>Separate multiple diseases with commas</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={chronicDiseases}
                  onChangeText={setChronicDiseases}
                  placeholder="e.g., Diabetes Type 2, Hypertension"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Previous Surgeries</Text>
                <Text style={styles.helpText}>Separate multiple surgeries with commas</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={surgeries}
                  onChangeText={setSurgeries}
                  placeholder="e.g., Appendectomy 2020, Gallbladder removal 2018"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vaccinations</Text>
                <Text style={styles.helpText}>Separate multiple vaccinations with commas</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={vaccinations}
                  onChangeText={setVaccinations}
                  placeholder="e.g., COVID-19, Flu 2024, Hepatitis B"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 Emergency Contact</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.emergencyContactName}
                  onChangeText={(value) => handleInputChange('emergencyContactName', value)}
                  placeholder="Enter emergency contact name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.emergencyContactNumber}
                  onChangeText={(value) => handleInputChange('emergencyContactNumber', value)}
                  placeholder="Enter emergency contact number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.emergencyContactRelation}
                  onChangeText={(value) => handleInputChange('emergencyContactRelation', value)}
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
              </View>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  saveButton: {
    paddingVertical: 5,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  disabledText: {
    color: '#bdc3c7',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2c3e50',
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxGroup: {
    marginBottom: 10,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#2c3e50',
  },
  bottomSpacing: {
    height: 50,
  },
});
