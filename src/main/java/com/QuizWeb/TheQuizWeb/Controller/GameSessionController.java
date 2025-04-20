package com.QuizWeb.TheQuizWeb.Controller;

import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Service.GameSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class GameSessionController {

    @Autowired
    private GameSessionService gameSessionService;

    @PostMapping("/create")
    public ResponseEntity<Map<String, String>> createSession(
            @RequestHeader("X-Teacher-Id") String teacherId,
            @RequestParam(value = "gameId", required = false) String gameId,
            @RequestParam(value = "classId", required = false) String classId) {
        
        GameSession session = gameSessionService.createGameSession(teacherId, gameId, classId);
        
        Map<String, String> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("accessCode", session.getAccessCode());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/start/{sessionId}")
    public ResponseEntity<GameSession> startSession(@PathVariable String sessionId) {
        GameSession session = gameSessionService.startGameSession(sessionId);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/end/{sessionId}")
    public ResponseEntity<GameSession> endSession(@PathVariable String sessionId) {
        GameSession session = gameSessionService.endGameSession(sessionId);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/join/{accessCode}")
    public ResponseEntity<Map<String, Object>> joinSession(
            @PathVariable String accessCode,
            @RequestHeader("X-Student-Id") String studentId) {
        
        GameSession.Participant participant = gameSessionService.joinGameSession(accessCode, studentId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("participant", participant);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/leave/{accessCode}")
    public ResponseEntity<Map<String, Object>> leaveSession(
            @PathVariable String accessCode,
            @RequestHeader("X-Student-Id") String studentId) {
        
        gameSessionService.leaveGameSession(accessCode, studentId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{accessCode}")
    public ResponseEntity<GameSession> getSessionByAccessCode(@PathVariable String accessCode) {
        GameSession session = gameSessionService.getSessionByAccessCode(accessCode);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/{accessCode}/participants")
    public ResponseEntity<List<Map<String, Object>>> getSessionParticipants(@PathVariable String accessCode) {
        List<Map<String, Object>> participants = gameSessionService.getSessionParticipants(accessCode);
        return ResponseEntity.ok(participants);
    }

    @MessageMapping("/heartbeat/{accessCode}")
    public void processHeartbeat(@DestinationVariable String accessCode, String studentId) {
        gameSessionService.updateParticipantStatus(accessCode, studentId);
    }
}