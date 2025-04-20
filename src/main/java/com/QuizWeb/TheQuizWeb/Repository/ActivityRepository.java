package com.QuizWeb.TheQuizWeb.Repository;

import com.QuizWeb.TheQuizWeb.Model.Activity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends MongoRepository<Activity, String> {
    List<Activity> findByCreatorId(String creatorId);
    List<Activity> findByIsPublic(boolean isPublic);
    List<Activity> findBySubject(String subject);
    List<Activity> findByGradeLevel(String gradeLevel);
    List<Activity> findByType(Activity.ActivityType type);
}