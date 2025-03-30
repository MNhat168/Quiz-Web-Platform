package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;

@Data
public class GameActivity {
    private String activityId;
    private Activity.ActivityType activityType;
    private int order;
    private int duration;
    private int points;
    private String transitionType;
    private ActivityRequirement requirement;

    @Data
    public class ActivityRequirement {
        private boolean isRequired;
        private int minimumScore;
        private RequirementType type;
    }

    public enum RequirementType {
        NONE, SCORE_THRESHOLD, TIME_LIMIT, COMPLETION
    }
}

