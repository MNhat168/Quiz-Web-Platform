package com.QuizWeb.TheQuizWeb.Controller;

import com.QuizWeb.TheQuizWeb.Model.Activity;
import com.QuizWeb.TheQuizWeb.Model.Activity.ActivityContent;
import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Service.ActivityService;
import com.QuizWeb.TheQuizWeb.Service.GameSessionService;
import com.QuizWeb.TheQuizWeb.Service.UserService;

import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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

    @Autowired
    private UserService userService;

    @Autowired
    private ActivityService activityService;

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

    @GetMapping("/{accessCode}/game")
    public ResponseEntity<Map<String, Object>> getGameContent(@PathVariable String accessCode) {
        Map<String, Object> gameContent = gameSessionService.getGameContent(accessCode);
        return ResponseEntity.ok(gameContent);
    }

    @PostMapping("/{accessCode}/submit")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @PathVariable String accessCode,
            @RequestHeader("X-Student-Id") String studentId,
            @RequestBody Map<String, Object> answerData) {

        Map<String, Object> result = gameSessionService.processStudentAnswer(
                accessCode,
                studentId,
                (String) answerData.get("activityId"),
                (String) answerData.get("contentId"), // Now passing contentId
                answerData.get("answer"));

        return ResponseEntity.ok(result);
    }

    @PostMapping("/{sessionId}/advance")
    public ResponseEntity<GameSession> advanceActivity(@PathVariable String sessionId) {
        GameSession session = gameSessionService.advanceActivity(sessionId);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/{accessCode}/activity/{activityId}/content/{contentIndex}")
    public ResponseEntity<Map<String, Object>> getActivityContent(
            @PathVariable String accessCode,
            @PathVariable String activityId,
            @PathVariable int contentIndex,
            Authentication authentication) {

        User user = userService.getCurrentUser(authentication);

        // Get the activity
        Activity activity = activityService.getActivityById(activityId);
        if (activity == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Activity not found"));
        }

        // Verify the session exists and user is a participant
        GameSession session = gameSessionService.getSessionByAccessCode(accessCode);
        if (session == null || !gameSessionService.isUserParticipant(session, user.getEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not authorized"));
        }

        // Check if the activity has multiple content items
        if (activity.getContentItems() == null || activity.getContentItems().isEmpty()) {
            // Return the legacy content
            return ResponseEntity.ok(Map.of("content", activity.getContent(), "isLegacy", true));
        }

        // Check if contentIndex is valid
        if (contentIndex < 0 || contentIndex >= activity.getContentItems().size()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid content index"));
        }

        // Get the specific content item
        ActivityContent contentItem = activity.getContentItems().get(contentIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("contentItem", contentItem);
        response.put("totalItems", activity.getContentItems().size());
        response.put("currentIndex", contentIndex);

        return ResponseEntity.ok(response);
    }

    // // Add to advance a specific activity's content
    // @PostMapping("/{accessCode}/activity/{activityId}/advance-content")
    // public ResponseEntity<Map<String, Object>> advanceActivityContent(
    //         @PathVariable String accessCode,
    //         @PathVariable String activityId,
    //         @RequestBody Map<String, Object> request,
    //         Authentication authentication) {

    //     User user = userService.getCurrentUser(authentication);
    //     Integer currentIndex = (Integer) request.get("currentContentIndex");

    //     // Get the activity and validate
    //     Activity activity = activityService.getActivityById(activityId);
    //     GameSession session = gameSessionService.getSessionByAccessCode(accessCode);

    //     if (activity == null || session == null || !gameSessionService.isUserParticipant(session, user.getEmail())) {
    //         return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not authorized"));
    //     }

    //     // If activity doesn't have multiple content items or we're at the last one
    //     if (activity.getContentItems() == null ||
    //             activity.getContentItems().isEmpty() ||
    //             currentIndex >= activity.getContentItems().size() - 1) {

    //         // We're done with this activity, time to advance to the next one
    //         gameSessionService.advanceActivity(session.getId());
    //         return ResponseEntity.ok(Map.of("status", "advanced_activity"));
    //     }

    //     // Otherwise, advance to the next content item
    //     int nextIndex = currentIndex + 1;
    //     ActivityContent nextContent = activity.getContentItems().get(nextIndex);

    //     Map<String, Object> response = new HashMap<>();
    //     response.put("contentItem", nextContent);
    //     response.put("totalItems", activity.getContentItems().size());
    //     response.put("currentIndex", nextIndex);
    //     response.put("status", "advanced_content");

    //     return ResponseEntity.ok(response);
    // }

    @PostMapping("/{accessCode}/activity/{activityId}/advance-content")
    public ResponseEntity<Map<String, Object>> advanceActivityContent(
            @PathVariable String accessCode,
            @PathVariable String activityId,
            Authentication authentication) {

        User user = userService.getCurrentUser(authentication);
        GameSession session = gameSessionService.getSessionByAccessCode(accessCode);

        if (session == null || !gameSessionService.isUserParticipant(session, user.getEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not authorized"));
        }

        Map<String, Object> result = gameSessionService.advanceContentForActivity(session.getId(), activityId);
        return ResponseEntity.ok(result);
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