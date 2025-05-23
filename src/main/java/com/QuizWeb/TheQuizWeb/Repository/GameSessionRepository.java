package com.QuizWeb.TheQuizWeb.Repository;


import com.QuizWeb.TheQuizWeb.Model.GameSession;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameSessionRepository extends MongoRepository<GameSession, String> {
    Optional<GameSession> findByAccessCode(String accessCode);
    List<GameSession> findByClassId(String classId);
    List<GameSession> findByTeacherId(String teacherId);
    List<GameSession> findByClassIdAndStatus(String classId, GameSession.SessionStatus status);
    List<GameSession> findByParticipantsUserIdOrderByStartTimeDesc(String userId);
}