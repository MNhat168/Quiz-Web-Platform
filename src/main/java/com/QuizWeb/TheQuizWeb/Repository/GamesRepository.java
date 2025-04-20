package com.QuizWeb.TheQuizWeb.Repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.QuizWeb.TheQuizWeb.Model.Games;

@Repository
public interface GamesRepository extends MongoRepository<Games, String> {
    List<Games> findByCreatorId(String creatorId);
    List<Games> findByAssignedClassIdsContaining(String classId);
}