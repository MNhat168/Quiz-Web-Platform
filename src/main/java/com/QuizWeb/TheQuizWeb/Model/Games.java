package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;


@Data
@Document(collection = "games")
public class Games {
    @Id
    private String id;
    private String title;
    private String description;
    private String creatorId; // Teacher who created the game
    private boolean isPublic;
    private List<String> tags;
    private String subject; // Main subject (Math, Science, etc.)
    private String gradeLevel; // Target grade level
    private List<String> topics; // Specific topics covered
    private List<GameActivity> activities;
    private GameSettings settings;
    private Date createdAt;
    private Date updatedAt;
    private List<String> assignedClassIds; // Classes this game is assigned to

    @Data
    public static class GameActivity {
        private String activityId; // Reference to Activity
        private Activity.ActivityType activityType;
        private int order; // Order in the game sequence
        private int duration; // Time allowed for this activity in seconds
        private int points;
        private String topic; // Specific topic this activity addresses
        private String learningObjective; // Learning objective for this activity
        private ActivityRequirement requirement;
    }

    @Data
    public static class ActivityRequirement {
        private boolean isRequired;
        private int minimumScore;
        private RequirementType type;
    }

    public enum RequirementType {
        NONE, SCORE_THRESHOLD, TIME_LIMIT, COMPLETION
    }

    @Data
    public static class GameSettings {
        private boolean powerUpsEnabled;
        private boolean randomizeActivities;
        private boolean teamBased;
        private int globalTimeLimit; // In seconds, 0 for no limit
        private String pointsStrategy; // CUMULATIVE, HIGHEST, AVERAGE
        private boolean adaptiveDifficulty; // Adjust difficulty based on performance
        private PowerUpSettings powerUpSettings;
        private boolean showFeedbackImmediately; // Show correctness immediately after answer
        private boolean allowRetries; // Allow students to retry activities
        private int maxRetries; // Maximum number of retries per activity
    }

    @Data
    public static class PowerUpSettings {
        private int baseThreshold;
        private int thresholdIncrement;
        private int maxPowerUpsPerPlayer;
        private List<String> enabledPowerUpIds;
    }
}
