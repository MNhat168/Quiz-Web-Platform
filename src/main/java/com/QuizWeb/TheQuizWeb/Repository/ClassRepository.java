package com.QuizWeb.TheQuizWeb.Repository;

import com.QuizWeb.TheQuizWeb.Model.Class;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends MongoRepository<Class, String> {
    List<Class> findByTeacherId(String teacherId);
    List<Class> findByStudentIdsContains(String studentId);
    Optional<Class> findByClassCode(String classCode); // Add this new method
}