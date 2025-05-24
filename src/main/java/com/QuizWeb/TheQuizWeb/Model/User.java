package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String username;
    private String email;
    private String passwordHash;
    private String displayName;
    private String avatarUrl;
    private UserRole role;
    private List<String> classIds; // Classes user belongs to (either as teacher or student)
    private Date createdAt;
    private Date lastLoginAt;
    private UserStats stats;
    private List<Achievement> achievements;
    private boolean enabled = false;

    public void updateAvatar(String newAvatarUrl) {
        this.avatarUrl = newAvatarUrl;
    }

    @Data
    public static class UserStats {
        private int gamesPlayed;
        private int gamesCreated; // For teachers
        private int totalPoints;
        private int correctAnswers;
        private int incorrectAnswers;
        private Map<String, Integer> scoresBySubject; // Subject to score mapping
        private Map<Activity.ActivityType, Integer> scoresByActivityType; // Activity type to score mapping
    }

    @Data
    public static class Achievement {
        private String id;
        private String name;
        private String description;
        private String iconUrl;
        private Date earnedAt;
        private AchievementType type;
        private int progress; // Current progress value (if applicable)
        private int targetValue; // Target value needed for completion
    }

    public enum AchievementType {
        PARTICIPATION, // e.g., "Participated in 10 game sessions"
        MASTERY, // e.g., "Achieved 90% in Math quizzes"
        STREAK, // e.g., "Completed activities for 5 days in a row"
        IMPROVEMENT, // e.g., "Improved score by 20% compared to previous attempt"
        SPECIAL // Custom achievements set by teachers
    }

    public enum UserRole {
        STUDENT, TEACHER, ADMIN
    }
}


