package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.Map;

@Data
@Document(collection = "powerUps")
public class PowerUp {
    @Id
    private String id;
    private String name;
    private PowerUpType type;
    private String description;
    private String iconUrl;
    private PowerEffect effect;
    private int activationCost;
    private int cooldown; // In seconds
    private boolean isEnabled;
    private boolean isTeacherApproved; // Whether teacher approval is needed to use

    public enum PowerUpType {
        BUFF, DEBUFF, UTILITY
    }

    @Data
    public static class PowerEffect {
        private EffectType type;
        private String targetType; // SELF, OPPONENT, TEAM, ALL
        private double value;
        private int duration; // In seconds
        private Map<String, Object> additionalParams;
    }

    public enum EffectType {
        TIME_MODIFIER,
        POINTS_MODIFIER,
        INTERFACE_EFFECT,
        QUESTION_MODIFIER,
        HINT_REVEALER,
        ANSWER_SHUFFLER,
        SCREEN_SHAKER,
        OPTION_ELIMINATOR,
        RETRY_GRANT
    }
}

