package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.StudentProgress;
import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Model.Activity;
import com.QuizWeb.TheQuizWeb.Model.Games;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Repository.StudentProgressRepository;
import com.QuizWeb.TheQuizWeb.Repository.ActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentProgressService {
    private static final Logger logger = LoggerFactory.getLogger(StudentProgressService.class);

    @Autowired
    private StudentProgressRepository studentProgressRepository;

    @Autowired
    private GameSessionService gameSessionService;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private GameService gameService;

    @Autowired
    private UserService userService;

    public StudentProgress getStudentProgress(String studentId) {
        logger.info("Getting progress for student: {}", studentId);
        
        // Get all progress records for the student, sorted by lastActivityDate
        List<StudentProgress> allProgress = studentProgressRepository.findAll(
            Sort.by(Sort.Direction.DESC, "lastActivityDate")
        ).stream()
        .filter(progress -> progress.getStudentId().equals(studentId))
        .collect(Collectors.toList());
        
        if (!allProgress.isEmpty()) {
            // Use the latest progress
            StudentProgress latestProgress = allProgress.get(0);
            logger.info("Found existing progress for student: {}", studentId);
            
            // If there are multiple records, clean up the old ones
            if (allProgress.size() > 1) {
                cleanupDuplicateRecords(studentId, latestProgress.getId());
            }
            
            // Get and set display name using email
            Optional<User> userOptional = userService.getUserByEmail(studentId);
            if (userOptional.isPresent()) {
                latestProgress.setDisplayName(userOptional.get().getDisplayName());
            }
            
            return latestProgress;
        }
        
        // If no progress exists, create initial progress
        logger.info("No progress found for student: {}, creating initial progress", studentId);
        return createInitialProgress(studentId);
    }

    public StudentProgress updateProgress(String studentId, List<GameSession> sessions) {
        logger.info("Updating progress for student: {}", studentId);

        // Get user's display name using email
        Optional<User> userOptional = userService.getUserByEmail(studentId);
        String displayName = userOptional.map(User::getDisplayName).orElse(null);

        // Filter completed sessions for the student
        List<GameSession> completedSessions = sessions.stream()
            .filter(s -> s.getStatus() == GameSession.SessionStatus.COMPLETED)
            .collect(Collectors.toList());

        if (completedSessions.isEmpty()) {
            logger.info("No completed sessions found for student: {}", studentId);
            return getStudentProgress(studentId);
        }

        // Initialize progress
        StudentProgress progress = new StudentProgress();
        progress.setStudentId(studentId);
        progress.setDisplayName(displayName);
        progress.setTotalSessions(completedSessions.size());
        progress.setLastActivityDate(new Date());

        // Process each session
        int totalScore = 0;
        List<StudentProgress.RecentSession> recentSessions = new ArrayList<>();
        // Tổng hợp thông tin cho từng subject
        Map<String, Integer> subjectBestScores = new HashMap<>();
        Map<String, Integer> subjectSessionCounts = new HashMap<>();
        Map<String, Date> subjectLastPlayed = new HashMap<>();
        Date latestEndTime = null;

        for (GameSession session : completedSessions) {
            GameSession.Participant participant = session.getParticipants().stream()
                .filter(p -> p.getUserId().equals(studentId))
                .findFirst()
                .orElse(null);
            if (participant == null) continue;

            int score = participant.getTotalScore();
            totalScore += score;

            // Lấy subject từ game title
            String subject = "No Subject";
            if (session.getGameId() != null) {
                Games game = gameService.getGameById(session.getGameId());
                if (game != null && game.getTitle() != null) {
                    subject = game.getTitle();
                }
            }

            // Cập nhật bestScore cho từng subject
            subjectBestScores.put(subject, Math.max(subjectBestScores.getOrDefault(subject, 0), score));
            // Đếm số lần chơi từng subject
            subjectSessionCounts.put(subject, subjectSessionCounts.getOrDefault(subject, 0) + 1);
            // Cập nhật lastPlayed cho từng subject
            Date endTime = session.getEndTime();
            if (!subjectLastPlayed.containsKey(subject) || (endTime != null && endTime.after(subjectLastPlayed.get(subject)))) {
                subjectLastPlayed.put(subject, endTime);
            }

            if (latestEndTime == null || endTime.after(latestEndTime)) {
                latestEndTime = endTime;
            }

            // Build recentSession object
            StudentProgress.RecentSession recentSession = new StudentProgress.RecentSession();
            recentSession.setId(session.getId());
            recentSession.setGameId(session.getGameId());
            recentSession.setStartTime(session.getStartTime());
            recentSession.setEndTime(session.getEndTime());
            recentSession.setSubject(subject);
            List<StudentProgress.ParticipantSummary> participants = session.getParticipants().stream()
                .map(p -> {
                    StudentProgress.ParticipantSummary ps = new StudentProgress.ParticipantSummary();
                    ps.setUserId(p.getUserId());
                    ps.setTotalScore(p.getTotalScore());
                    return ps;
                })
                .collect(Collectors.toList());
            recentSession.setParticipants(participants);
            recentSessions.add(recentSession);
        }

        // Sort recent sessions by date (newest first) and take last 5
        recentSessions.sort((a, b) -> b.getEndTime().compareTo(a.getEndTime()));
        if (recentSessions.size() > 5) {
            recentSessions = recentSessions.subList(0, 5);
        }

        // Tạo danh sách subjectProgressList
        List<StudentProgress.SubjectProgress> subjectProgressList = new ArrayList<>();
        for (String subject : subjectBestScores.keySet()) {
            StudentProgress.SubjectProgress sp = new StudentProgress.SubjectProgress();
            sp.setSubject(subject);
            sp.setBestScore(subjectBestScores.get(subject));
            sp.setTotalSessions(subjectSessionCounts.get(subject));
            sp.setLastPlayed(subjectLastPlayed.get(subject));
            subjectProgressList.add(sp);
        }

        // Set all the data
        progress.setTotalScore(totalScore);
        progress.setRecentSessions(recentSessions);
        progress.setSubjectProgressList(subjectProgressList);

        // Clean up duplicate records
        cleanupDuplicateRecords(studentId, progress.getId());
        return studentProgressRepository.save(progress);
    }

    private void cleanupDuplicateRecords(String studentId, String currentProgressId) {
        logger.info("Cleaning up duplicate records for student: {}", studentId);
        try {
            // Get all progress records for the student
            List<StudentProgress> allProgress = studentProgressRepository.findAll().stream()
                .filter(progress -> progress.getStudentId().equals(studentId))
                .collect(Collectors.toList());
            
            // Delete all records except the current one
            for (StudentProgress progress : allProgress) {
                if (!progress.getId().equals(currentProgressId)) {
                    studentProgressRepository.deleteById(progress.getId());
                }
            }
            
            logger.info("Successfully cleaned up duplicate records for student: {}", studentId);
        } catch (Exception e) {
            logger.error("Error cleaning up duplicate records for student: {}", studentId, e);
        }
    }

    private StudentProgress createInitialProgress(String studentId) {
        logger.info("Creating initial progress for student: {}", studentId);
        
        // Get user's display name using email
        Optional<User> userOptional = userService.getUserByEmail(studentId);
        String displayName = userOptional.map(User::getDisplayName).orElse(null);
        
        StudentProgress progress = new StudentProgress();
        progress.setStudentId(studentId);
        progress.setDisplayName(displayName);
        progress.setTotalScore(0);
        progress.setTotalSessions(0);
        progress.setLastActivityDate(new Date());
        progress.setRecentSessions(new ArrayList<>());
        
        return studentProgressRepository.save(progress);
    }
} 