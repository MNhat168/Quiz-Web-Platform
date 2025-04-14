package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class OtpService {
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRATION_MINUTES = 1;
    
    private final Map<String, String> otpStorage = new HashMap<>();
    private final Map<String, LocalDateTime> otpExpirationTime = new HashMap<>();
    private final Map<String, User> pendingUsers = new HashMap<>();

    public String generateOtp() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    public void saveOtp(String email, String otp) {
        otpStorage.put(email, otp);
        otpExpirationTime.put(email, LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES));
    }

    public OtpVerificationResult verifyOtp(String email, String otp) {
        String storedOtp = otpStorage.get(email);
        LocalDateTime expirationTime = otpExpirationTime.get(email);
        
        if (storedOtp == null || expirationTime == null) {
            return new OtpVerificationResult(false, "No OTP found for this email");
        }
        
        // Check if OTP has expired
        if (LocalDateTime.now().isAfter(expirationTime)) {
            clearOtp(email);
            return new OtpVerificationResult(false, "OTP has expired. Please request a new one");
        }
        
        if (!storedOtp.equals(otp)) {
            return new OtpVerificationResult(false, "Invalid OTP");
        }
        
        return new OtpVerificationResult(true, "OTP verified successfully");
    }

    public void clearOtp(String email) {
        otpStorage.remove(email);
        otpExpirationTime.remove(email);
    }

    public void savePendingUser(String email, User user) {
        pendingUsers.put(email, user);
    }

    public User getPendingUser(String email) {
        return pendingUsers.get(email);
    }

    public void clearPendingUser(String email) {
        pendingUsers.remove(email);
    }

    public static class OtpVerificationResult {
        private final boolean valid;
        private final String message;

        public OtpVerificationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }
} 