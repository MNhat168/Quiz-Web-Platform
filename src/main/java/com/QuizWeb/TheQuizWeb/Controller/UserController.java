package com.QuizWeb.TheQuizWeb.Controller;

import java.util.HashMap;
import java.util.Map;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
}
