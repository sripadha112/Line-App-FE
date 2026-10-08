/*
 * BACKEND API ENDPOINT DOCUMENTATION - Reset PIN (Forgot PIN Flow)
 * 
 * This file documents the API endpoint that needs to be implemented in the backend
 * to support the "Forgot PIN" functionality in the mobile app.
 */

// ════════════════════════════════════════════════════════════════════════════
// ENDPOINT: Reset PIN (Forgot PIN Flow)
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/reset-pin
 * 
 * Description:
 *   Resets/replaces the PIN for a user who has forgotten their PIN.
 *   This endpoint should allow a user to set a new PIN without requiring the old PIN.
 * 
 * Request Body:
 *   {
 *     "mobileNumber": "9876543210",           // 10-digit mobile number (string)
 *     "newPin": "encoded_encrypted_pin_value" // Encrypted new PIN value
 *   }
 * 
 * Response Success (200 OK):
 *   {
 *     "success": true,
 *     "message": "PIN has been reset successfully"
 *   }
 * 
 * Response Error (400 Bad Request):
 *   {
 *     "success": false,
 *     "error": "Mobile number not found",
 *     "message": "The provided mobile number is not registered in the system"
 *   }
 * 
 * Response Error (500 Internal Server Error):
 *   {
 *     "success": false,
 *     "error": "Failed to update PIN",
 *     "message": "An error occurred while updating the PIN"
 *   }
 * 
 * Implementation Notes:
 *   1. The endpoint should NOT require authentication (JWT token)
 *   2. The mobile number is used to identify the user
 *   3. The newPin parameter is already encrypted by the client
 *   4. The endpoint should simply replace the old PIN with the new one
 *   5. The mobile number should be validated to ensure it exists in the system
 *   6. Consider adding rate limiting to prevent brute force attacks
 * 
 * Security Considerations:
 *   - Validate mobile number format (10 digits for Indian numbers)
 *   - Add rate limiting (e.g., max 5 attempts per mobile per 24 hours)
 *   - Log PIN reset attempts for audit purposes
 *   - Consider sending OTP verification before allowing PIN reset
 *   - Ensure HTTPS is used for all requests
 */

// ════════════════════════════════════════════════════════════════════════════
// ALTERNATIVE: If backend only supports SET_PIN endpoint
// ════════════════════════════════════════════════════════════════════════════

/**
 * If your backend only has /api/auth/setpin endpoint, ensure it can handle:
 * 
 * PUT /api/auth/setpin
 * 
 * Request Body (Alternative to query parameters):
 *   {
 *     "mobileNumber": "9876543210",
 *     "pin": "encrypted_pin_value"
 *   }
 * 
 * This is more secure than using query parameters for sensitive data like PINs.
 */

// ════════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION GUIDE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Example Java/Spring Backend Implementation:
 * 
 * @PostMapping("/api/auth/reset-pin")
 * public ResponseEntity<?> resetPin(@RequestBody ResetPinRequest request) {
 *     try {
 *         // Validate mobile number
 *         if (!isValidMobileNumber(request.getMobileNumber())) {
 *             return ResponseEntity.badRequest()
 *                 .body(new ErrorResponse("Invalid mobile number format"));
 *         }
 *         
 *         // Check rate limiting
 *         if (isRateLimited(request.getMobileNumber())) {
 *             return ResponseEntity.status(429)
 *                 .body(new ErrorResponse("Too many reset attempts. Please try again later."));
 *         }
 *         
 *         // Find user by mobile number
 *         User user = userRepository.findByMobileNumber(request.getMobileNumber());
 *         if (user == null) {
 *             return ResponseEntity.status(404)
 *                 .body(new ErrorResponse("Mobile number not found"));
 *         }
 *         
 *         // Update PIN (decrypt if needed and store)
 *         String newPin = request.getNewPin();
 *         user.setPin(newPin); // or decrypt and store based on your encryption scheme
 *         userRepository.save(user);
 *         
 *         // Log the PIN reset
 *         auditLog.log("PIN_RESET", user.getId(), request.getMobileNumber());
 *         
 *         return ResponseEntity.ok(new SuccessResponse("PIN has been reset successfully"));
 *     } catch (Exception e) {
 *         logger.error("Error resetting PIN", e);
 *         return ResponseEntity.status(500)
 *             .body(new ErrorResponse("Failed to reset PIN"));
 *     }
 * }
 */

// ════════════════════════════════════════════════════════════════════════════
// TESTING
// ════════════════════════════════════════════════════════════════════════════

/**
 * Test the endpoint with cURL:
 * 
 * curl -X POST http://localhost:8080/api/auth/reset-pin \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "mobileNumber": "9876543210",
 *     "newPin": "encrypted_pin_value"
 *   }'
 */
