package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    
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

    public User updateUserAvatar(String userId, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        user.updateAvatar(avatarUrl);
        return userRepository.save(user);
    }

}
