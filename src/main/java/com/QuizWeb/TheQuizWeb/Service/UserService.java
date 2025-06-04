package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OtpService otpService;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private Cloudinary cloudinary;
    
    @Autowired
    private UploadImageFile uploadImageFile;
    
    public User getUserById(String userId) {
        return userRepository.findById(userId).orElse(null);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
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

    public User updateUserAvatar(String userId, String newAvatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String oldAvatarUrl = user.getAvatarUrl();
        if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty() && !oldAvatarUrl.equals(newAvatarUrl)) {
            String oldPublicId = ((UploadImageFileImpl) uploadImageFile).extractPublicIdFromUrl(oldAvatarUrl);
            System.out.println("DEBUG: public_id to delete (after decode) = " + oldPublicId);
            if (oldPublicId != null) {
                try {
                    Map result = cloudinary.uploader().destroy(oldPublicId, ObjectUtils.emptyMap());
                    System.out.println("DEBUG: Cloudinary destroy result = " + result);
                } catch (Exception e) {
                    System.err.println("Không thể xóa avatar cũ trên Cloudinary: " + e.getMessage());
                }
            }
        }

        user.updateAvatar(newAvatarUrl);
        return userRepository.save(user);
    }

    public Map<String, Object> getUserDetailedInfo(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("email", user.getEmail());
        userInfo.put("displayName", user.getDisplayName());
        userInfo.put("avatarUrl", user.getAvatarUrl());
        userInfo.put("role", user.getRole());
        userInfo.put("classIds", user.getClassIds());
        
        if (user.getStats() != null) {
            userInfo.put("gamesPlayed", user.getStats().getGamesPlayed());
            userInfo.put("totalPoints", user.getStats().getTotalPoints());
            userInfo.put("correctAnswers", user.getStats().getCorrectAnswers());
            userInfo.put("incorrectAnswers", user.getStats().getIncorrectAnswers());
            userInfo.put("scoresBySubject", user.getStats().getScoresBySubject());
        }
        
        return userInfo;
    }

    public User updateUser(User user) {
        // Validate username uniqueness if changed
        if (user.getUsername() != null) {
            Optional<User> existingUser = userRepository.findByUsername(user.getUsername());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
                throw new RuntimeException("Username already exists");
            }
        }
        
        return userRepository.save(user);
    }

    public String extractPublicIdFromUrl(String url) {
        if (url == null) return null;
        int uploadIndex = url.indexOf("/upload/");
        if (uploadIndex == -1) return null;
        String afterUpload = url.substring(uploadIndex + 8); // 8 là độ dài "/upload/"
        // Bỏ version nếu có (bắt đầu bằng 'v' + số + '/')
        if (afterUpload.startsWith("v")) {
            int slashIndex = afterUpload.indexOf('/');
            if (slashIndex != -1) {
                afterUpload = afterUpload.substring(slashIndex + 1);
            }
        }
        int dotIndex = afterUpload.lastIndexOf('.');
        if (dotIndex == -1) return afterUpload;
        return afterUpload.substring(0, dotIndex);
    }
}
