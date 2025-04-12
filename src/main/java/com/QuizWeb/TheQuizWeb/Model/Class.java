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
    private String classCode;
    private String teacherId; // Reference to teacher User
    private List<String> studentIds; // References to student Users
    private List<String> assignedGameIds; // Games assigned to this class
    private List<ClassGameHistory> gameHistory; // Past game sessions for this class
    private Map<String, SubjectProgress> subjectProgress; // Subject-wise class progress
    private Date createdAt;
    private boolean isActive;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getClassCode() {
        return classCode;
    }

    public void setClassCode(String classCode) {
        this.classCode = classCode;
    }

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public List<String> getStudentIds() {
        return studentIds;
    }

    public void setStudentIds(List<String> studentIds) {
        this.studentIds = studentIds;
    }

    public List<String> getAssignedGameIds() {
        return assignedGameIds;
    }

    public void setAssignedGameIds(List<String> assignedGameIds) {
        this.assignedGameIds = assignedGameIds;
    }

    public List<ClassGameHistory> getGameHistory() {
        return gameHistory;
    }

    public void setGameHistory(List<ClassGameHistory> gameHistory) {
        this.gameHistory = gameHistory;
    }

    public Map<String, SubjectProgress> getSubjectProgress() {
        return subjectProgress;
    }

    public void setSubjectProgress(Map<String, SubjectProgress> subjectProgress) {
        this.subjectProgress = subjectProgress;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

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
