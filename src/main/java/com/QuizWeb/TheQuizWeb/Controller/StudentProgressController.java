package com.QuizWeb.TheQuizWeb.Controller;

import com.QuizWeb.TheQuizWeb.Model.StudentProgress;
import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Service.StudentProgressService;
import com.QuizWeb.TheQuizWeb.Service.GameSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student-progress")
@CrossOrigin(origins = "https://quiz-fe-q6sx.vercel.app", allowCredentials = "true")
public class StudentProgressController {
    private static final Logger logger = LoggerFactory.getLogger(StudentProgressController.class);

    @Autowired
    private StudentProgressService studentProgressService;

    @Autowired
    private GameSessionService gameSessionService;

    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        logger.debug("Authentication object: {}", authentication);
        
        if (authentication == null) {
            logger.warn("No authentication found in SecurityContext");
            return null;
        }
        
        if (!authentication.isAuthenticated()) {
            logger.warn("User is not authenticated");
            return null;
        }
        
        String email = authentication.getName();
        logger.debug("Current user email: {}", email);
        return email;
    }

    private ResponseEntity<?> handleUnauthorizedAccess(String currentUserEmail, String requestedStudentId) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "Access denied");
        errorResponse.put("message", "You are not authorized to access this resource");
        errorResponse.put("currentUser", currentUserEmail);
        errorResponse.put("requestedUser", requestedStudentId);
        
        logger.warn("Access denied: User {} attempted to access data for {}", currentUserEmail, requestedStudentId);
        return ResponseEntity.status(403).body(errorResponse);
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<?> getStudentProgress(@PathVariable String studentId) {
        String currentUserEmail = getCurrentUserEmail();
        logger.info("Getting progress for student: {} (Current user: {})", studentId, currentUserEmail);

        if (currentUserEmail == null) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", "No authenticated user found"
            ));
        }

        if (!studentId.equals(currentUserEmail)) {
            return handleUnauthorizedAccess(currentUserEmail, studentId);
        }

        try {
            StudentProgress progress = studentProgressService.getStudentProgress(studentId);
            if (progress == null) {
                logger.info("No progress found for student: {}", studentId);
                return ResponseEntity.ok(new StudentProgress()); // Return empty progress instead of null
            }
            
            // Log the response structure for debugging
            logger.debug("Returning progress data: totalScore={}, totalSessions={}, recentSessions={}, subjectProgressList={}",
                progress.getTotalScore(),
                progress.getTotalSessions(),
                progress.getRecentSessions() != null ? progress.getRecentSessions().size() : 0,
                progress.getSubjectProgressList() != null ? progress.getSubjectProgressList().size() : 0
            );
            
            // Log details of recent sessions
            if (progress.getRecentSessions() != null) {
                progress.getRecentSessions().forEach(session -> 
                    logger.debug("Recent session: id={}, subject={}, participants={}",
                        session.getId(),
                        session.getSubject(),
                        session.getParticipants() != null ? session.getParticipants().size() : 0
                    )
                );
            }
            
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            logger.error("Error getting student progress", e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal server error",
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{studentId}/update")
    public ResponseEntity<?> updateStudentProgress(@PathVariable String studentId) {
        String currentUserEmail = getCurrentUserEmail();
        logger.info("Updating progress for student: {} (Current user: {})", studentId, currentUserEmail);

        if (currentUserEmail == null) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", "No authenticated user found"
            ));
        }

        if (!studentId.equals(currentUserEmail)) {
            return handleUnauthorizedAccess(currentUserEmail, studentId);
        }
        
        try {
            List<GameSession> sessions = gameSessionService.getRecentSessionsByStudentId(studentId);
            logger.debug("Found {} recent sessions for student {}", sessions.size(), studentId);
            
            // Log session details before update
            sessions.forEach(session -> 
                logger.debug("Processing session: id={}, status={}, completedActivities={}",
                    session.getId(),
                    session.getStatus(),
                    session.getCompletedActivities() != null ? session.getCompletedActivities().size() : 0
                )
            );
            
            StudentProgress updatedProgress = studentProgressService.updateProgress(studentId, sessions);
            
            // Log the updated progress structure
            logger.debug("Updated progress data: totalScore={}, totalSessions={}, recentSessions={}, subjectProgressList={}",
                updatedProgress.getTotalScore(),
                updatedProgress.getTotalSessions(),
                updatedProgress.getRecentSessions() != null ? updatedProgress.getRecentSessions().size() : 0,
                updatedProgress.getSubjectProgressList() != null ? updatedProgress.getSubjectProgressList().size() : 0
            );
            
            // Log details of updated recent sessions
            if (updatedProgress.getRecentSessions() != null) {
                updatedProgress.getRecentSessions().forEach(session -> 
                    logger.debug("Updated session: id={}, subject={}, participants={}",
                        session.getId(),
                        session.getSubject(),
                        session.getParticipants() != null ? session.getParticipants().size() : 0
                    )
                );
            }
            
            return ResponseEntity.ok(updatedProgress);
        } catch (Exception e) {
            logger.error("Error updating student progress", e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal server error",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/{studentId}/learning-profile")
    public ResponseEntity<?> getLearningProfile(@PathVariable String studentId) {
        String currentUserEmail = getCurrentUserEmail();
        logger.info("Getting learning profile for student: {} (Current user: {})", studentId, currentUserEmail);

        if (currentUserEmail == null) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", "No authenticated user found"
            ));
        }

        if (!studentId.equals(currentUserEmail)) {
            return handleUnauthorizedAccess(currentUserEmail, studentId);
        }
        try {
            StudentProgress progress = studentProgressService.getStudentProgress(studentId);
            if (progress == null || progress.getSubjectProgressList() == null) {
                logger.info("No subject progress found for student: {}", studentId);
                return ResponseEntity.ok(Collections.emptyList());
            }
            // Log the subject progress data
            logger.debug("Returning subject progress list: size={}", progress.getSubjectProgressList().size());
            return ResponseEntity.ok(progress.getSubjectProgressList());
        } catch (Exception e) {
            logger.error("Error getting subject progress list", e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal server error",
                "message", e.getMessage()
            ));
        }
    }
} 