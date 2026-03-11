/**
 * Main Application Logic
 * Handles UI interactions and booking flow
 */

// Global state
let appState = {
    doctorId: null,
    workplaceId: null,
    doctorInfo: null,
    workplaceInfo: null,
    userDetails: null,
    userId: null, // Store registered user ID
    selectedDate: null,
    selectedSlot: null,
    allSlotsData: {},
    availableDates: [],
    currentDateIndex: 0
};

/**
 * Initialize app on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Parse URL parameters to get doctorId, workplaceId, and optional details from QR code
    const urlParams = new URLSearchParams(window.location.search);
    appState.doctorId = urlParams.get('doctorId');
    appState.workplaceId = urlParams.get('workplaceId');
    
    // Get optional parameters from URL (if provided in QR code)
    const doctorName = urlParams.get('doctorName');
    const clinicName = urlParams.get('clinicName');
    const clinicAddress = urlParams.get('clinicAddress');
    const specialization = urlParams.get('specialization');
    const city = urlParams.get('city');
    
    // Validate QR code parameters
    if (!appState.doctorId || !appState.workplaceId) {
        showError('Invalid QR Code', 'This QR code is invalid or expired. Please scan a valid QR code from the clinic.');
        return;
    }
    
    // Store doctor/clinic details from URL parameters (or use defaults)
    appState.doctorInfo = {
        doctorId: appState.doctorId,
        fullName: doctorName || 'Doctor',
        doctorName: doctorName || 'Doctor',
        specialization: specialization || ''
    };
    
    appState.workplaceInfo = {
        workplaceId: appState.workplaceId,
        workplaceName: clinicName || 'Clinic',
        clinicName: clinicName || 'Clinic',
        address: clinicAddress || '',
        city: city || ''
    };
    
    // Populate clinic info from URL parameters
    populateClinicInfo();
    showScreen('userDetailsScreen');
    
    // Setup event listeners
    setupEventListeners();
    
    // Set minimum date for date picker (today)
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.min = today;
        dateInput.max = maxDateStr;
    }
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // User details form
    const userForm = document.getElementById('userDetailsForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserDetailsSubmit);
    }
    
    // Phone number validation
    const phoneInput = document.getElementById('userPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }
    
    // Date navigation
    const prevDateBtn = document.getElementById('prevDateBtn');
    const nextDateBtn = document.getElementById('nextDateBtn');
    if (prevDateBtn) prevDateBtn.addEventListener('click', goToPreviousDate);
    if (nextDateBtn) nextDateBtn.addEventListener('click', goToNextDate);
    
    // Back to user details button
    const backToUserDetailsBtn = document.getElementById('backToUserDetailsBtn');
    if (backToUserDetailsBtn) {
        backToUserDetailsBtn.addEventListener('click', () => showScreen('userDetailsScreen'));
    }
    
    // Confirmation button
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', handleConfirmBooking);
    }
}

/**
 * Populate clinic information card
 */
function populateClinicInfo() {
    const clinicCard = document.getElementById('clinicInfoCard');
    if (!clinicCard) return;
    
    // Use URL parameters for display
    const urlParams = new URLSearchParams(window.location.search);
    const doctorName = urlParams.get('doctorName') || 'Doctor';
    const specialization = urlParams.get('specialization') || '';
    const clinicName = urlParams.get('clinicName') || 'Clinic';
    const clinicAddress = urlParams.get('clinicAddress') || '';
    const city = urlParams.get('city') || '';
    
    clinicCard.innerHTML = `
        <div class="clinic-header">
            <div class="doctor-avatar">
                <div class="avatar-placeholder">${doctorName.charAt(0).toUpperCase()}</div>
            </div>
            <div class="clinic-details">
                <h3 class="doctor-name">Dr. ${doctorName}</h3>
                ${specialization ? `<p class="doctor-specialization">🩺 ${specialization}</p>` : ''}
            </div>
        </div>
        <div class="clinic-info">
            <h4 class="clinic-name">🏥 ${clinicName}</h4>
            ${clinicAddress ? `<p class="clinic-address">📮 ${clinicAddress}</p>` : ''}
            ${city ? `<p class="clinic-city">🌆 ${city}</p>` : ''}
        </div>
    `;
}

