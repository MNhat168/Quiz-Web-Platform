package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "classes")
public class Class {
    @Id
    private String id;
    private String name;
    private String description;
    private String teacherId; // Reference to teacher User
    private List<String> studentIds; // References to student Users
    private List<String> assignedGameIds; // Games assigned to this class
    private List<ClassGameHistory> gameHistory; // Past game sessions for this class
    private Map<String, SubjectProgress> subjectProgress; // Subject-wise class progress
    private Date createdAt;
    private boolean isActive;

    @Data
    public static class SubjectProgress {
        private String subject;
        private double averageScore;
        private int totalActivitiesCompleted;
        private Date lastActivity;
        private Map<String, Double> topicScores; // Topic-wise average scores
    }

    @Data
    public static class ClassGameHistory {
        private String gameSessionId; // Reference to GameSession
        private String gameId; // Reference to Game
        private Date playedOn;
        private double classAverageScore;
        private int participationPercentage; // Percentage of students who participated
        private Map<String, StudentPerformanceSummary> studentPerformance; // Student ID to performance summary
    }

    @Data
    public static class StudentPerformanceSummary {
        private int totalScore;
        private int correctAnswers;
        private int incorrectAnswers;
        private int completedActivities;
        private int skippedActivities;
        private long averageResponseTime; // In milliseconds
        private Map<String, Integer> activityScores; // Activity ID to score mapping
    }
}
