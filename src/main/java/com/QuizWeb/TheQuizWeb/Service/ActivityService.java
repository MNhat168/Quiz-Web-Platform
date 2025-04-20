package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.Activity;
import com.QuizWeb.TheQuizWeb.Repository.ActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    /**
     * Get activities created by a specific teacher
     */
    public List<Activity> getActivitiesByCreatorId(String creatorId) {
        return activityRepository.findByCreatorId(creatorId);
    }

    /**
     * Get activity by ID
     */
    public Activity getActivityById(String activityId) {
        return activityRepository.findById(activityId).orElse(null);
    }

    /**
     * Create a new activity
     */
    public Activity createActivity(Activity activity) {
        return activityRepository.save(activity);
    }

    /**
     * Update an existing activity
     */
    public Activity updateActivity(Activity activity) {
        return activityRepository.save(activity);
    }

    /**
     * Delete an activity
     */
    public void deleteActivity(String activityId) {
        activityRepository.deleteById(activityId);
    }
}