/**
 * Handle user details form submission
 */
async function handleUserDetailsSubmit(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData(e.target);
    const userDetails = {
        name: formData.get('userName').trim(),
        phone: formData.get('userPhone').trim(),
        email: formData.get('userEmail').trim(),
        age: parseInt(formData.get('userAge')),
        gender: formData.get('userGender'),
        city: formData.get('userCity').trim(),
        notes: formData.get('userNotes').trim()
    };
    
    // Validate
    if (!validateUserDetails(userDetails)) {
        return;
    }
    
    // Save to state
    appState.userDetails = userDetails;
    
    
    
    // Show loading on the submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="btn-spinner"></div> Loading...';
    
    try {
        // Register user in background before loading slots
        const registrationResponse = await apiService.registerUser(userDetails);
        
        // Handle both new registration and existing user
        if (registrationResponse.userId) {
            appState.userId = registrationResponse.userId;
        } else {
            throw new Error('No userId received from registration');
        }
        
        // Load slots immediately (next 3 days)
        await loadAvailableSlots();
    } catch (error) {
        console.error('❌ Registration error:', error);
        alert('Failed to register user: ' + error.message);
        
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

/**
 * Validate user details
 */
function validateUserDetails(details) {
    // Name validation
    if (details.name.length < VALIDATION.NAME_MIN_LENGTH) {
        alert('Please enter a valid name (at least 2 characters)');
        return false;
    }
    
    // Phone validation
    if (!VALIDATION.PHONE_PATTERN.test(details.phone)) {
        alert('Please enter a valid 10-digit mobile number');
        return false;
    }
    
    // Email validation (if provided)
    if (details.email && !VALIDATION.EMAIL_PATTERN.test(details.email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    // Age validation
    if (details.age < VALIDATION.AGE_MIN || details.age > VALIDATION.AGE_MAX) {
        alert(`Please enter a valid age (${VALIDATION.AGE_MIN}-${VALIDATION.AGE_MAX})`);
        return false;
    }
    
    // Gender validation
    if (!details.gender) {
        alert('Please select your gender');
        return false;
    }
    
    // City validation
    if (details.city.length < 2) {
        alert('Please enter a valid city name');
        return false;
    }
    
    return true;
}

/**
 * Load available slots for the next 3 days
 */
async function loadAvailableSlots() {
    showLoading(true);
    try {
        const slotsData = await apiService.getAvailableSlots(
            appState.doctorId,
            appState.workplaceId
        );
        
        
        
        // Process slots
        processSlots(slotsData);
        
        // Use first available date
        if (appState.availableDates.length > 0) {
            appState.selectedDate = appState.availableDates[0];
            appState.currentDateIndex = 0;
        }
        
        // Show slots screen
        showScreen('slotsScreen');
        
        // Update doctor info in slots screen
        updateDoctorInfoCard();
        
        // Display slots
        displaySlots();
    } catch (error) {
        console.error('Error loading slots:', error);
        
        // Show user-friendly error message
        const errorMsg = error.message.includes('Cannot connect') 
            ? error.message 
            : 'Failed to load available slots. Please check your internet connection and try again.';
        
        alert('⚠️ ' + errorMsg);
        
        // Go back to user details screen
        showScreen('userDetailsScreen');
    } finally {
        showLoading(false);
    }
}

/**
 * Process slots data
 */
function processSlots(slotsData) {
    
    
    // Handle different response formats
    let slotsByDate = {};
    
    // Format 1: { slotsByDate: {...} }
    if (slotsData.slotsByDate) {
        slotsByDate = slotsData.slotsByDate;
    }
    // Format 2: Direct object with dates as keys
    else if (typeof slotsData === 'object' && !Array.isArray(slotsData)) {
        slotsByDate = slotsData;
    }
    // Format 3: Array of slot objects
    else if (Array.isArray(slotsData)) {
        
        // Group by date
        slotsData.forEach(slot => {
            const dateKey = slot.date || slot.slotDate || new Date().toISOString().split('T')[0];
            if (!slotsByDate[dateKey]) {
                slotsByDate[dateKey] = [];
            }
            slotsByDate[dateKey].push(slot.time || slot.slotTime || slot.slot);
        });
    }
    
    
    
    if (!slotsByDate || Object.keys(slotsByDate).length === 0) {
        console.warn('⚠️ No slots found in response');
        appState.allSlotsData = {};
        appState.availableDates = [];
        return;
    }
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day
    
    const processedSlots = {};
    const dates = [];
    
    Object.entries(slotsByDate).forEach(([date, timeSlots]) => {
        // Handle different date formats
        const datePart = date.split('T')[0]; // Extract YYYY-MM-DD
        const slotDate = new Date(datePart + 'T00:00:00');
        
        // Only include future dates
        if (slotDate >= now) {
            // Ensure timeSlots is an array
            const slotsArray = Array.isArray(timeSlots) ? timeSlots : [timeSlots];
            
            const dateSlots = slotsArray.map((timeSlot, index) => ({
                id: `${datePart}-${index}`,
                date: datePart,
                time: timeSlot,
                isAvailable: true
            }));
            
            if (dateSlots.length > 0) {
                processedSlots[datePart] = dateSlots;
                dates.push(datePart);
            }
        }
    });
    
    // Sort dates
    dates.sort();
    
    
    
    
    appState.allSlotsData = processedSlots;
    appState.availableDates = dates;
    appState.currentDateIndex = 0;
    
    if (dates.length > 0) {
        appState.selectedDate = dates[0];
    }
    
    
}

/**
 * Update doctor info card in slots screen
 */
function updateDoctorInfoCard() {
    const doctorCard = document.getElementById('doctorInfoCard');
    if (!doctorCard) return;
    
    const doctor = appState.doctorInfo || {};
    const workplace = appState.workplaceInfo || {};
    
    const doctorName = doctor.fullName || doctor.doctorName || 'Doctor';
    const workplaceName = workplace.workplaceName || workplace.clinicName || 'Clinic';
    const specialization = doctor.specialization || '';
    const address = workplace.address || '';
    const city = workplace.city || '';
    
    doctorCard.innerHTML = `
        <div class="doctor-info-header">
            <div class="doctor-avatar-mini">
                ${doctor.profileImage ? 
                    `<img src="${doctor.profileImage}" alt="${doctorName}" class="avatar-img">` :
                    `<div class="avatar-placeholder-mini">👨‍⚕️</div>`
                }
            </div>
            <div class="doctor-details">
                <h4 class="doctor-name-card">Dr. ${doctorName}</h4>
                ${specialization ? `<p class="doctor-spec">🩺 ${specialization}</p>` : ''}
            </div>
        </div>
        <div class="workplace-info">
            <h5 class="workplace-name">🏥 ${workplaceName}</h5>
            ${address ? `<p class="workplace-address">📍 ${address}${city ? ', ' + city : ''}</p>` : ''}
        </div>
    `;
}

/**
 * Display slots for current date
 */
function displaySlots() {
    const slotsContainer = document.getElementById('slotsContainer');
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    
    // Update selected date display
    if (appState.selectedDate) {
        const dateObj = new Date(appState.selectedDate.split('T')[0] + 'T12:00:00');
        selectedDateDisplay.textContent = dateObj.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS.LONG);
    }
    
    // Check if slots available
    if (!appState.selectedDate || !appState.allSlotsData[appState.selectedDate] || 
        appState.allSlotsData[appState.selectedDate].length === 0) {
        slotsContainer.classList.add('hidden');
        slotsContainer.innerHTML = `
            <div class="no-slots-container">
                <div class="no-slots-icon">⚠️</div>
                <h3 class="no-slots-title">No Available Slots</h3>
                <p class="no-slots-text">No slots available for the selected date. Please try another date.</p>
            </div>
        `;
        slotsContainer.classList.remove('hidden');
        updateDateNavigation();
        return;
    }
    
    // Show slots
    slotsContainer.classList.remove('hidden');
    
    const slots = appState.allSlotsData[appState.selectedDate];
    slotsContainer.innerHTML = slots.map(slot => `
        <div class="slot-card" onclick="selectSlot('${slot.id}')">
            <div class="slot-time">⏰ ${slot.time}</div>
            <div class="slot-status">Available</div>
        </div>
    `).join('');
    
    // Update date navigation
    updateDateNavigation();
}

/**
 * Update date navigation
 */
function updateDateNavigation() {
    const currentDateText = document.getElementById('currentDateText');
    const dateCounter = document.getElementById('dateCounter');
    const prevBtn = document.getElementById('prevDateBtn');
    const nextBtn = document.getElementById('nextDateBtn');
    
    if (!currentDateText || !dateCounter) return;
    
    const dateObj = new Date(appState.selectedDate.split('T')[0] + 'T12:00:00');
    currentDateText.textContent = dateObj.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS.MEDIUM);
    dateCounter.textContent = `${appState.currentDateIndex + 1} of ${appState.availableDates.length}`;
    
    // Update button states
    prevBtn.disabled = appState.currentDateIndex === 0;
    nextBtn.disabled = appState.currentDateIndex === appState.availableDates.length - 1;
}

/**
 * Navigate to previous date
 */
function goToPreviousDate() {
    if (appState.currentDateIndex > 0) {
        appState.currentDateIndex--;
        appState.selectedDate = appState.availableDates[appState.currentDateIndex];
        displaySlots();
    }
}

/**
 * Navigate to next date
 */
function goToNextDate() {
    if (appState.currentDateIndex < appState.availableDates.length - 1) {
        appState.currentDateIndex++;
        appState.selectedDate = appState.availableDates[appState.currentDateIndex];
        displaySlots();
    }
}

/**
 * Select a slot
 */
function selectSlot(slotId) {
    const slot = Object.values(appState.allSlotsData)
        .flat()
        .find(s => s.id === slotId);
    
    if (!slot) {
        alert('Slot not found');
        return;
    }
    
    appState.selectedSlot = slot;
    
    
    // Show confirmation screen
    showConfirmationScreen();
}

/**
 * Show confirmation screen
 */
function showConfirmationScreen() {
    const confirmUserDetails = document.getElementById('confirmUserDetails');
    const confirmClinicDetails = document.getElementById('confirmClinicDetails');
    const confirmAppointmentDetails = document.getElementById('confirmAppointmentDetails');
    
    const user = appState.userDetails;
    const doctor = appState.doctorInfo;
    const workplace = appState.workplaceInfo;
    const slot = appState.selectedSlot;
    
    // User details
    confirmUserDetails.innerHTML = `
        <p><strong>Name:</strong> ${user.name}</p>
        <p><strong>Phone:</strong> ${user.phone}</p>
        ${user.email ? `<p><strong>Email:</strong> ${user.email}</p>` : ''}
        <p><strong>Age:</strong> ${user.age} years</p>
        <p><strong>Gender:</strong> ${user.gender}</p>
        <p><strong>City:</strong> ${user.city}</p>
        ${user.notes ? `<p><strong>Notes:</strong> ${user.notes}</p>` : ''}
    `;
    
    // Clinic details
    confirmClinicDetails.innerHTML = `
        <p><strong>Doctor:</strong> Dr. ${doctor.fullName || doctor.doctorName}</p>
        ${doctor.specialization ? `<p><strong>Specialization:</strong> ${doctor.specialization}</p>` : ''}
        <p><strong>Clinic:</strong> ${workplace.workplaceName || workplace.clinicName}</p>
        ${workplace.address ? `<p><strong>Address:</strong> ${workplace.address}</p>` : ''}
        ${workplace.contactNumber ? `<p><strong>Contact:</strong> ${workplace.contactNumber}</p>` : ''}
    `;
    
    // Appointment details
    const dateObj = new Date(slot.date.split('T')[0] + 'T12:00:00');
    confirmAppointmentDetails.innerHTML = `
        <p><strong>Date:</strong> ${dateObj.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS.LONG)}</p>
        <p><strong>Time:</strong> ${slot.time}</p>
    `;
    
    showScreen('confirmationScreen');
}

/**
 * Handle confirm booking
 */
async function handleConfirmBooking() {
    const confirmBtn = document.getElementById('confirmBookingBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Booking...';
    
    try {
        // Check if user is registered
        if (!appState.userId) {
            throw new Error('User not registered. Please go back and fill in your details again.');
        }

        const appointmentData = {
            doctorId: appState.doctorId,
            workplaceId: appState.workplaceId,
            requestedTime: new Date(appState.selectedSlot.date).toISOString(),
            slot: appState.selectedSlot.time,
            notes: appState.userDetails.notes
        };
        
        console.log('📝 Booking appointment:', { 
            userId: appState.userId,
            user: appState.userDetails, 
            appointment: appointmentData 
        });
        
        const result = await apiService.bookAppointment(appState.userId, appointmentData, appState.userDetails);
        
        
        
        // Show success screen
        showSuccessScreen(result);
    } catch (error) {
        alert('Failed to book appointment: ' + error.message);
        console.error('Booking error:', error);
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Booking ✓';
    }
}

/**
 * Show success screen
 */
function showSuccessScreen(bookingResult) {
    const successDetails = document.getElementById('successDetails');
    const downloadLink = document.getElementById('downloadAppLink');
    
    const doctor = appState.doctorInfo;
    const workplace = appState.workplaceInfo;
    const slot = appState.selectedSlot;
    const user = appState.userDetails;
    
    const dateObj = new Date(slot.date.split('T')[0] + 'T12:00:00');
    
    successDetails.innerHTML = `
        <div class="success-item">
            <strong>Appointment ID:</strong> ${bookingResult.appointmentId || bookingResult.id || 'Pending'}
        </div>
        <div class="success-item">
            <strong>Patient Name:</strong> ${user.name}
        </div>
        <div class="success-item">
            <strong>Doctor:</strong> Dr. ${doctor.fullName || doctor.doctorName}
        </div>
        <div class="success-item">
            <strong>Clinic:</strong> ${workplace.workplaceName || workplace.clinicName}
        </div>
        <div class="success-item">
            <strong>Date:</strong> ${dateObj.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS.LONG)}
        </div>
        <div class="success-item">
            <strong>Time:</strong> ${slot.time}
        </div>
        <div class="success-note">
            📱 Please save your appointment details. You will receive a confirmation SMS on ${user.phone}
        </div>
    `;
    
    // Set download link
    downloadLink.href = APP_DOWNLOAD_LINKS.DEFAULT;
    
    showScreen('successScreen');
}

/**
 * Show/hide loading screen
 */
function showLoading(show) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (show) {
        loadingScreen.classList.remove('hidden');
    } else {
        loadingScreen.classList.add('hidden');
    }
}

/**
 * Show error screen
 */
function showError(title, message) {
    const errorScreen = document.getElementById('errorScreen');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.innerHTML = `<strong>${title}</strong><br>${message}`;
    
    // Hide all other screens
    document.querySelectorAll('.screen').forEach(screen => {
        if (screen.id !== 'errorScreen') {
            screen.classList.add('hidden');
        }
    });
    
    errorScreen.classList.remove('hidden');
}

/**
 * Show specific screen
 */
function showScreen(screenId) {
    
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
        window.scrollTo(0, 0); // Scroll to top
    }
}
