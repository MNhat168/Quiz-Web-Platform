package com.QuizWeb.TheQuizWeb.Controller;

import java.util.HashMap;
import java.util.Map;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Service.UploadImageFile;
import com.QuizWeb.TheQuizWeb.Service.UserService;

import jakarta.annotation.security.PermitAll;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UploadImageFile uploadImageFile;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        User teacher = userService.getCurrentUser(authentication);

        Map<String, Object> profile = new HashMap<>();
        profile.put("name", teacher.getDisplayName()); 
        profile.put("email", teacher.getEmail());
        profile.put("role", teacher.getRole());
        profile.put("userId", teacher.getId());
        profile.put("avatarUrl", teacher.getAvatarUrl());

        return ResponseEntity.ok(profile);
    }

    @PostMapping("/{userId}/avatar")
    @PermitAll
    public ResponseEntity<User> updateAvatar(
            @PathVariable String userId,
            @RequestParam("file") MultipartFile file) throws IOException {
        
        // Upload ảnh lên Cloudinary
        String avatarUrl = uploadImageFile.uploadImage(file);
        
        // Cập nhật vào database
        User updatedUser = userService.updateUserAvatar(userId, avatarUrl);
        
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/detailed-info")
    public ResponseEntity<?> getDetailedUserInfo(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        try {
            User currentUser = userService.getCurrentUser(authentication);
            Map<String, Object> userInfo = userService.getUserDetailedInfo(currentUser.getId());
            return ResponseEntity.ok(userInfo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> updates,
            Authentication authentication) {
        try {
            User currentUser = userService.getCurrentUser(authentication);
            
            // Update user profile
            if (updates.containsKey("displayName")) {
                currentUser.setDisplayName(updates.get("displayName"));
            }
            if (updates.containsKey("username")) {
                currentUser.setUsername(updates.get("username"));
            }
            
            User updatedUser = userService.updateUser(currentUser);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please login to upload avatar");
            }

            // Get current user
            User currentUser = userService.getCurrentUser(authentication);

            // Basic file validation
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body("Please select an image");
            }

            // Upload to Cloudinary
            String avatarUrl = uploadImageFile.uploadImage(file);
            if (avatarUrl == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload image to cloud storage");
            }
            
            // Update user's avatar URL
            User updatedUser = userService.updateUserAvatar(currentUser.getId(), avatarUrl);
            
            return ResponseEntity.ok(updatedUser);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Upload failed: " + e.getMessage());
        }
    }
}
