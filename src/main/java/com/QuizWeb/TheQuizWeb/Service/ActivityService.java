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

    public List<Activity> getActivitiesByCreatorId(String creatorId) {
        return activityRepository.findByCreatorId(creatorId);
    }

    public Activity getActivityById(String activityId) {
        return activityRepository.findById(activityId).orElse(null);
    }

    public Activity createActivity(Activity activity) {
        return activityRepository.save(activity);
    }

    public Activity updateActivity(Activity activity) {
        return activityRepository.save(activity);
    }

    public void deleteActivity(String activityId) {
        activityRepository.deleteById(activityId);
    }
}