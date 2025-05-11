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
    private String creatorId;
    private boolean isPublic;
    private List<String> tags;
    private String subject;
    private String gradeLevel;
    private List<String> topics;
    private List<GameActivity> activities;
    private GameSettings settings;
    private Date createdAt;
    private Date updatedAt;
    private List<String> assignedClassIds;

    @Data
    public static class GameActivity {
        private String activityId;
        private Activity.ActivityType activityType;
        private int order;
        private int duration;
        private int points;
        private String topic;
        private String learningObjective;
        private TeamActivitySettings teamSettings;
    }

    @Data
    public static class TeamActivitySettings {
        private boolean enableTeams;
        private int minTeamSize;
        private int maxTeamSize;
        private TeamFormationMethod formationMethod;
        private int roundsPerDrawer;
        private int drawingTimePerRound;

        public enum TeamFormationMethod {
            RANDOM, TEACHER_ASSIGNED, STUDENT_CHOICE, BALANCED_SKILL
        }
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
        private int globalTimeLimit;
        private String pointsStrategy;
        private boolean adaptiveDifficulty;
        private PowerUpSettings powerUpSettings;
        private boolean showFeedbackImmediately;
        private boolean allowRetries;
        private int maxRetries;
        private TeamGameSettings teamSettings;

        @Data
        public static class TeamGameSettings {
            private int minTeamSize = 2;
            private int maxTeamSize = 4;
            private boolean autoAssignTeams = true;
        }
    }

    @Data
    public static class PowerUpSettings {
        private int baseThreshold;
        private int thresholdIncrement;
        private int maxPowerUpsPerPlayer;
        private List<String> enabledPowerUpIds;
    }
}