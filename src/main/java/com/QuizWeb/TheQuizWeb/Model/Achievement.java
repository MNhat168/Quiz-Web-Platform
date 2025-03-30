package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "achievements")
public class Achievement {
    @Id
    private String id;
    private String name;
    private String description;
    private String iconUrl;
    private AchievementType type;
    private AchievementTrigger trigger;
    private int targetValue;
    private List<String> rewards; // Description of rewards
    private boolean isSystemAchievement; // True for system-defined, false for teacher-created
    private String creatorId; // Teacher who created this achievement
    private List<String> applicableClassIds; // Classes this achievement applies to
    private Date createdAt;

    public enum AchievementType {
        PARTICIPATION, MASTERY, STREAK, IMPROVEMENT, SPECIAL
    }

    @Data
    public static class AchievementTrigger {
        private TriggerType type;
        private Map<String, Object> conditions;
    }

    public enum TriggerType {
        GAME_COMPLETION, SCORE_THRESHOLD, ACTIVITY_STREAK, IMPROVEMENT_PERCENTAGE,
        TIME_EFFICIENCY, HELP_OTHERS, PERFECT_SCORE, SUBJECT_MASTERY
    }
}
