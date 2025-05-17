package com.QuizWeb.TheQuizWeb.Repository;

import com.QuizWeb.TheQuizWeb.Model.StudentProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentProgressRepository extends MongoRepository<StudentProgress, String> {
    // Basic repository methods will be inherited from MongoRepository
} 