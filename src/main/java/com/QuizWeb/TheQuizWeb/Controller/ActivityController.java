package com.QuizWeb.TheQuizWeb.Controller;

import com.QuizWeb.TheQuizWeb.Model.Activity;
import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Model.Games;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Service.ActivityService;
import com.QuizWeb.TheQuizWeb.Service.GameService;
import com.QuizWeb.TheQuizWeb.Service.GameSessionService;
import com.QuizWeb.TheQuizWeb.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @Autowired
    private GameService gameService;

    @Autowired
    private UserService userService;

    @Autowired
    private GameSessionService gameSessionService;

    /**
     * Get all activities created by the authenticated teacher
     */
    @GetMapping("/teacher")
    public ResponseEntity<?> getTeacherActivities(Authentication authentication) {
        User teacher = userService.getCurrentUser(authentication);

        // Verify user is a teacher
        if (teacher.getRole() != User.UserRole.TEACHER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only teachers can access this endpoint");
        }

        List<Activity> activities = activityService.getActivitiesByCreatorId(teacher.getId());
        return ResponseEntity.ok(activities);
    }

    /**
     * Get details for a specific activity
     */
    @GetMapping("/{activityId}")
    public ResponseEntity<?> getActivityDetails(@PathVariable String activityId, Authentication authentication) {
        User user = userService.getCurrentUser(authentication);

        Activity activity = activityService.getActivityById(activityId);
        if (activity == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Activity not found");
        }

        // If not the creator, check if the activity is public
        if (!activity.getCreatorId().equals(user.getId()) && !activity.isPublic()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have access to this activity");
        }

        return ResponseEntity.ok(activity);
    }

    /**
     * Create a new activity
     */
    @PostMapping
    public ResponseEntity<?> createActivity(@RequestBody Activity activity, Authentication authentication) {
        User teacher = userService.getCurrentUser(authentication);

        // Verify user is a teacher
        if (teacher.getRole() != User.UserRole.TEACHER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only teachers can create activities");
        }

        // Set creator ID and timestamps
        activity.setCreatorId(teacher.getId());
        activity.setCreatedAt(new Date());

        // Save the activity
        Activity savedActivity = activityService.createActivity(activity);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedActivity);
    }

    /**
     * Update an existing activity
     */
    @PutMapping("/{activityId}")
    public ResponseEntity<?> updateActivity(@PathVariable String activityId, @RequestBody Activity activity,
            Authentication authentication) {
        User teacher = userService.getCurrentUser(authentication);

        Activity existingActivity = activityService.getActivityById(activityId);
        if (existingActivity == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Activity not found");
        }

        // Check if the user is the creator of the activity
        if (!existingActivity.getCreatorId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You don't have permission to update this activity");
        }

        // Update activity
        activity.setId(activityId);
        activity.setCreatorId(teacher.getId());
        activity.setCreatedAt(existingActivity.getCreatedAt());

        Activity updatedActivity = activityService.updateActivity(activity);

        return ResponseEntity.ok(updatedActivity);
    }

    /**
     * Delete an activity
     */
    @DeleteMapping("/{activityId}")
    public ResponseEntity<?> deleteActivity(@PathVariable String activityId, Authentication authentication) {
        User teacher = userService.getCurrentUser(authentication);

        Activity existingActivity = activityService.getActivityById(activityId);
        if (existingActivity == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Activity not found");
        }

        // Check if the user is the creator of the activity
        if (!existingActivity.getCreatorId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You don't have permission to delete this activity");
        }

        activityService.deleteActivity(activityId);

        return ResponseEntity.ok().body("Activity deleted successfully");
    }

    /**
     * Add activity to game
     */
    @PostMapping("/{activityId}/games/{gameId}")
    public ResponseEntity<?> addActivityToGame(
            @PathVariable String activityId,
            @PathVariable String gameId,
            @RequestBody Games.GameActivity gameActivity,
            Authentication authentication) {

        User teacher = userService.getCurrentUser(authentication);

        // Get the game and activity
        Games game = gameService.getGameById(gameId);
        Activity activity = activityService.getActivityById(activityId);

        if (game == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Game not found");
        }

        if (activity == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Activity not found");
        }

        // Verify the teacher is the creator of the game
        if (!game.getCreatorId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have permission to modify this game");
        }

        if (!activity.getCreatorId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only add your own activities to the game");
        }

        // Set the activity ID and type
        gameActivity.setActivityId(activityId);
        gameActivity.setActivityType(activity.getType());

        // Add the activity to the game
        List<Games.GameActivity> activities = game.getActivities();
        if (activities == null) {
            activities = new ArrayList<>();
            game.setActivities(activities);
        }

        // Add the activity
        activities.add(gameActivity);

        // Update the game
        game.setUpdatedAt(new Date());
        Games updatedGame = gameService.updateGame(game);

        return ResponseEntity.ok(updatedGame);
    }

    /**
     * Remove activity from game
     */
    @DeleteMapping("/{activityId}/games/{gameId}")
    public ResponseEntity<?> removeActivityFromGame(
            @PathVariable String activityId,
            @PathVariable String gameId,
            Authentication authentication) {

        User teacher = userService.getCurrentUser(authentication);

        // Get the game
        Games game = gameService.getGameById(gameId);

        if (game == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Game not found");
        }

        // Verify the teacher is the creator of the game
        if (!game.getCreatorId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have permission to modify this game");
        }

        // Remove the activity from the game
        List<Games.GameActivity> activities = game.getActivities();
        boolean removed = false;
        if (activities != null) {
            removed = activities.removeIf(activity -> activity.getActivityId().equals(activityId));
        }

        if (!removed) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Activity not found in game");
        }

        // Update the game
        game.setUpdatedAt(new Date());
        Games updatedGame = gameService.updateGame(game); // Make sure this saves the activities list

        return ResponseEntity.ok(updatedGame); // Return the updated game object
    }

    /**
     * Update activity order in game
     */
    @PutMapping("/games/{gameId}/reorder")
    public ResponseEntity<?> reorderActivities(
            @PathVariable String gameId,
            @RequestBody List<Games.GameActivity> activities,
            Authentication authentication) {

        User teacher = userService.getCurrentUser(authentication);

        // Get the game
        Games game = gameService.getGameById(gameId);

        if (game == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Game not found");
        }

        // Verify the teacher is the creator of the game
        if (!game.getCreatorId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have permission to modify this game");
        }

        // Update the activities
        game.setActivities(activities);
        game.setUpdatedAt(new Date());

        Games updatedGame = gameService.updateGame(game);

        return ResponseEntity.ok(updatedGame);
    }

    @GetMapping("/session/{accessCode}/activity/{activityId}")
    public ResponseEntity<?> getActivityForSession(
            @PathVariable String accessCode,
            @PathVariable String activityId,
            Authentication authentication) {

        User student = userService.getCurrentUser(authentication);

        // Get the session
        GameSession session = gameSessionService.getSessionByAccessCode(accessCode);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Session not found");
        }

        // Verify the student is a participant in this session
        boolean isParticipant = session.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(student.getEmail()));

        if (!isParticipant) {
            System.out.println("Participant bug");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not a participant in this session");
        }

        // Get the activity
        Activity activity = activityService.getActivityById(activityId);
        if (activity == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Activity not found");
        }

        // Check if the activity is part of the current game
        Games game = gameService.getGameById(session.getGameId());
        boolean activityInGame = game.getActivities().stream()
                .anyMatch(a -> a.getActivityId().equals(activityId));

        if (!activityInGame) {
            System.out.println("Activity not belong");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Activity not part of this game session");
        }

        return ResponseEntity.ok(activity);
    }

    @GetMapping("/types")
    public ResponseEntity<?> getActivityTypes() {
        return ResponseEntity.ok(Activity.ActivityType.values());
    }
}