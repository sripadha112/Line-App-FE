import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { UserAPIService, DoctorAPIService, SlotsAPIService } from '../services/doctorApiService';
import TopBar from '../components/TopBar';
import BottomNavigation from '../components/BottomNavigation';
import DatePicker from '../components/DatePicker';

export default function BookAppointment({ route, navigation }) {
  const { userId } = route.params;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]); // Store enhanced search results
  const [workplaces, setWorkplaces] = useState([]); // Flattened workplaces from search results
  const [nearbyDoctors, setNearbyDoctors] = useState([]); // Store nearby doctors
  const [nearbyWorkplaces, setNearbyWorkplaces] = useState([]); // Flattened nearby workplaces
  const [userProfile, setUserProfile] = useState(null); // Store user profile for pincode
  const [selectedWorkplace, setSelectedWorkplace] = useState(null); // Selected workplace for booking
  const [allSlotsData, setAllSlotsData] = useState({}); // Store all slots grouped by date
  const [availableDates, setAvailableDates] = useState([]); // Array of available dates
  const [selectedDate, setSelectedDate] = useState(null); // Currently selected date
  const [currentDateSlots, setCurrentDateSlots] = useState([]); // Slots for current selected date
  const [recentDoctors, setRecentDoctors] = useState([]); // Store recent doctors for quick access
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('search'); // 'search', 'workplaces', 'slots'
  const [noWorkplacesInfo, setNoWorkplacesInfo] = useState(null); // Info about doctors with no workplaces
  const [customSelectedDate, setCustomSelectedDate] = useState(null); // Date selected from calendar picker

  // Fetch user profile to get pincode for nearby doctors
  const fetchUserProfile = async () => {
    try {
      console.log('🔍 Fetching user profile for nearby doctors, userId:', userId);
      const profile = await UserAPIService.fetchUserProfile(userId);
      console.log('👤 User profile:', profile);
      setUserProfile(profile);
      
      // Load nearby doctors if pincode is available
      if (profile && profile.pincode) {
        await loadNearbyDoctors(profile.pincode);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      // Don't show alert here as it's not critical for the main functionality
    }
  };

  // Load nearby doctors based on user's pincode
  const loadNearbyDoctors = async (pincode) => {
    try {
      setLoading(true);
      console.log('📍 Loading nearby doctors for pincode:', pincode);
      
      const nearbyResults = await UserAPIService.searchNearbyDoctors(pincode);
      console.log('🏥 Nearby doctors results:', nearbyResults);
      
      setNearbyDoctors(nearbyResults);
      
      // Flatten workplaces from nearby doctors
      const nearbyWorkplacesList = [];
      nearbyResults.forEach(doctor => {
        if (doctor.workplaces && doctor.workplaces.length > 0) {
          doctor.workplaces.forEach(workplace => {
            nearbyWorkplacesList.push({
              ...workplace,
              doctorId: doctor.doctorId,
              doctorName: doctor.doctorName,
              specialization: doctor.specialization,
              designation: doctor.designation,
              profileImage: doctor.profileImage,
              experience: doctor.experience
            });
          });
        }
      });
      
      console.log('🏥 Flattened nearby workplaces:', nearbyWorkplacesList);
      setNearbyWorkplaces(nearbyWorkplacesList);
    } catch (error) {
      console.error('❌ Error loading nearby doctors:', error);
      // Don't show alert as this is a secondary feature
      setNearbyDoctors([]);
      setNearbyWorkplaces([]);
    } finally {
      setLoading(false);
    }
  };

  const searchDoctorsEnhanced = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term (doctor name, clinic, area, etc.)');
      return;
    }

    try {
      setLoading(true);
      setNoWorkplacesInfo(null); // Clear previous error states
      console.log('🔍 Searching for:', searchQuery);
      
      const results = await UserAPIService.searchDoctorsEnhanced(searchQuery.trim());
      console.log('🎯 Search results:', results);
      
      // Check if no doctors found
      if (!results || results.length === 0) {
        Alert.alert(
          'No Doctors Found',
          `No doctors found matching "${searchQuery}". Please try a different search term.`,
          [{ text: 'OK' }]
        );
        setSearchResults([]);
        setWorkplaces([]);
        return;
      }
      
      setSearchResults(results);
      
      // Flatten workplaces from all doctors for easy display
      const allWorkplaces = [];
      results.forEach(doctor => {
        if (doctor.workplaces && doctor.workplaces.length > 0) {
          doctor.workplaces.forEach(workplace => {
            allWorkplaces.push({
              ...workplace,
              doctorId: doctor.doctorId,
              doctorName: doctor.doctorName,
              specialization: doctor.specialization,
              designation: doctor.designation,
              profileImage: doctor.profileImage,
              experience: doctor.experience
            });
          });
        }
      });
      
      // console.log('🏥 Flattened workplaces:', allWorkplaces);
      
      // Check if no workplaces found even though doctors exist
      if (allWorkplaces.length === 0) {
        const doctorNames = results.map(doctor => doctor.doctorName).join(', ');
        setNoWorkplacesInfo({
          doctorNames: doctorNames,
          doctorCount: results.length
        });
        setWorkplaces([]);
        setStep('workplaces'); // Show the workplaces step with error message
        return;
      }
      
      setNoWorkplacesInfo(null); // Clear any previous error info
      setWorkplaces(allWorkplaces);
      setStep('workplaces');
    } catch (error) {
      console.error('Enhanced search error:', error);
      Alert.alert(
        'Search Error',
        'Failed to search doctors. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const selectWorkplace = async (workplace) => {
    try {
      setLoading(true);
      console.log('🏥 Selected workplace:', workplace);
      console.log('👤 Doctor name:', workplace.doctorName);
      console.log('🏢 Workplace name:', workplace.workplaceName);
      
      setSelectedWorkplace(workplace);
      
      // Load initial slots (default behavior - next 3 days)
      await loadSlotsForWorkplace(workplace, null);
      
      setStep('slots');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch available slots. Please try again.');
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSlotsForWorkplace = async (workplace, selectedDateForSlots) => {
    try {
      const params = {};
      if (selectedDateForSlots) {
        params.date = selectedDateForSlots;
      }
      
      const slotsData = await UserAPIService.getAvailableSlots(workplace.doctorId, workplace.workplaceId, params);
      
      // console.log('📅 Received slots data for booking:', slotsData);
      
      // Check if we received the structured response
      if (!slotsData.slotsByDate) {
        console.warn('⚠️ No slotsByDate found in response:', slotsData);
        setAllSlotsData({});
        setAvailableDates([]);
        setCurrentDateSlots([]);
        return;
      }
      
      // Process slots data and group by date
      const now = new Date();
      const processedSlotsByDate = {};
      const dates = [];
      
      Object.entries(slotsData.slotsByDate).forEach(([date, timeSlots]) => {
        // Create a Date object for this slot to check if it's in the future
        const [datePart] = date.split('T'); // Handle ISO dates
        const slotDate = new Date(datePart + 'T12:00:00'); // Use noon to avoid timezone issues
        
        // Only include future dates
        if (slotDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          const dateSlots = timeSlots.map((timeSlot, index) => ({
            id: `${date}-${index}`,
            date: date,
            slotTime: timeSlot,
            isAvailable: true,
            workplaceId: workplace.workplaceId,
            doctorId: workplace.doctorId,
            doctorName: slotsData.doctorName || workplace.doctorName,
            workplaceName: slotsData.workplaceName || workplace.workplaceName
          }));
          
          if (dateSlots.length > 0) {
            processedSlotsByDate[date] = dateSlots;
            dates.push(date);
          }
        }
      });
      
      // Sort dates chronologically
      dates.sort();
      
      // console.log('🎯 Processed slots by date for booking:', processedSlotsByDate);
      // console.log('📅 Available dates for booking:', dates);
      
      setAllSlotsData(processedSlotsByDate);
      setAvailableDates(dates);
      
      // Set appropriate selected date
      if (selectedDateForSlots && processedSlotsByDate[selectedDateForSlots]) {
        setSelectedDate(selectedDateForSlots);
        setCurrentDateSlots(processedSlotsByDate[selectedDateForSlots] || []);
      } else if (dates.length > 0) {
        setSelectedDate(dates[0]);
        setCurrentDateSlots(processedSlotsByDate[dates[0]] || []);
      } else {
        setSelectedDate(null);
        setCurrentDateSlots([]);
      }
    } catch (error) {
      console.error('Error loading slots for workplace:', error);
      throw error;
    }
  };

  const confirmAndBookAppointment = (slot) => {
    const appointmentDate = selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }) : 'Selected Date';

    // Fallback values in case of undefined
    const doctorName = selectedWorkplace?.doctorName || 'Doctor';
    const workplaceName = selectedWorkplace?.workplaceName || selectedWorkplace?.clinicName || 'Clinic';

    Alert.alert(
      'Confirm Appointment',
      `Are you sure you want to book this appointment?\n\nDoctor: Dr. ${doctorName}\nClinic: ${workplaceName}\nDate: ${appointmentDate}\nTime: ${slot.slotTime}`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Book Appointment',
          style: 'default',
          onPress: () => bookAppointment(slot)
        }
      ]
    );
  };

  const bookAppointment = async (slot) => {
    try {
      setLoading(true);
      
      // Prepare appointment data according to API specification
      const appointmentData = {
        doctorId: selectedWorkplace.doctorId,
        workplaceId: selectedWorkplace.workplaceId,
        requestedTime: new Date(selectedDate).toISOString(), // Convert selected date to ISO format
        slot: slot.slotTime,
        notes: 'Booked via mobile app'
      };

      console.log('📝 Booking appointment with data:', appointmentData);
      console.log('📅 Selected date:', selectedDate);
      console.log('🕐 Selected slot:', slot.slotTime);

      const result = await UserAPIService.bookAppointment(userId, appointmentData);
      
      console.log('✅ Booking successful:', result);
      
      Alert.alert(
        '🎉 Appointment Booked Successfully!',
        `Your appointment is confirmed at ${result.workplaceName || selectedWorkplace.workplaceName} on ${result.slot || appointmentData.slot}.\n\nDoctor: ${selectedWorkplace.doctorName}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousDate = () => {
    if (!selectedDate || availableDates.length === 0) return;
    
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex > 0) {
      const newDate = availableDates[currentIndex - 1];
      setSelectedDate(newDate);
      setCurrentDateSlots(allSlotsData[newDate] || []);
    }
  };

  const goToNextDate = () => {
    if (!selectedDate || availableDates.length === 0) return;
    
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex < availableDates.length - 1) {
      const newDate = availableDates[currentIndex + 1];
      setSelectedDate(newDate);
      setCurrentDateSlots(allSlotsData[newDate] || []);
    }
  };

  // Load recent doctors and user profile on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load user profile and nearby doctors
        await fetchUserProfile();
        
        // You can implement this to load recent doctors from AsyncStorage or API
        // For now, setting empty array
        setRecentDoctors([]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setRecentDoctors([]);
      }
    };
    
    loadInitialData();
  }, []);

  const handleWorkplaceSelect = (workplace) => {
    selectWorkplace(workplace);
  };

  const getCurrentDateIndex = () => {
    if (!selectedDate || availableDates.length === 0) return 0;
    return availableDates.indexOf(selectedDate) + 1;
  };

  const handleDatePickerSelect = async (date) => {
    if (!selectedWorkplace) return;
    
    try {
      setLoading(true);
      setCustomSelectedDate(date);
      
      if (date) {
        // Load slots for specific date
        await loadSlotsForWorkplace(selectedWorkplace, date);
      } else {
        // Load default slots (next 3 days)
        await loadSlotsForWorkplace(selectedWorkplace, null);
      }
    } catch (error) {
      console.error('Error loading slots for selected date:', error);
      Alert.alert('Error', 'Failed to load slots for selected date. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderWorkplaceCard = ({ item }) => (
    <View style={styles.workplaceCard}>
      <View style={styles.cardHeader}>
        <View style={styles.doctorImagePlaceholder}>
          <Text style={styles.doctorInitial}>
            {item.doctorName ? item.doctorName.charAt(0).toUpperCase() : 'D'}
          </Text>
        </View>
        <View style={styles.doctorMainInfo}>
          <Text style={styles.doctorName}>Dr. {item.doctorName}</Text>
          {item.specialization && (
            <Text style={styles.specialization}>
              🩺 {item.specialization}
              {item.designation && ` • ${item.designation}`}
            </Text>
          )}
          <Text style={styles.clinicName}>🏥 {item.workplaceName}</Text>
          <Text style={styles.areaText}>� {item.address}</Text>
        </View>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => handleWorkplaceSelect(item)}
        >
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      </View>
    </View>
  );



  const renderSlot = ({ item: slot }) => (
    <TouchableOpacity 
      style={styles.slotCard} 
      onPress={() => confirmAndBookAppointment(slot)}
    >
      <Text style={styles.slotTime}>{slot.slotTime}</Text>
      <Text style={styles.slotStatus}>Available</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {step === 'search' && (
          <View>
            <Text style={styles.sectionTitle}>🔍 Search Doctors</Text>
            <Text style={styles.searchInstructions}>
              Search by Name, Specialization, Designation, Hospital Name, Area/Address, City or Pincode
            </Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter search term..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity 
                style={styles.searchButton} 
                onPress={searchDoctorsEnhanced}
                disabled={loading}
              >
                <Text style={styles.searchButtonText}>
                  {loading ? 'Searching...' : 'Search'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Nearby Doctors Section */}
            {nearbyWorkplaces.length > 0 && (
              <View style={styles.nearbySection}>
                <Text style={styles.sectionTitle}>📍 Nearby Doctors</Text>
                <Text style={styles.nearbySubtitle}>
                  Doctors near your location ({userProfile?.pincode})
                </Text>
                <FlatList
                  data={nearbyWorkplaces.slice(0, 5)} // Show only first 5
                  keyExtractor={(item) => `${item.doctorId}-${item.workplaceId}`}
                  renderItem={renderWorkplaceCard}
                  scrollEnabled={false}
                />
                {nearbyWorkplaces.length > 5 && (
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => {
                      // Set workplaces to all nearby workplaces and go to workplaces step
                      setWorkplaces(nearbyWorkplaces);
                      setStep('workplaces');
                    }}
                  >
                    <Text style={styles.viewAllButtonText}>
                      View All {nearbyWorkplaces.length} Nearby Doctors
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {recentDoctors.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>👨‍⚕️ Recent Doctors</Text>
                <FlatList
                  data={recentDoctors}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.doctorCard} 
                      onPress={() => {
                        setSearchQuery(item.fullName);
                        searchDoctorsEnhanced();
                      }}
                    >
                      <Text style={styles.doctorName}>{item.fullName}</Text>
                      <Text style={styles.doctorSpecialization}>
                        🩺 {item.specialization}
                        {item.designation && ` • ${item.designation}`}
                      </Text>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>
        )}

        {step === 'workplaces' && (
          <View>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setStep('search')}
            >
              <Text style={styles.backButtonText}>← Back to Search</Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>🏥 Available Doctors</Text>
            
            {workplaces.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsIcon}>🏥</Text>
                <Text style={styles.noResultsTitle}>No Clinics/Hospitals Found</Text>
                {noWorkplacesInfo ? (
                  <Text style={styles.noResultsMessage}>
                    Found doctor(s): <Text style={styles.doctorNamesList}>{noWorkplacesInfo.doctorNames}</Text>
                    {'\n\n'}
                    However, no clinics or hospitals are registered for {noWorkplacesInfo.doctorCount === 1 ? 'this doctor' : 'these doctors'}.
                    Please try searching for a different doctor.
                  </Text>
                ) : (
                  <Text style={styles.noResultsMessage}>
                    No clinics or hospitals found for your search. 
                    Please try searching for a different doctor.
                  </Text>
                )}
                <TouchableOpacity 
                  style={styles.tryAgainButton}
                  onPress={() => setStep('search')}
                >
                  <Text style={styles.tryAgainButtonText}>Try Different Search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={workplaces}
                keyExtractor={(item) => `${item.doctorId}-${item.workplaceId}`}
                renderItem={renderWorkplaceCard}
                scrollEnabled={false}
              />
            )}
          </View>
        )}



        {step === 'slots' && (
          <View>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setStep('search')}
            >
              <Text style={styles.backButtonText}>← Back to Search</Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>📅 Available Slots</Text>
            <Text style={styles.doctorInfo}>
              {selectedWorkplace?.doctorName} - {selectedWorkplace?.workplaceName}
            </Text>
            
            {/* Date Picker Section */}
            <View style={styles.datePickerSection}>
              <Text style={styles.datePickerLabel}>Select Appointment Date:</Text>
              <DatePicker
                selectedDate={customSelectedDate}
                onDateSelect={handleDatePickerSelect}
                title="Select Appointment Date"
                buttonTitle={customSelectedDate ? null : "Select specific date or use default (next 3 days)"}
                minDate={new Date().toISOString().split('T')[0]}
                maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // 30 days from now
              />
              {customSelectedDate && (
                <Text style={styles.selectedDateInfo}>
                  📅 Showing slots for: {new Date(customSelectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              )}
              {!customSelectedDate && (
                <Text style={styles.defaultDateInfo}>
                  📅 Showing available slots for the next 3 days
                </Text>
              )}
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading slots...</Text>
              </View>
            ) : availableDates.length === 0 ? (
              <View style={styles.noSlotsContainer}>
                <Text style={styles.noSlotsIcon}>⚠️</Text>
                <Text style={styles.noSlotsTitle}>No Available Slots</Text>
                <Text style={styles.noSlotsSubtitle}>
                  {customSelectedDate 
                    ? `No slots available for ${new Date(customSelectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. Please select a different date.`
                    : 'There are currently no available slots for booking at this workplace. Please try again later or select a different workplace.'
                  }
                </Text>
              </View>
            ) : (
              <>
                {/* Date Navigation - Only show if not using custom date picker */}
                {!customSelectedDate && availableDates.length > 1 && (
                  <View style={styles.dateNavigation}>
                    <TouchableOpacity 
                      style={[
                        styles.dateNavButton,
                        availableDates.indexOf(selectedDate) === 0 && styles.disabledButton
                      ]}
                      onPress={goToPreviousDate}
                      disabled={availableDates.indexOf(selectedDate) === 0}
                    >
                      <Text style={[
                        styles.dateNavButtonText,
                        availableDates.indexOf(selectedDate) === 0 && styles.disabledButtonText
                      ]}>
                        ← Previous
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.dateInfo}>
                      <Text style={styles.currentDate}>
                        {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        })}
                      </Text>
                      <Text style={styles.dateCounter}>
                        {getCurrentDateIndex()} of {availableDates.length}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        styles.dateNavButton,
                        availableDates.indexOf(selectedDate) === availableDates.length - 1 && styles.disabledButton
                      ]}
                      onPress={goToNextDate}
                      disabled={availableDates.indexOf(selectedDate) === availableDates.length - 1}
                    >
                      <Text style={[
                        styles.dateNavButtonText,
                        availableDates.indexOf(selectedDate) === availableDates.length - 1 && styles.disabledButtonText
                      ]}>
                        Next →
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Current Date Display for Custom Selected Date */}
                {customSelectedDate && (
                  <View style={styles.customDateDisplay}>
                    <Text style={styles.customDateText}>
                      {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                )}

                {/* Slots for Selected Date */}
                <View style={styles.slotsGrid}>
                  {currentDateSlots.map((slot) => (
                    <TouchableOpacity 
                      key={slot.id}
                      style={styles.slotCard} 
                      onPress={() => confirmAndBookAppointment(slot)}
                    >
                      <Text style={styles.slotTime}>{slot.slotTime}</Text>
                      <Text style={styles.slotStatus}>Available</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
      
      <BottomNavigation 
        activeTab="appointments"
        userType="user"
        onTabChange={(tab) => {
          switch (tab) {
            case 'appointments':
              navigation.navigate('UserHome', { userId });
              break;
            case 'calendar':
              navigation.navigate('UserCalendar', { userId });
              break;
            case 'profile':
              navigation.navigate('UserProfile', { userId });
              break;
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom navigation
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
  },
  searchInstructions: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#7f8c8d',
    marginBottom: 10,
    marginLeft: 4,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  recentSection: {
    marginTop: 20,
  },
  nearbySection: {
    marginTop: 20,
  },
  nearbySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  viewAllButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 2,
  },
  doctorDesignation: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  workplacesCount: {
    fontSize: 12,
    color: '#95a5a6',
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '500',
  },
  doctorInfo: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  workplaceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workplaceType: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 2,
  },
  workplaceAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  workplaceContact: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  primaryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dateNavButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
  },
  dateNavButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  disabledButtonText: {
    color: '#7f8c8d',
  },
  dateInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  currentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  dateCounter: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  noSlotsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginVertical: 20,
  },
  noSlotsIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  noSlotsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  noSlotsSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 10,
  },
  workplaceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImagePlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  doctorMainInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 2,
  },
  specialization: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '500',
    marginBottom: 2,
  },
  clinicName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2980b9',
    marginBottom: 2,
  },
  areaText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '400',
  },
  bookButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 1,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  slotStatus: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 10,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  doctorNamesList: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  tryAgainButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tryAgainButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  datePickerSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  selectedDateInfo: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  defaultDateInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  customDateDisplay: {
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  customDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2980b9',
  },
});
