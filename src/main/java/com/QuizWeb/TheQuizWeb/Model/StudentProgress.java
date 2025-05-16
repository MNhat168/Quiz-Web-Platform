package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.*;

@Data
@Document(collection = "studentProgress")
public class StudentProgress {
    @Id
    private String id;
    private String studentId;
    private int totalScore;
    private int totalSessions;
    private Date lastActivityDate;
    private List<RecentSession> recentSessions;
    private List<SubjectProgress> subjectProgressList;

    @Data
    public static class RecentSession {
        private String id;
        private String gameId;
        private Date startTime;
        private Date endTime;
        private String subject;
        private List<ParticipantSummary> participants;
    }

    @Data
    public static class ParticipantSummary {
        private String userId;
        private int totalScore;
    }

    @Data
    public static class SubjectProgress {
        private String subject;
        private int bestScore;
        private int totalSessions;
        private Date lastPlayed;
    }

    // Constructors
    public StudentProgress() {
        this.id = UUID.randomUUID().toString();
        this.subjectProgressList = new ArrayList<>();
        this.recentSessions = new ArrayList<>();
    }
}
