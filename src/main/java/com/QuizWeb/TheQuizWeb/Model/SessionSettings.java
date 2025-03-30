package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;

@Data
public class SessionSettings {
    private boolean allowLateJoin;
    private boolean showLeaderboard;
    private boolean showCorrectAnswers;
    private boolean showClassAverage;
    private boolean showIndividualScores;
    private int activityTransitionDelay; // Time in seconds between activities
    private boolean autoAdvance;
    private PowerUpMode powerUpMode;
    private boolean randomizeActivities;
    private boolean requireConfirmation; // Require teacher to confirm before advancing
    private boolean allowStudentPacing; // Allow students to move at their own pace
    private boolean recordSession; // Record session for later review
    private TeacherDashboardOptions dashboardOptions;

    public enum PowerUpMode {
        DISABLED, STANDARD, AGGRESSIVE, TEACHER_APPROVED
    }

    @Data
    public static class TeacherDashboardOptions {
        private boolean showRealTimeResponses;
        private boolean highlightStrugglingStudents;
        private boolean showActivityCompletion;
        private boolean enableManualIntervention;
        private boolean showResponseTimes;
    }
}
