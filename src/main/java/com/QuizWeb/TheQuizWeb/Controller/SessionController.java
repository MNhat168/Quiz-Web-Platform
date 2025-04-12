package com.QuizWeb.TheQuizWeb.Controller;


import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Repository.GameSessionRepository;
import com.QuizWeb.TheQuizWeb.Service.SessionService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class SessionController {
    private final SessionService sessionService;
    private GameSessionRepository gameSessionRepository;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/create")
    public GameSession createSession(@RequestHeader("X-Teacher-Id") String teacherId) {
        return sessionService.createSession(teacherId);
    }

    @PostMapping("/join/{accessCode}")
    public GameSession joinSession(
            @PathVariable String accessCode,
            @RequestHeader("X-Student-Id") String studentId
    ) {
        return sessionService.joinSession(accessCode, studentId);
    }
    @PostMapping("/leave/{accessCode}")
    public GameSession leaveSession(
            @PathVariable String accessCode,
            @RequestHeader("X-Student-Id") String studentId
    ) {
        return sessionService.leaveSession(accessCode, studentId);
    }

    @MessageMapping("/heartbeat/{accessCode}")
    public void handleHeartbeat(
            @DestinationVariable String accessCode,
            @Payload String userId
    ) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode);
        session.getParticipants().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .ifPresent(p -> {
                    p.setLastActiveAt(new Date());
                    p.setActive(true);
                });
        gameSessionRepository.save(session);
    }

    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void cleanupInactiveParticipants() {
        gameSessionRepository.findAll().forEach(session -> {
            session.getParticipants().forEach(p -> {
                if (p.getLastActiveAt().before(new Date(System.currentTimeMillis() - 30000))) {
                    p.setActive(false);
                }
            });
            gameSessionRepository.save(session);
        });
    }
    @GetMapping("/{accessCode}/participants")
    public List<GameSession.Participant> getParticipants(@PathVariable String accessCode) {
        return gameSessionRepository.findByAccessCode(accessCode).getParticipants();
    }
}
