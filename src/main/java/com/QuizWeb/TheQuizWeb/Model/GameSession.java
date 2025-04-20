package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "gameSessions")
public class GameSession {
    @Id
    private String id;
    private String gameId; // Reference to Game
    private String classId; // Reference to Class
    private String teacherId; // Teacher hosting the session
    private String accessCode;
    private SessionStatus status;
    private Date startTime;
    private Date endTime;
    private List<Participant> participants;
    private List<Team> teams;
    private int currentActivityIndex;
    private SessionActivity currentActivity;
    private List<PowerUpEvent> powerUpEvents;
    private SessionSettings settings;
    private SessionStatistics statistics; // Real-time statistics for teacher dashboard

    public void setId(String id) {
        this.id = id;
    }

    public void setGameId(String gameId) {
        this.gameId = gameId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public void setAccessCode(String accessCode) {
        this.accessCode = accessCode;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

    public void setParticipants(List<Participant> participants) {
        this.participants = participants;
    }

    public void setTeams(List<Team> teams) {
        this.teams = teams;
    }

    public void setCurrentActivityIndex(int currentActivityIndex) {
        this.currentActivityIndex = currentActivityIndex;
    }

    public void setCurrentActivity(SessionActivity currentActivity) {
        this.currentActivity = currentActivity;
    }

    public void setPowerUpEvents(List<PowerUpEvent> powerUpEvents) {
        this.powerUpEvents = powerUpEvents;
    }

    public void setSettings(SessionSettings settings) {
        this.settings = settings;
    }

    public void setStatistics(SessionStatistics statistics) {
        this.statistics = statistics;
    }

    public String getId() {
        return id;
    }

    public String getGameId() {
        return gameId;
    }

    public String getClassId() {
        return classId;
    }

    public String getTeacherId() {
        return teacherId;
    }

    public String getAccessCode() {
        return accessCode;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public Date getStartTime() {
        return startTime;
    }

    public Date getEndTime() {
        return endTime;
    }

    public List<Participant> getParticipants() {
        return participants;
    }

    public List<Team> getTeams() {
        return teams;
    }

    public int getCurrentActivityIndex() {
        return currentActivityIndex;
    }

    public SessionActivity getCurrentActivity() {
        return currentActivity;
    }

    public List<PowerUpEvent> getPowerUpEvents() {
        return powerUpEvents;
    }

    public SessionSettings getSettings() {
        return settings;
    }

    public SessionStatistics getStatistics() {
        return statistics;
    }

    public enum SessionStatus {
        LOBBY, ACTIVE, PAUSED, COMPLETED
    }

    @Data
    public static class SessionActivity {
        private String activityId;
        private Date startTime;
        private Date endTime;
        private ActivityStatus status;
        private List<ParticipantResponse> responses;
    }

    public enum ActivityStatus {
        PENDING, ACTIVE, COMPLETED
    }

    @Data
    public static class Participant {
        private String userId; 
        private String displayName;
        private String avatarUrl;
        private String teamId;
        private int totalScore;
        private List<ParticipantPowerUp> powerUps;
        private boolean isActive;
        private Date joinedAt;
        private Date lastActiveAt;
        private Map<String, Integer> activityScores; // Activity ID to score mapping

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public String getAvatarUrl() {
            return avatarUrl;
        }

        public void setAvatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
        }

        public String getTeamId() {
            return teamId;
        }

        public void setTeamId(String teamId) {
            this.teamId = teamId;
        }

        public int getTotalScore() {
            return totalScore;
        }

        public void setTotalScore(int totalScore) {
            this.totalScore = totalScore;
        }

        public List<ParticipantPowerUp> getPowerUps() {
            return powerUps;
        }

        public void setPowerUps(List<ParticipantPowerUp> powerUps) {
            this.powerUps = powerUps;
        }

        public boolean isActive() {
            return isActive;
        }

        public void setActive(boolean active) {
            isActive = active;
        }

        public Date getJoinedAt() {
            return joinedAt;
        }

        public void setJoinedAt(Date joinedAt) {
            this.joinedAt = joinedAt;
        }

        public Date getLastActiveAt() {
            return lastActiveAt;
        }

        public void setLastActiveAt(Date lastActiveAt) {
            this.lastActiveAt = lastActiveAt;
        }

        public Map<String, Integer> getActivityScores() {
            return activityScores;
        }

        public void setActivityScores(Map<String, Integer> activityScores) {
            this.activityScores = activityScores;
        }
    }

    @Data
    public static class Team {
        private String id;
        private String name;
        private String color;
        private List<String> participantIds;
        private int totalScore;
        private Map<String, Integer> activityScores; // Activity ID to score mapping
    }

    @Data
    public static class ParticipantResponse {
        private String participantId;
        private String activityId;
        private Object answer; // Will be deserialized to specific response type
        private boolean isCorrect;
        private int timeSpent; // In milliseconds
        private int pointsEarned;
        private Date submittedAt;
        private List<String> hintsUsed;
        private int attempts; // Number of attempts if retries are allowed
    }

    @Data
    public static class SessionStatistics {
        private int totalParticipants;
        private int activeParticipants;
        private Map<String, Integer> participantScores; // Real-time scores
        private Map<String, PerformanceMetric> activityPerformance; // Activity ID to performance metrics
        private double overallCompletionPercentage;
        private double overallCorrectAnswerPercentage;
        private Map<String, List<String>> strugglingStudents; // Activity ID to list of struggling student IDs
    }

    @Data
    public static class PerformanceMetric {
        private int totalAttempts;
        private int correctAttempts;
        private double averageTime;
        private int maxScore;
        private int minScore;
        private double averageScore;
    }

    @Data
    public static class PowerUpEvent {
        private String id;
        private String powerUpId;
        private String userId; // Student who used the power-up
        private String targetId; // Target user ID or team ID
        private PowerUpEventType eventType;
        private Date timestamp;
        private Map<String, Object> effectDetails;
    }

    public enum PowerUpEventType {
        ACQUIRED, USED, EFFECT_STARTED, EFFECT_ENDED
    }

    @Data
    public static class ParticipantPowerUp {
        private String powerUpId;
        private int quantity;
        private Date acquiredAt;
        private Date lastUsedAt;
    }
}

