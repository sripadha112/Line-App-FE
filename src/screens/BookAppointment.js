import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { UserAPIService, DoctorAPIService, SlotsAPIService } from '../services/doctorApiService';
import TopBar from '../components/TopBar';
import BottomNavigation from '../components/BottomNavigation';
import DatePicker from '../components/DatePicker';

export default function BookAppointment({ route, navigation }) {
  const { userId, familyMemberId, familyMemberName } = route.params;
  
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
  const [blockedDates, setBlockedDates] = useState({}); // Store blocked dates info
  const [recentDoctors, setRecentDoctors] = useState([]); // Store recent doctors for quick access
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('search'); // 'search', 'workplaces', 'slots'
  const [noWorkplacesInfo, setNoWorkplacesInfo] = useState(null); // Info about doctors with no workplaces
  const [customSelectedDate, setCustomSelectedDate] = useState(null); // Date selected from calendar picker
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState(familyMemberId || null);

  // New states for pagination and local search
  const [allDoctors, setAllDoctors] = useState([]); // Store all loaded doctors for local search
  const [allDoctorWorkplaces, setAllDoctorWorkplaces] = useState([]); // Flattened workplaces from all doctors
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filteredWorkplaces, setFilteredWorkplaces] = useState([]); // Filtered results for local search
  const [isSearching, setIsSearching] = useState(false); // Whether user is actively searching
  const PAGE_SIZE = 15;

  // Debounce timer ref for search
  const searchDebounceRef = useRef(null);

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
      // fetch family members for the user
      try {
        const fm = await UserAPIService.getFamilyMembers(userId);
        setFamilyMembers(fm || []);
      } catch (e) {
        console.log('No family members or failed to fetch:', e.message);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      // Don't show alert here as it's not critical for the main functionality
    }
  };

  // Load nearby doctors based on user's pincode
  const loadNearbyDoctors = async (pincode) => {
    try {
      console.log('📍 Loading nearby doctors for pincode:', pincode);
      
      const nearbyResults = await UserAPIService.searchNearbyDoctors(pincode);
      console.log('🏥 Nearby doctors results:', nearbyResults);
      
      setNearbyDoctors(nearbyResults);
      
      // Flatten workplaces from nearby doctors
      const nearbyWorkplacesList = flattenDoctorWorkplaces(nearbyResults);
      console.log('🏥 Flattened nearby workplaces:', nearbyWorkplacesList.length);
      setNearbyWorkplaces(nearbyWorkplacesList);
    } catch (error) {
      console.error('❌ Error loading nearby doctors:', error);
      setNearbyDoctors([]);
      setNearbyWorkplaces([]);
    }
  };

  // Helper function to flatten doctor workplaces
  const flattenDoctorWorkplaces = (doctors) => {
    const workplacesList = [];
    doctors.forEach(doctor => {
      if (doctor.workplaces && doctor.workplaces.length > 0) {
        doctor.workplaces.forEach(workplace => {
          workplacesList.push({
            ...workplace,
            doctorId: doctor.doctorId,
            doctorName: doctor.doctorName,
            specialization: doctor.specialization,
            designation: doctor.designation,
            profileImage: doctor.profileImage,
            experience: doctor.experience,
            // include verified flag from doctor level (some APIs may use isVerified)
            verified: doctor.verified ?? doctor.isVerified ?? false
          });
        });
      }
    });
    return workplacesList;
  };

  // Load all doctors with pagination
  const loadAllDoctors = async (page = 0, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setInitialLoading(true);
      }
      
      console.log('📄 Loading doctors page:', page);
      const response = await UserAPIService.getAllDoctorsPaginated(page, PAGE_SIZE);
      
      const newDoctors = response.doctors || [];
      const newWorkplaces = flattenDoctorWorkplaces(newDoctors);
      
      if (isLoadMore) {
        setAllDoctors(prev => [...prev, ...newDoctors]);
        setAllDoctorWorkplaces(prev => [...prev, ...newWorkplaces]);
      } else {
        setAllDoctors(newDoctors);
        setAllDoctorWorkplaces(newWorkplaces);
      }
      
      setCurrentPage(response.currentPage);
      setHasMore(response.hasNext);
      
      console.log('📄 Loaded', newDoctors.length, 'doctors. Total:', isLoadMore ? allDoctors.length + newDoctors.length : newDoctors.length);
    } catch (error) {
      console.error('❌ Error loading doctors:', error);
      Alert.alert('Error', 'Failed to load doctors. Please try again.');
    } finally {
      setLoadingMore(false);
      setInitialLoading(false);
    }
  };

  // Load more doctors when scrolling
  const loadMoreDoctors = () => {
    if (!loadingMore && hasMore && !isSearching) {
      loadAllDoctors(currentPage + 1, true);
    }
  };

  // Local search function - filters already loaded data
  const performLocalSearch = useCallback((query) => {
    if (!query.trim()) {
      setIsSearching(false);
      setFilteredWorkplaces([]);
      return;
    }
    
    setIsSearching(true);
    const searchTerm = query.toLowerCase().trim();
    
    // Combine nearby workplaces and all loaded workplaces
    const allWorkplaces = [...nearbyWorkplaces, ...allDoctorWorkplaces];
    
    // Remove duplicates based on doctorId + workplaceId
    const uniqueWorkplaces = allWorkplaces.filter((workplace, index, self) =>
      index === self.findIndex(w => 
        w.doctorId === workplace.doctorId && w.workplaceId === workplace.workplaceId
      )
    );
    
    // Filter workplaces based on search term
    const filtered = uniqueWorkplaces.filter(workplace => {
      const doctorName = (workplace.doctorName || '').toLowerCase();
      const specialization = (workplace.specialization || '').toLowerCase();
      const designation = (workplace.designation || '').toLowerCase();
      const workplaceName = (workplace.workplaceName || '').toLowerCase();
      const address = (workplace.address || '').toLowerCase();
      const city = (workplace.city || '').toLowerCase();
      const pincode = (workplace.pincode || '').toLowerCase();
      
      return doctorName.includes(searchTerm) ||
             specialization.includes(searchTerm) ||
             designation.includes(searchTerm) ||
             workplaceName.includes(searchTerm) ||
             address.includes(searchTerm) ||
             city.includes(searchTerm) ||
             pincode.includes(searchTerm);
    });
    
    setFilteredWorkplaces(filtered);
    console.log('🔍 Local search found', filtered.length, 'results for:', query);
  }, [nearbyWorkplaces, allDoctorWorkplaces]);

  // Handle search input with debounce
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    
    // Clear previous debounce timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Debounce the search
    searchDebounceRef.current = setTimeout(() => {
      performLocalSearch(text);
    }, 300);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setFilteredWorkplaces([]);
  };

  // Legacy API search - kept as fallback but not used in main flow
  const searchDoctorsEnhanced = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }
    // Use local search instead
    performLocalSearch(searchQuery);
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
      
      // Store blocked dates information if available
      let blockedDatesData = {};
      if (slotsData.blockedDates) {
        blockedDatesData = slotsData.blockedDates;
        setBlockedDates(slotsData.blockedDates);
        console.log('🚫 Blocked dates received:', slotsData.blockedDates);
      } else {
        setBlockedDates({});
      }
      
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
          // Check if this date is blocked (full day) - handle both isFullDay and fullDay from Jackson
          const blockInfo = blockedDatesData[date];
          const isBlockedFullDay = blockInfo?.isFullDay || blockInfo?.fullDay;
          
          if (isBlockedFullDay) {
            // Include blocked day with empty slots - will show blocked message
            processedSlotsByDate[date] = [];
            dates.push(date);
          } else {
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
        }
      });
      
      // Also add any blocked dates that might not be in slotsByDate
      Object.entries(blockedDatesData).forEach(([date, blockInfo]) => {
        const isFullDayBlocked = blockInfo.isFullDay || blockInfo.fullDay;
        if (isFullDayBlocked && !dates.includes(date)) {
          const [datePart] = date.split('T');
          const slotDate = new Date(datePart + 'T12:00:00');
          if (slotDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
            processedSlotsByDate[date] = [];
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

      // include family member id if selected
      if (selectedFamilyMemberId) appointmentData.familyMemberId = selectedFamilyMemberId;

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
        
        // Load all doctors with pagination
        await loadAllDoctors(0, false);
        
        // You can implement this to load recent doctors from AsyncStorage or API
        // For now, setting empty array
        setRecentDoctors([]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setRecentDoctors([]);
      }
    };
    
    loadInitialData();
    
    // Cleanup debounce timer on unmount
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // No create handler here — user can only select existing family members. Adding is in Profile.

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
          <View style={styles.nameRow}>
            <Text style={styles.doctorName}>Dr. {item.doctorName}</Text>
            {(item.isVerified || item.verified || item.verifiedDoctor) ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✔ Verified</Text>
              </View>
            ) : (
              <View style={styles.unverifiedBadge}>
                <Text style={styles.unverifiedText}>Unverified</Text>
              </View>
            )}
          </View>
          {item.specialization && (
            <Text style={styles.specialization}>
              🩺 {item.specialization}
              {item.designation && ` • ${item.designation}`}
            </Text>
          )}
          <View style={styles.clinicRow}>
            <Text style={styles.clinicName}>🏥 {item.workplaceName}</Text>
            {(item.workplaceType || item.type) && (
              <Text style={styles.workspaceTypeText}> • {item.workplaceType || item.type}</Text>
            )}
          </View>
          <Text style={styles.areaText}>📍 {item.address}</Text>
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

  // Render footer for FlatList (loading indicator)
  const renderListFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#3498db" />
        <Text style={styles.loadingMoreText}>Loading more doctors...</Text>
      </View>
    );
  };

  // Get display workplaces based on search state
  const getDisplayWorkplaces = () => {
    if (isSearching) {
      return filteredWorkplaces;
    }
    // Combine nearby (first) and all doctors
    const combined = [...nearbyWorkplaces];
    allDoctorWorkplaces.forEach(workplace => {
      // Avoid duplicates
      const exists = combined.some(w => 
        w.doctorId === workplace.doctorId && w.workplaceId === workplace.workplaceId
      );
      if (!exists) {
        combined.push(workplace);
      }
    });
    return combined;
  };

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
      {step === 'search' && (
        <View style={styles.searchStepContainer}>
          {/* Search Header - Fixed at top */}
          <View style={styles.searchHeader}>
            <Text style={styles.sectionTitle}>🔍 Find Doctors</Text>
            <Text style={styles.searchInstructions}>
              Search by Name, Specialization, Hospital, Area or Pincode
            </Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search doctors..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={clearSearch}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Search results info */}
            {isSearching && (
              <Text style={styles.searchResultsInfo}>
                {filteredWorkplaces.length} result{filteredWorkplaces.length !== 1 ? 's' : ''} found
              </Text>
            )}
          </View>

          {/* Initial Loading State */}
          {initialLoading ? (
            <View style={styles.initialLoadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Loading doctors...</Text>
            </View>
          ) : (
            /* Doctor List with Infinite Scroll */
            <FlatList
              data={getDisplayWorkplaces()}
              keyExtractor={(item, index) => `${item.doctorId}-${item.workplaceId}-${index}`}
              renderItem={renderWorkplaceCard}
              contentContainerStyle={styles.doctorListContent}
              showsVerticalScrollIndicator={true}
              onEndReached={loadMoreDoctors}
              onEndReachedThreshold={0.3}
              ListFooterComponent={renderListFooter}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListIcon}>
                    {isSearching ? '🔍' : '👨‍⚕️'}
                  </Text>
                  <Text style={styles.emptyListTitle}>
                    {isSearching ? 'No matches found' : 'No doctors available'}
                  </Text>
                  <Text style={styles.emptyListSubtitle}>
                    {isSearching 
                      ? 'Try different search terms' 
                      : 'Please check back later'}
                  </Text>
                </View>
              }
              ListHeaderComponent={
                !isSearching && nearbyWorkplaces.length > 0 ? (
                  <View style={styles.listSectionHeader}>
                    <Text style={styles.listSectionTitle}>
                      📍 Nearby Doctors ({nearbyWorkplaces.length})
                    </Text>
                    {userProfile?.pincode && (
                      <Text style={styles.listSectionSubtitle}>
                        Near pincode: {userProfile.pincode}
                      </Text>
                    )}
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}
      
      {step === 'workplaces' && (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
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
        </ScrollView>
      )}

      {step === 'slots' && (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
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

            {/* Family member chips: You + members + add */}
            <ScrollView horizontal style={styles.familyChipsRow} contentContainerStyle={{alignItems: 'center'}}>
              <TouchableOpacity style={[styles.familyChip, !selectedFamilyMemberId && styles.familyChipSelected]} onPress={() => setSelectedFamilyMemberId(null)}>
                <Text style={styles.familyChipText}>You</Text>
              </TouchableOpacity>
              {familyMembers.map(m => (
                <TouchableOpacity key={m.id} style={[styles.familyChip, selectedFamilyMemberId === m.id && styles.familyChipSelected]} onPress={() => setSelectedFamilyMemberId(m.id)}>
                  <Text style={styles.familyChipText}>{m.name}{m.age ? `, ${m.age}` : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
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
            
            {/* Date Navigation - Show for all cases including blocked days */}
            {!loading && !customSelectedDate && availableDates.length > 0 && (
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
                    ← Prev
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.dateInfo}>
                  <Text style={styles.currentDate}>
                    {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short', 
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

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading slots...</Text>
              </View>
            ) : (blockedDates[selectedDate]?.isFullDay || blockedDates[selectedDate]?.fullDay) ? (
              <View style={styles.blockedDayContainer}>
                <Text style={styles.blockedDayIcon}>🚫</Text>
                <Text style={styles.blockedDayTitle}>Day Blocked by Doctor</Text>
                <Text style={styles.blockedDaySubtitle}>
                  This day has been blocked by the doctor for taking appointments.
                </Text>
                {blockedDates[selectedDate]?.reason && (
                  <View style={styles.blockedReasonBox}>
                    <Text style={styles.blockedReasonLabel}>Doctor's Reason:</Text>
                    <Text style={styles.blockedReasonText}>
                      "{blockedDates[selectedDate].reason}"
                    </Text>
                  </View>
                )}
                <Text style={styles.blockedDaySuggestion}>
                  Please select a different date to book an appointment.
                </Text>
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
                {/* Current Date Display for Custom Selected Date */}
                {customSelectedDate && (
                  <View style={styles.customDateDisplay}>
                    <Text style={styles.customDateText}>
                      {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short', 
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
          {/* Family member creation belongs in UserProfile; no modal here */}
        </ScrollView>
      )}
      
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
  // New styles for infinite scroll and local search
  searchStepContainer: {
    flex: 1,
  },
  searchHeader: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 10,
  },
  searchInstructions: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#7f8c8d',
    marginBottom: 10,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#7f8c8d',
  },
  searchResultsInfo: {
    fontSize: 13,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 8,
  },
  initialLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 12,
  },
  doctorListContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 10,
  },
  emptyListContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyListIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyListSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  listSectionHeader: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27ae60',
  },
  listSectionSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  // Old styles (retained for compatibility)
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
  familyChipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  familyChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  familyChipSelected: {
    backgroundColor: '#3498db'
  },
  familyChipText: {
    color: '#000'
  },
  familyChipAdd: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3498db'
  },
  familyChipAddText: {
    color: '#3498db'
  },
  /* modal styles removed — creation happens in UserProfile */
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
  blockedDayContainer: {
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#f39c12',
  },
  blockedDayIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  blockedDayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d68910',
    marginBottom: 10,
    textAlign: 'center',
  },
  blockedDaySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 15,
  },
  blockedReasonBox: {
    backgroundColor: '#fef9e7',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  blockedReasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d68910',
    marginBottom: 5,
  },
  blockedReasonText: {
    fontSize: 15,
    color: '#5d4e37',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  blockedDaySuggestion: {
    fontSize: 14,
    color: '#27ae60',
    textAlign: 'center',
    fontWeight: '500',
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  unverifiedBadge: {
    backgroundColor: '#bdc3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  unverifiedText: {
    color: '#2c3e50',
    fontSize: 11,
    fontWeight: '600',
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workspaceTypeText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 6,
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
