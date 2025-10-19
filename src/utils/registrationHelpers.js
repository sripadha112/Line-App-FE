// Registration Helper Functions and Example Payloads
import { DoctorAPIService } from '../services/doctorApiService';

// Example payload for user registration
export const createUserRegistrationPayload = (userData) => {
  return {
    mobileNumber: userData.mobileNumber,
    fullName: userData.fullName,
    email: userData.email,
    address: userData.address,
    city: userData.city,
    state: userData.state,
    pincode: userData.pincode,
    country: userData.country
  };
};

// Example payload for doctor registration
export const createDoctorRegistrationPayload = (doctorData) => {
  return {
    mobileNumber: doctorData.mobileNumber,
    fullName: doctorData.fullName,
    email: doctorData.email,
    address: doctorData.address,
    city: doctorData.city,
    state: doctorData.state,
    pincode: doctorData.pincode,
    country: doctorData.country,
    specialization: doctorData.specialization,
    designation: doctorData.designation,
    morningStartTime: doctorData.morningStartTime,
    morningEndTime: doctorData.morningEndTime,
    eveningStartTime: doctorData.eveningStartTime,
    eveningEndTime: doctorData.eveningEndTime,
    checkingDurationMinutes: doctorData.checkingDurationMinutes,
    workspaces: doctorData.workspaces || []
  };
};

// Example workspace object for doctor registration
export const createWorkspacePayload = (workspaceData) => {
  return {
    workplaceName: workspaceData.workplaceName,
    workplaceType: workspaceData.workplaceType, // 'HOSPITAL', 'CLINIC', etc.
    address: workspaceData.address,
    contactNumber: workspaceData.contactNumber,
    isPrimary: workspaceData.isPrimary || false,
    morningStartTime: workspaceData.morningStartTime,
    morningEndTime: workspaceData.morningEndTime,
    eveningStartTime: workspaceData.eveningStartTime,
    eveningEndTime: workspaceData.eveningEndTime,
    checkingDurationMinutes: workspaceData.checkingDurationMinutes
  };
};

// Registration service functions
export const registerUser = async (userData) => {
  const payload = createUserRegistrationPayload(userData);
  return await DoctorAPIService.registerUser(payload);
};

export const registerDoctor = async (doctorData) => {
  const payload = createDoctorRegistrationPayload(doctorData);
  return await DoctorAPIService.registerDoctor(payload);
};

// Example usage:
/*
// User Registration Example
const userExample = {
  mobileNumber: "9876543210",
  fullName: "John Doe",
  email: "john.doe@example.com",
  address: "123 Main Street",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001",
  country: "India"
};

// Doctor Registration Example
const doctorExample = {
  mobileNumber: "9876543210",
  fullName: "Dr. Jane Smith",
  email: "dr.jane@example.com",
  address: "456 Medical Street",
  city: "Delhi",
  state: "Delhi",
  pincode: "110001",
  country: "India",
  specialization: "Cardiology",
  designation: "Senior Consultant",
  morningStartTime: "09:00:00",
  morningEndTime: "12:00:00",
  eveningStartTime: "17:00:00",
  eveningEndTime: "20:00:00",
  checkingDurationMinutes: 15,
  workspaces: [
    {
      workplaceName: "City Hospital",
      workplaceType: "HOSPITAL",
      address: "123 Hospital Road",
      contactNumber: "022-12345678",
      isPrimary: true,
      morningStartTime: "09:00:00",
      morningEndTime: "12:00:00",
      eveningStartTime: "17:00:00",
      eveningEndTime: "20:00:00",
      checkingDurationMinutes: 15
    }
  ]
};

// Usage:
try {
  const userResponse = await registerUser(userExample);
  console.log('User registered:', userResponse);
  // Expected response: {"status": "SUCCESS", "message": "User registered successfully", "userId": 123, "userType": "USER"}
  
  const doctorResponse = await registerDoctor(doctorExample);
  console.log('Doctor registered:', doctorResponse);
  // Expected response: {"status": "SUCCESS", "message": "Doctor registered successfully", "userId": 456, "userType": "DOCTOR"}
} catch (error) {
  console.error('Registration failed:', error);
}
*/
