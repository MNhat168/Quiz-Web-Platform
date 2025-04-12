package com.QuizWeb.TheQuizWeb.Repository;


import com.QuizWeb.TheQuizWeb.Model.GameSession;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface GameSessionRepository extends MongoRepository<GameSession, String> {
    GameSession findByAccessCode(String accessCode);
}
