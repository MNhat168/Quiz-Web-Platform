package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.Games;
import com.QuizWeb.TheQuizWeb.Repository.GamesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GameService {

    @Autowired
    private GamesRepository gameRepository;

    /**
     * Get games created by a specific teacher
     */
    public List<Games> getGamesByTeacherId(String teacherId) {
        return gameRepository.findByCreatorId(teacherId);
    }

    /**
     * Get game by ID
     */
    public Games getGameById(String gameId) {
        return gameRepository.findById(gameId).orElse(null);
    }

    /**
     * Check if user has access to a game (e.g., through class assignment or sharing)
     */
    public boolean userHasAccessToGame(String userId, String gameId) {
        // Add your logic here to check if user has access to the game
        // For example, check if the game is assigned to a class the user belongs to
        return false; // Placeholder
    }

    /**
     * Create a new game
     */
    public Games createGame(Games game) {
        return gameRepository.save(game);
    }

    /**
     * Update an existing game
     */
    public Games updateGame(Games game) {
        return gameRepository.save(game);
    }

    /**
     * Delete a game
     */
    public void deleteGame(String gameId) {
        gameRepository.deleteById(gameId);
    }
}