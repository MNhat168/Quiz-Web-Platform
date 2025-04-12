package com.QuizWeb.TheQuizWeb.Service;


import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Repository.GameSessionRepository;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.UUID;

@Service
public class SessionService {
    private final GameSessionRepository gameSessionRepository;
    private final UserRepository userRepository;
    private  SimpMessagingTemplate messagingTemplate;

    public SessionService(GameSessionRepository gameSessionRepository, UserRepository userRepository) {
        this.gameSessionRepository = gameSessionRepository;
        this.userRepository = userRepository;
    }

    public GameSession createSession(String teacherId) {
        GameSession session = new GameSession();
        session.setTeacherId(teacherId);
        session.setAccessCode(generateAccessCode());
        session.setStatus(GameSession.SessionStatus.LOBBY);
        session.setStartTime(new Date());
        session.setParticipants(new ArrayList<>()); // Initialize the list
        return gameSessionRepository.save(session);
    }

    public GameSession joinSession(String accessCode, String studentId) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode);
        User student = userRepository.findByEmail(studentId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (session.getStatus() != GameSession.SessionStatus.LOBBY) {
            throw new RuntimeException("Session not accepting participants");
        }
        if (session.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(studentId) && p.isActive())) {
            throw new RuntimeException("Student already in session");
        }

        GameSession.Participant participant = new GameSession.Participant();
        participant.setUserId(studentId);
        participant.setDisplayName(student.getDisplayName());
        participant.setJoinedAt(new Date());
        participant.setActive(true);

        session.getParticipants().add(participant);
        return gameSessionRepository.save(session);
    }

    public GameSession leaveSession(String accessCode, String studentId) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode);
        session.getParticipants().stream()
                .filter(p -> p.getUserId().equals(studentId))
                .findFirst()
                .ifPresent(p -> p.setActive(false));
        return gameSessionRepository.save(session);
    }

    public void notifyParticipantsUpdate(String accessCode) {
        messagingTemplate.convertAndSend(
                "/topic/session/" + accessCode + "/participants",
                gameSessionRepository.findByAccessCode(accessCode).getParticipants()
        );
    }
    private String generateAccessCode() {
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
