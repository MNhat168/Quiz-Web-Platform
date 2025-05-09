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
    private String gameId;
    private String classId;
    private String teacherId;
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
    private SessionStatistics statistics;

    // Team class now tracks content item index for team-based activities
    @Data
    public static class Team {
        private String teamId;
        private String teamName;
        private List<String> teamMembers;
        private int teamScore;
        private String currentDrawerId;
        private int nextDrawerIndex;
        private int currentContentIndex = 0; // Tracks progress through activity's contentItems
        private Object currentDrawing;
        private Date lastDrawingUpdate;

        public void initializeDrawingRotation() {
            if (this.teamMembers != null && !this.teamMembers.isEmpty()) {
                this.currentDrawerId = this.teamMembers.get(0);
            }
        }

        public String getNextDrawer() {
            if (this.teamMembers == null || this.teamMembers.isEmpty()) {
                return null;
            }
            if (this.currentDrawerId == null) {
                return this.teamMembers.get(0);
            }
            int currentIndex = this.teamMembers.indexOf(this.currentDrawerId);
            if (currentIndex == -1) {
                return this.teamMembers.get(0);
            }
            int nextIndex = (currentIndex + 1) % this.teamMembers.size();
            return this.teamMembers.get(nextIndex);
        }
    }

    public enum SessionStatus {
        LOBBY, ACTIVE, PAUSED, COMPLETED
    }

    // SessionActivity tracks the current content item index for non-team activities
    @Data
    public static class SessionActivity {
        private String activityId;
        private Date startTime;
        private Date endTime;
        private ActivityStatus status;
        private List<ParticipantResponse> responses;
        private int currentContentIndex = 0; // Tracks current content item in the activity

        public String getCurrentDrawer(GameSession session, String teamId) {
            if (session.getTeams() == null) return null;
            return session.getTeams().stream()
                    .filter(t -> t.getTeamId().equals(teamId))
                    .findFirst()
                    .map(Team::getCurrentDrawerId)
                    .orElse(null);
        }

        public void rotateDrawer(GameSession session, String teamId) {
            if (session.getTeams() == null) return;
            session.getTeams().stream()
                    .filter(t -> t.getTeamId().equals(teamId))
                    .findFirst()
                    .ifPresent(team -> {
                        String nextDrawer = team.getNextDrawer();
                        if (nextDrawer != null) {
                            team.setCurrentDrawerId(nextDrawer);
                        }
                    });
        }
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
        private Map<String, Integer> activityScores; // Tracks scores per activity:contentItem
    }

    @Data
    public static class ParticipantResponse {
        private String participantId;
        private String activityId;
        private String contentId; // Now tracks which contentItem was answered
        private Object answer;
        private boolean isCorrect;
        private int timeSpent;
        private int pointsEarned;
        private Date submittedAt;
        private List<String> hintsUsed;
        private int attempts;
        private String teamId;
        private String drawerId;
    }

    @Data
    public static class SessionStatistics {
        private int totalParticipants;
        private int activeParticipants;
        private Map<String, Integer> participantScores;
        private Map<String, PerformanceMetric> activityPerformance;
        private double overallCompletionPercentage;
        private double overallCorrectAnswerPercentage;
        private Map<String, List<String>> strugglingStudents;
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
        private String userId;
        private String targetId;
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