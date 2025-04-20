package com.QuizWeb.TheQuizWeb.Controller;

import com.QuizWeb.TheQuizWeb.Model.Games;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Service.GameService;
import com.QuizWeb.TheQuizWeb.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class GameController {

    @Autowired
    private GameService gameService;

    @Autowired
    private UserService userService;

    /**
     * Get all games created by the authenticated teacher
     */
    @GetMapping("/teacher")
    public ResponseEntity<?> getTeacherGames(Authentication authentication) {
        User teacher = userService.getCurrentUser(authentication);

        // Verify user is a teacher
        if (teacher.getRole() != User.UserRole.TEACHER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only teachers can access this endpoint");
        }

        List<Games> games = gameService.getGamesByTeacherId(teacher.getId());
        return ResponseEntity.ok(games);
    }

    /**
     * Get details for a specific game
     */
    @GetMapping("/{gameId}")
    public ResponseEntity<?> getGameDetails(@PathVariable String gameId, Authentication authentication) {
        User user = userService.getCurrentUser(authentication);

        Games gameDetails = gameService.getGameById(gameId);
        if (gameDetails == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Game not found");
        }

        // If not the creator, check if the game is published or the user has access to it
        if (!gameDetails.getCreatorId().equals(user.getId()) && 
            !gameDetails.isPublic() && 
            !gameService.userHasAccessToGame(user.getId(), gameId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have access to this game");
        }

        return ResponseEntity.ok(gameDetails);
    }

    /**
     * Create a new game
     */
    @PostMapping
    public ResponseEntity<?> createGame(@RequestBody Games game, Authentication authentication) {
        User teacher = userService.getCurrentUser(authentication);
        
        // Verify user is a teacher
        if (teacher.getRole() != User.UserRole.TEACHER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only teachers can create games");
        }
        
        // Set creator ID and timestamps
        game.setCreatorId(teacher.getId());
        Date now = new Date();
        game.setCreatedAt(now);
        game.setUpdatedAt(now);
        
        // Save the game
        Games savedGame = gameService.createGame(game);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(savedGame);
    }

    /**
     * Update an existing game
     */
    @PutMapping("/{gameId}")
    public ResponseEntity<?> updateGame(@PathVariable String gameId, @RequestBody Games game, Authentication authentication) {
        User teacher = userService.getCurrentUser(authentication);
        
        Games existingGame = gameService.getGameById(gameId);
        if (existingGame == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Game not found");
        }
        
        // Check if the user is the creator of the game
        if (!existingGame.getCreatorId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have permission to update this game");
        }
        
        // Update game
        game.setId(gameId);
        game.setCreatorId(teacher.getId());
        game.setCreatedAt(existingGame.getCreatedAt());
        game.setUpdatedAt(new Date());
        
        Games updatedGame = gameService.updateGame(game);
        
        return ResponseEntity.ok(updatedGame);
    }

    /**
     * Delete a game
     */
    @DeleteMapping("/{gameId}")
    public ResponseEntity<?> deleteGame(@PathVariable String gameId, Authentication authentication) {
        User teacher = userService.getCurrentUser(authentication);
        
        Games existingGame = gameService.getGameById(gameId);
        if (existingGame == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Game not found");
        }
        
        // Check if the user is the creator of the game
        if (!existingGame.getCreatorId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have permission to delete this game");
        }
        
        gameService.deleteGame(gameId);
        
        return ResponseEntity.ok().body("Game deleted successfully");
    }
}