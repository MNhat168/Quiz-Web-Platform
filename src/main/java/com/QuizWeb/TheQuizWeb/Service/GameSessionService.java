package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.SessionSettings;
import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Repository.GameSessionRepository;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GameSessionService {

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Generate a random 6-character access code
    private String generateAccessCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }
        return code.toString();
    }

    // Create a new game session
    public GameSession createGameSession(String teacherId, String gameId, String classId) {
        GameSession session = new GameSession();
        session.setGameId(gameId);
        session.setClassId(classId);
        session.setTeacherId(teacherId);
        session.setAccessCode(generateAccessCode());
        session.setStatus(GameSession.SessionStatus.LOBBY);
        session.setStartTime(new Date());
        session.setParticipants(new ArrayList<>());
        session.setTeams(new ArrayList<>());
        session.setCurrentActivityIndex(0);
        session.setPowerUpEvents(new ArrayList<>());
        
        // Set default session settings
        SessionSettings settings = new SessionSettings();
        settings.setAllowLateJoin(true);
        settings.setShowLeaderboard(true);
        settings.setShowCorrectAnswers(true);
        settings.setAutoAdvance(false);
        session.setSettings(settings);
        
        // Initialize session statistics
        GameSession.SessionStatistics stats = new GameSession.SessionStatistics();
        stats.setTotalParticipants(0);
        stats.setActiveParticipants(0);
        stats.setParticipantScores(new HashMap<>());
        stats.setActivityPerformance(new HashMap<>());
        stats.setOverallCompletionPercentage(0.0);
        stats.setOverallCorrectAnswerPercentage(0.0);
        stats.setStrugglingStudents(new HashMap<>());
        session.setStatistics(stats);
        
        return gameSessionRepository.save(session);
    }

    // Start a game session
    public GameSession startGameSession(String sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        session.setStatus(GameSession.SessionStatus.ACTIVE);
        
        GameSession updatedSession = gameSessionRepository.save(session);
        
        // Notify all participants that the game has started
        messagingTemplate.convertAndSend(
                "/topic/session/" + session.getAccessCode() + "/status", 
                "ACTIVE"
        );
        
        return updatedSession;
    }

    // End a game session
    public GameSession endGameSession(String sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        session.setStatus(GameSession.SessionStatus.COMPLETED);
        session.setEndTime(new Date());
        
        GameSession updatedSession = gameSessionRepository.save(session);
        
        // Notify all participants that the game has ended
        messagingTemplate.convertAndSend(
                "/topic/session/" + session.getAccessCode() + "/status", 
                "COMPLETED"
        );
        
        return updatedSession;
    }

    // Join a game session
    public GameSession.Participant joinGameSession(String accessCode, String studentId) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        if (session.getStatus() == GameSession.SessionStatus.COMPLETED) {
            throw new RuntimeException("This session has ended");
        }
        
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        // Check if student is already in the session
        Optional<GameSession.Participant> existingParticipant = session.getParticipants().stream()
                .filter(p -> p.getUserId().equals(studentId))
                .findFirst();
        
        GameSession.Participant participant;
        
        if (existingParticipant.isPresent()) {
            participant = existingParticipant.get();
            participant.setActive(true);
            participant.setLastActiveAt(new Date());
        } else {
            participant = new GameSession.Participant();
            participant.setUserId(studentId);
            participant.setDisplayName(student.getDisplayName());
            participant.setAvatarUrl(student.getAvatarUrl());
            participant.setTotalScore(0);
            participant.setPowerUps(new ArrayList<>());
            participant.setActive(true);
            participant.setJoinedAt(new Date());
            participant.setLastActiveAt(new Date());
            participant.setActivityScores(new HashMap<>());
            
            session.getParticipants().add(participant);
            
            // Update session statistics
            GameSession.SessionStatistics stats = session.getStatistics();
            stats.setTotalParticipants(stats.getTotalParticipants() + 1);
            stats.setActiveParticipants(stats.getActiveParticipants() + 1);
            stats.getParticipantScores().put(studentId, 0);
        }
        
        gameSessionRepository.save(session);
        
        // Send updated participants list to all connected clients
        List<Map<String, Object>> participantsList = session.getParticipants().stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId", p.getUserId());
                    map.put("displayName", p.getDisplayName());
                    map.put("avatarUrl", p.getAvatarUrl());
                    map.put("active", p.isActive());
                    map.put("totalScore", p.getTotalScore());
                    return map;
                })
                .collect(Collectors.toList());
        
        messagingTemplate.convertAndSend(
                "/topic/session/" + accessCode + "/participants",
                participantsList
        );
        
        return participant;
    }

    // Leave a game session
    public void leaveGameSession(String accessCode, String studentId) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        Optional<GameSession.Participant> participant = session.getParticipants().stream()
                .filter(p -> p.getUserId().equals(studentId))
                .findFirst();
        
        if (participant.isPresent()) {
            participant.get().setActive(false);
            participant.get().setLastActiveAt(new Date());
            
            // Update session statistics
            GameSession.SessionStatistics stats = session.getStatistics();
            stats.setActiveParticipants(stats.getActiveParticipants() - 1);
            
            gameSessionRepository.save(session);
            
            // Send updated participants list to all connected clients
            List<Map<String, Object>> participantsList = session.getParticipants().stream()
                    .map(p -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("userId", p.getUserId());
                        map.put("displayName", p.getDisplayName());
                        map.put("avatarUrl", p.getAvatarUrl());
                        map.put("active", p.isActive());
                        map.put("totalScore", p.getTotalScore());
                        return map;
                    })
                    .collect(Collectors.toList());
            
            messagingTemplate.convertAndSend(
                    "/topic/session/" + accessCode + "/participants",
                    participantsList
            );
        }
    }

    // Update participant's activity status (for heartbeat)
    public void updateParticipantStatus(String accessCode, String studentId) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        Optional<GameSession.Participant> participant = session.getParticipants().stream()
                .filter(p -> p.getUserId().equals(studentId))
                .findFirst();
        
        if (participant.isPresent()) {
            participant.get().setLastActiveAt(new Date());
            participant.get().setActive(true);
            gameSessionRepository.save(session);
        }
    }

    // Get participants in a game session
    public List<Map<String, Object>> getSessionParticipants(String accessCode) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        return session.getParticipants().stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId", p.getUserId());
                    map.put("displayName", p.getDisplayName());
                    map.put("avatarUrl", p.getAvatarUrl());
                    map.put("active", p.isActive());
                    map.put("totalScore", p.getTotalScore());
                    return map;
                })
                .collect(Collectors.toList());
    }

    // Get a game session by access code
    public GameSession getSessionByAccessCode(String accessCode) {
        return gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }
}