package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OtpService otpService;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User getUserById(String userId) {
        return userRepository.findById(userId).orElse(null);
    }
    
    /**
     * Get the currently authenticated user
     */
    public User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
    
    /**
     * Add a class to a user's list of classes
     */
    public void addClassToUser(String userId, String classId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        List<String> classIds = user.getClassIds();
        if (classIds == null) {
            classIds = new ArrayList<>();
            user.setClassIds(classIds);
        }
        
        if (!classIds.contains(classId)) {
            classIds.add(classId);
            userRepository.save(user);
        }
    }
    
    /**
     * Remove a class from a user's list of classes
     */
    public void removeClassFromUser(String userId, String classId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        List<String> classIds = user.getClassIds();
        if (classIds != null && classIds.contains(classId)) {
            classIds.remove(classId);
            userRepository.save(user);
        }
    }

    public void sendVerificationEmail(String email) {
        String otp = otpService.generateOtp();
        otpService.saveOtp(email, otp);
        // TODO: Implement email sending logic
    }

    public OtpService.OtpVerificationResult verifyEmail(String email, String otp) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (!userOptional.isPresent()) {
            return new OtpService.OtpVerificationResult(false, "User not found");
        }

        OtpService.OtpVerificationResult result = otpService.verifyOtp(email, otp);
        if (result.isValid()) {
            User user = userOptional.get();
            user.setEnabled(true);
            userRepository.save(user);
            otpService.clearOtp(email);
        }
        return result;
    }

    public User registerUser(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setEnabled(false);
        return userRepository.save(user);
    }
}
