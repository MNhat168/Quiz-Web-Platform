package com.QuizWeb.TheQuizWeb.Controller;

import com.QuizWeb.TheQuizWeb.Model.Activity;
import com.QuizWeb.TheQuizWeb.Model.Activity.ActivityContent;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;
import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Service.ActivityService;
import com.QuizWeb.TheQuizWeb.Service.GameSessionService;
import com.QuizWeb.TheQuizWeb.Service.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    private static final Logger logger = LoggerFactory.getLogger(GameSessionController.class);

    @PostMapping("/create")
    public ResponseEntity<Map<String, String>> createSession(
            @RequestHeader("X-Teacher-Id") String teacherId,
            @RequestParam(value = "gameId", required = false) String gameId,
            @RequestParam(value = "classId", required = false) String classId) {
        Optional<User> teacherOpt = userRepository.findByEmail(teacherId);
        GameSession session = gameSessionService.createGameSession(teacherOpt.get().getId(), gameId, classId);

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

    @PostMapping("/{accessCode}/teams")
    public ResponseEntity<Map<String, Object>> createTeams(
            @PathVariable String accessCode,
            @RequestParam(defaultValue = "true") boolean autoAssign) {
        try {
            gameSessionService.createTeams(accessCode, autoAssign);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Teams created successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @PostMapping("/{accessCode}/teamchallenge/start/{activityId}")
    public ResponseEntity<Map<String, Object>> startTeamChallenge(
            @PathVariable String accessCode,
            @PathVariable String activityId) {
        try {
            GameSession session = gameSessionService.getSessionByAccessCode(accessCode);
            if (session == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "success", false,
                        "error", "Session not found"));
            }
            if (session.getTeams() == null || session.getTeams().isEmpty()) {
                gameSessionService.createTeams(accessCode, true);
            }
            Map<String, Object> roundInfo = gameSessionService.startTeamChallenge(accessCode, activityId);
            return ResponseEntity.ok(roundInfo);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @PostMapping("/{accessCode}/teamchallenge/guess")
    public ResponseEntity<Map<String, Object>> submitTeamGuess(
            @PathVariable String accessCode,
            @RequestBody Object rawRequestBody,
            @RequestHeader(value = "X-Student-Id", required = false) String studentId) {

        try {
            String teamId;
            String guess;

            if (rawRequestBody instanceof Map) {
                Map<String, Object> guessData = (Map<String, Object>) rawRequestBody;
                teamId = (String) guessData.get("teamId");
                guess = (String) guessData.get("guess");
            } else if (rawRequestBody instanceof String) {
                String jsonStr = (String) rawRequestBody;
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> guessData = mapper.readValue(jsonStr, new TypeReference<Map<String, Object>>() {
                });
                teamId = (String) guessData.get("teamId");
                guess = (String) guessData.get("guess");
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Unsupported request format"));
            }

            // Validate teamId and guess
            if (teamId == null || guess == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Missing teamId or guess"));
            }
            Map<String, Object> result = gameSessionService.submitTeamGuess(accessCode, teamId, guess);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    private String extractJsonValue(String jsonStr, String key) {
        String searchKey = "\"" + key + "\":\"";
        int startIndex = jsonStr.indexOf(searchKey);
        if (startIndex < 0) {
            searchKey = "\"" + key + "\":";
            startIndex = jsonStr.indexOf(searchKey);
            if (startIndex < 0) {
                return null;
            }
        }
        startIndex += searchKey.length();
        int endIndex;
        if (jsonStr.charAt(startIndex - 1) == '"') {
            endIndex = jsonStr.indexOf("\"", startIndex);
        } else {
            endIndex = Math.min(
                    jsonStr.indexOf(",", startIndex) != -1 ? jsonStr.indexOf(",", startIndex) : Integer.MAX_VALUE,
                    jsonStr.indexOf("}", startIndex) != -1 ? jsonStr.indexOf("}", startIndex) : Integer.MAX_VALUE);
            if (endIndex == Integer.MAX_VALUE) {
                endIndex = jsonStr.length() - 1;
            }
        }

        return jsonStr.substring(startIndex, endIndex);
    }

    @MessageMapping("/session/{accessCode}/teamchallenge/drawing/{teamId}")
    public void handleDrawingUpdates(
            @DestinationVariable String accessCode,
            @DestinationVariable String teamId,
            String updateJson) {
        try {
            // Parse the drawing update
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> update = mapper.readValue(updateJson, new TypeReference<Map<String, Object>>() {});
            String updateType = (String) update.get("type");
            Object data = update.get("data");
            
            if ("stroke".equals(updateType)) {
                // For individual strokes, just broadcast them immediately for low latency
                // Don't save to database for each stroke to reduce overhead
                messagingTemplate.convertAndSend(
                        "/topic/session/" + accessCode + "/teamchallenge/drawing/" + teamId,
                        updateJson);
                
                logger.debug("Stroke update broadcasted for team {} in session {}", teamId, accessCode);
            } else if ("full".equals(updateType)) {
                // For full path updates, save to database and broadcast
                gameSessionService.saveTeamDrawing(accessCode, teamId, data);
                
                // In this case, we want to broadcast the full paths
                messagingTemplate.convertAndSend(
                        "/topic/session/" + accessCode + "/teamchallenge/drawing/" + teamId,
                        updateJson);
                
                logger.info("Full drawing update processed for team {} in session {}", teamId, accessCode);
            } else {
                // Legacy support for old format (full paths directly)
                gameSessionService.saveTeamDrawing(accessCode, teamId, update);
                
                // Broadcast in the new format
                messagingTemplate.convertAndSend(
                        "/topic/session/" + accessCode + "/teamchallenge/drawing/" + teamId,
                        mapper.writeValueAsString(Map.of("type", "full", "data", update)));
                
                logger.info("Legacy drawing update processed for team {} in session {}", teamId, accessCode);
            }
        } catch (Exception e) {
            logger.error("Error processing drawing update", e);
        }
    }

    @MessageMapping("/session/{accessCode}/teamchallenge/request-drawing/{teamId}")
    public void handleDrawingRequest(
            @DestinationVariable String accessCode,
            @DestinationVariable String teamId,
            String userId) {
        try {
            Object paths = gameSessionService.getTeamDrawing(accessCode, teamId);

            // Send directly to the user who requested it
            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/drawing-init",
                    paths != null ? paths : new ArrayList<>());

            // Also broadcast to everyone (helps ensure drawer sees it too)
            messagingTemplate.convertAndSend(
                    "/topic/session/" + accessCode + "/teamchallenge/drawing/" + teamId,
                    paths != null ? paths : new ArrayList<>());

            logger.info("Drawing data sent to user {} for team {} in session {}",
                    userId, teamId, accessCode);
        } catch (Exception e) {
            logger.error("Error handling drawing request", e);
        }
    }

    @GetMapping("/{accessCode}/teamchallenge/drawing/{teamId}")
    public ResponseEntity<Object> getTeamDrawingREST(
            @PathVariable String accessCode,
            @PathVariable String teamId,
            Authentication authentication) {
        try {
            User user = userService.getCurrentUser(authentication);
            GameSession session = gameSessionService.getSessionByAccessCode(accessCode);

            if (session == null || !gameSessionService.isUserParticipant(session, user.getEmail())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not authorized"));
            }

            Object drawing = gameSessionService.getTeamDrawing(accessCode, teamId);
            if (drawing == null) {
                // Return empty array instead of null for better client handling
                return ResponseEntity.ok(new ArrayList<>());
            }

            // Also broadcast to everyone to keep things in sync
            messagingTemplate.convertAndSend(
                    "/topic/session/" + accessCode + "/teamchallenge/drawing/" + teamId,
                    drawing);

            return ResponseEntity.ok(drawing);
        } catch (Exception e) {
            logger.error("Error getting team drawing via REST", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{accessCode}/teamchallenge/save-drawing")
    public ResponseEntity<?> saveFinalDrawing(
            @PathVariable String accessCode,
            @RequestBody Map<String, Object> drawingData) {
        try {
            String teamId = drawingData.get("teamId").toString();
            Object paths = drawingData.get("paths");

            // Save and broadcast
            gameSessionService.saveTeamDrawing(accessCode, teamId, paths);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Drawing saved successfully"));
        } catch (Exception e) {
            logger.error("Error saving drawing", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()));
        }
    }

    @PostMapping("/{accessCode}/teamchallenge/switch-drawer")
    public ResponseEntity<Map<String, Object>> switchTeamDrawer(
            @PathVariable String accessCode,
            @RequestBody Map<String, String> drawerData) {
        try {
            String teamId = drawerData.get("teamId");
            String newDrawerId = drawerData.get("newDrawerId");

            if (teamId == null || newDrawerId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "success", false,
                        "error", "Team ID and new drawer ID are required"));
            }
            Map<String, Object> result = gameSessionService.switchTeamDrawer(accessCode, teamId, newDrawerId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @GetMapping("/{accessCode}/teamchallenge/status")
    public ResponseEntity<Map<String, Object>> getTeamChallengeStatus(
            @PathVariable String accessCode,
            Authentication authentication) {
        try {
            User user = userService.getCurrentUser(authentication);
            GameSession session = gameSessionService.getSessionByAccessCode(accessCode);
            if (session == null || !gameSessionService.isUserParticipant(session, user.getEmail())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "success", false,
                        "error", "Not authorized to access this session"));
            }
            Map<String, Object> status = gameSessionService.getTeamChallengeStatus(accessCode);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @GetMapping("/{accessCode}/teams")
    public ResponseEntity<?> getSessionTeams(
            @PathVariable String accessCode,
            Authentication authentication) {
        try {
            User user = userService.getCurrentUser(authentication);
            GameSession session = gameSessionService.getSessionByAccessCode(accessCode);
            if (session == null || !gameSessionService.isUserParticipant(session, user.getEmail())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "Not authorized to access this session"));
            }
            if (session.getTeams() == null) {
                return ResponseEntity.ok(Map.of("teams", new Object[0]));
            }
            return ResponseEntity.ok(Map.of("teams", session.getTeams()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getMessage()));
        }
    }
}