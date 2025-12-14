import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';
import TopBar from '../components/TopBar';
import api from '../services/api';

export default function QuickBookingQR({ route, navigation }) {
  const { doctorId } = route.params;
  const [workplaces, setWorkplaces] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const viewShotRef = useRef();

  // Fetch workplaces and doctor profile when screen loads
  useFocusEffect(
    React.useCallback(() => {
      fetchWorkplaces();
      fetchDoctorProfile();
    }, [doctorId])
  );

  const fetchWorkplaces = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/doctors/${doctorId}/workplaces`);
      setWorkplaces(response.data || []);
    } catch (error) {
      console.log('Error fetching workplaces:', error.message);
      Alert.alert('Error', 'Failed to load workplaces. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorProfile = async () => {
    try {
      // console.log('📤 Fetching doctor profile for ID:', doctorId);
      const response = await api.get(`/api/doctor/${doctorId}`);
      // console.log('👨‍⚕️ Doctor profile response:', response.data);
      setDoctorProfile(response.data);
    } catch (error) {
      console.log('❌ Error fetching doctor profile:', error.message);
      // Don't show error for this as it's supplementary data
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWorkplaces(), fetchDoctorProfile()]);
    setRefreshing(false);
  };

  // Generate enhanced URL with all parameters
  const generateBookingURL = (workplace) => {
    // const baseURL = 'http://localhost:8000/';
    const baseURL = 'https://sripadha112.github.io/QuickBooking/';
    const params = new URLSearchParams();
    
    // Required parameters
    params.append('doctorId', doctorId);
    params.append('workplaceId', workplace.id || workplace.workplaceId);
    
    // Doctor name - check multiple possible field names
    const doctorName = doctorProfile?.doctorName || 
                      doctorProfile?.name || 
                      doctorProfile?.fullName || 
                      'Dr. John Smith'; // Default fallback
    params.append('doctorName', doctorName);
    
    // Clinic name
    if (workplace.workplaceName) {
      params.append('clinicName', workplace.workplaceName);
    }
    
    // Clinic address - build full address
    if (workplace.address) {
      params.append('clinicAddress', workplace.address);
    }
    
    // Add city as separate parameter (as in your sample)
    if (workplace.city) {
      params.append('city', workplace.city);
    }
    
    // Specialization
    const specialization = doctorProfile?.specialization || 
                          doctorProfile?.specialty || 
                          'MDS'; // Default fallback
    params.append('specialization', specialization);
    
    const finalURL = `${baseURL}?${params.toString()}`;
    
    // Log the generated URL for debugging
    console.log('🔗 Generated QR URL:', finalURL);
    console.log('📋 Doctor Profile Available:', doctorProfile);
    console.log('📋 URL Parameters:', {
      doctorId: doctorId,
      workplaceId: workplace.id || workplace.workplaceId,
      doctorName: doctorName,
      clinicName: workplace.workplaceName || 'Not available',
      clinicAddress: workplace.address || 'Not available',
      city: workplace.city || 'Not available',
      specialization: specialization
    });
    
    return finalURL;
  };

  const handleGenerateQR = (workplace) => {
    setSelectedWorkplace(workplace);
    setQrModalVisible(true);
  };

  const closeQrModal = () => {
    setQrModalVisible(false);
    setSelectedWorkplace(null);
  };

  const downloadQRCode = async () => {
    try {
      setDownloading(true);
      
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library permission to download QR codes.');
        return;
      }

      // Capture the QR code view as image
      const uri = await viewShotRef.current.capture();
      
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      const album = await MediaLibrary.getAlbumAsync('Download');
      
      if (album == null) {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      
      Alert.alert('Success', 'QR code downloaded to your gallery!');
    } catch (error) {
      console.log('Error downloading QR code:', error);
      Alert.alert('Error', 'Failed to download QR code. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const renderWorkplaceCard = ({ item, index }) => (
    <View style={styles.workplaceCard}>
      <View style={styles.workplaceInfo}>
        <Text style={styles.workplaceName}>{item.workplaceName}</Text>
        <Text style={styles.workplaceType}>{item.workplaceType}</Text>
        <Text style={styles.workplaceAddress}>{item.address}</Text>
        {item.city && (
          <Text style={styles.workplaceCity}>{item.city}, {item.state}</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.generateButton}
        onPress={() => handleGenerateQR(item)}
      >
        <Text style={styles.generateButtonText}>Generate QR</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TopBar title="Quick Booking QR" onBack={() => navigation.goBack()} />
      
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

      {/* QR Code Modal */}
      <Modal visible={qrModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>QR Code Generated</Text>
              <TouchableOpacity onPress={closeQrModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedWorkplace && (
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={styles.qrWorkplaceTitle}>{selectedWorkplace.workplaceName}</Text>
                
                <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
                  <View style={styles.qrCodeContainer}>
                    <QRCode
                      value={generateBookingURL(selectedWorkplace)}
                      size={200}
                      color="black"
                      backgroundColor="white"
                    />
                  </View>
                </ViewShot>

                {/* this section contails info about qr code */}
                {/* <View style={styles.qrInfoSection}>
                  <Text style={styles.qrUrlTitle}>Booking URL:</Text>
                  <Text style={styles.qrUrl}>
                    {generateBookingURL(selectedWorkplace)}
                  </Text>
                  
                  <Text style={styles.instructionsTitle}>QR Code Contains:</Text>
                  <Text style={styles.instructions}>
                    • Doctor: {doctorProfile?.doctorName || 'Loading...'}
                  </Text>
                  <Text style={styles.instructions}>
                    • Clinic: {selectedWorkplace.workplaceName}
                  </Text>
                  <Text style={styles.instructions}>
                    • Address: {selectedWorkplace.address}
                  </Text>
                  {doctorProfile?.specialization && (
                    <Text style={styles.instructions}>
                      • Specialization: {doctorProfile.specialization}
                    </Text>
                  )}
                  
                  <Text style={styles.instructionsTitle}>How to use:</Text>
                  <Text style={styles.instructions}>
                    • Patients scan with phone camera to book appointments
                  </Text>
                  <Text style={styles.instructions}>
                    • No need to manually enter doctor/clinic details
                  </Text>
                  <Text style={styles.instructions}>
                    • Print and display at your clinic reception
                  </Text>
                </View> */}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.downloadButton]} 
                    onPress={downloadQRCode}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.downloadButtonText}>Download QR</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.actionButton, styles.doneButton]} onPress={closeQrModal}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  workplaceCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  workplaceInfo: {
    flex: 1,
  },
  workplaceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workplaceType: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    marginBottom: 2,
  },
  workplaceAddress: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  workplaceCity: {
    fontSize: 12,
    color: '#95a5a6',
  },
  generateButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#7f8c8d',
  },
  modalContent: {
    alignItems: 'center',
    padding: 20,
  },
  qrWorkplaceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrInfoSection: {
    width: '100%',
    marginBottom: 20,
  },
  qrUrlTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  qrUrl: {
    fontSize: 11,
    color: '#3498db',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
    textAlign: 'center',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#27ae60',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#3498db',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});