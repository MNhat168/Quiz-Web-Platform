package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "studentProgress")
public class StudentProgress {
    @Id
    private String id;
    private String studentId; // Reference to User
    private Map<String, SubjectProgress> subjectProgress;
    private List<GameSessionResult> recentSessions;
    private List<String> earnedAchievementIds;
    private Map<String, Integer> skillLevels; // Skill name to level mapping
    private LearningProfile learningProfile;

    @Data
    public static class SubjectProgress {
        private String subject;
        private double overallScore;
        private Map<String, TopicProgress> topicProgress;
        private int totalActivitiesCompleted;
        private Date lastActivity;
        private List<PerformanceSnapshot> historicalPerformance;
    }

    @Data
    public static class TopicProgress {
        private String topic;
        private double masteryLevel; // 0-100
        private int activitiesCompleted;
        private Date lastActivity;
        private int correctAnswers;
        private int incorrectAnswers;
    }

    @Data
    public static class PerformanceSnapshot {
        private Date timestamp;
        private double score;
        private String gameId;
        private String sessionId;
    }

    @Data
    public static class GameSessionResult {
        private String sessionId;
        private String gameId;
        private Date playedOn;
        private int totalScore;
        private int rank; // Rank in class
        private Map<String, Integer> activityScores;
    }

    @Data
    public static class LearningProfile {
        private Map<String, Integer> learningStylePreferences;
        private Map<String, Integer> strengthAreas;
        private Map<String, Integer> challengeAreas;
        private List<String> recommendedActivities;
        private List<String> recommendedFocus;
    }
}
