package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.SessionSettings;
import com.QuizWeb.TheQuizWeb.Model.Activity;
import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Model.GameSession.Team;
import com.QuizWeb.TheQuizWeb.Model.Games;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Repository.ActivityRepository;
import com.QuizWeb.TheQuizWeb.Repository.GameSessionRepository;
import com.QuizWeb.TheQuizWeb.Repository.GamesRepository;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class GameSessionService {

    @Autowired
    public GameSessionRepository gameSessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private GamesRepository gamesRepository;

    @Autowired
    private ActivityRepository activityRepository;

    private String generateAccessCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }
        return code.toString();
    }

    public GameSession createGameSession(String teacherId, String gameId, String classId) {
        GameSession session = new GameSession();
        session.setGameId(gameId);
        session.setClassId(classId);
        session.setTeacherId(teacherId);
        session.setAccessCode(generateAccessCode());
        session.setStatus(GameSession.SessionStatus.LOBBY);
        session.setStartTime(new Date());
        session.setParticipants(new ArrayList<>());
        session.setTeams(new ArrayList<>());
        session.setCurrentActivityIndex(0);
        session.setPowerUpEvents(new ArrayList<>());

        SessionSettings settings = new SessionSettings();
        settings.setAllowLateJoin(true);
        settings.setShowLeaderboard(true);
        settings.setShowCorrectAnswers(true);
        settings.setAutoAdvance(false);
        session.setSettings(settings);

        GameSession.SessionStatistics stats = new GameSession.SessionStatistics();
        stats.setTotalParticipants(0);
        stats.setActiveParticipants(0);
        stats.setParticipantScores(new HashMap<>());
        stats.setActivityPerformance(new HashMap<>());
        stats.setOverallCompletionPercentage(0.0);
        stats.setOverallCorrectAnswerPercentage(0.0);
        stats.setStrugglingStudents(new HashMap<>());
        session.setStatistics(stats);

        return gameSessionRepository.save(session);
    }

    public GameSession endGameSession(String sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getCurrentActivity() != null) {
            session.getCurrentActivity().setEndTime(new Date());
            session.getCurrentActivity().setStatus(GameSession.ActivityStatus.COMPLETED);
            if (session.getCompletedActivities() == null) {
                session.setCompletedActivities(new ArrayList<>());
            }
            session.getCompletedActivities().add(session.getCurrentActivity());
            session.setCurrentActivity(null);
        }
        session.setStatus(GameSession.SessionStatus.COMPLETED);
        session.setEndTime(new Date());

        GameSession updatedSession = gameSessionRepository.save(session);

        // Send final leaderboard update
        sendLeaderboardUpdate(session);

        messagingTemplate.convertAndSend(
                "/topic/session/" + session.getAccessCode() + "/status",
                "COMPLETED");

        return updatedSession;
    }

    public GameSession.Participant joinGameSession(String accessCode, String studentId) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() == GameSession.SessionStatus.COMPLETED) {
            throw new RuntimeException("This session has ended");
        }

        User student = userRepository.findByEmail(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        Optional<GameSession.Participant> existingParticipant = session.getParticipants().stream()
                .filter(p -> p.getUserId().equals(studentId))
                .findFirst();

        GameSession.Participant participant;
        if (existingParticipant.isPresent()) {
            participant = existingParticipant.get();
            participant.setActive(true);
            participant.setLastActiveAt(new Date());
        } else {
            participant = new GameSession.Participant();
            participant.setUserId(studentId);
            participant.setDisplayName(student.getDisplayName());
            participant.setAvatarUrl(student.getAvatarUrl());
            participant.setTotalScore(0);
            participant.setPowerUps(new ArrayList<>());
            participant.setActive(true);
            participant.setJoinedAt(new Date());
            participant.setLastActiveAt(new Date());
            participant.setActivityScores(new HashMap<>());
            session.getParticipants().add(participant);
            GameSession.SessionStatistics stats = session.getStatistics();
            stats.setTotalParticipants(stats.getTotalParticipants() + 1);
            stats.setActiveParticipants(stats.getActiveParticipants() + 1);
            stats.getParticipantScores().put(student.getId(), 0);
        }
        gameSessionRepository.save(session);
        List<Map<String, Object>> participantsList = session.getParticipants().stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId", p.getUserId());
                    map.put("displayName", p.getDisplayName());
                    map.put("avatarUrl", p.getAvatarUrl());
                    map.put("active", p.isActive());
                    map.put("totalScore", p.getTotalScore());
                    return map;
                })
                .collect(Collectors.toList());

        messagingTemplate.convertAndSend(
                "/topic/session/" + accessCode + "/participants",
                participantsList);

        return participant;
    }

    public void leaveGameSession(String accessCode, String studentId) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        System.out.println("Current participants: " + session.getParticipants().stream()
                .map(p -> p.getUserId() + " (email/id: " + p.getUserId() + ")")
                .collect(Collectors.joining(", ")));
        List<GameSession.Participant> updatedParticipants = new ArrayList<>(session.getParticipants());
        boolean removed = updatedParticipants.removeIf(p -> p.getUserId().equals(studentId));
        if (removed) {
            session.setParticipants(updatedParticipants);
            GameSession.SessionStatistics stats = session.getStatistics();
            stats.setTotalParticipants(updatedParticipants.size());
            stats.setActiveParticipants(
                    (int) updatedParticipants.stream().filter(GameSession.Participant::isActive).count());
            stats.getParticipantScores().remove(studentId);
        } else {
            User student = userRepository.findByEmail(studentId).orElse(null);
            if (student != null) {
                String actualId = student.getId();
                System.out.println("Trying to remove by actual ID: " + actualId);
                removed = updatedParticipants.removeIf(p -> p.getUserId().equals(actualId));
                if (removed) {
                    session.setParticipants(updatedParticipants);
                    GameSession.SessionStatistics stats = session.getStatistics();
                    stats.setTotalParticipants(updatedParticipants.size());
                    stats.setActiveParticipants(
                            (int) updatedParticipants.stream().filter(GameSession.Participant::isActive).count());
                    stats.getParticipantScores().remove(studentId);
                } else {
                    System.out.println("Could not remove participant with either ID or email");
                }
            }
        }
        gameSessionRepository.save(session);
        List<Map<String, Object>> participantsList = session.getParticipants().stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId", p.getUserId());
                    map.put("displayName", p.getDisplayName());
                    map.put("avatarUrl", p.getAvatarUrl());
                    map.put("active", p.isActive());
                    map.put("totalScore", p.getTotalScore());
                    return map;
                })
                .collect(Collectors.toList());
        messagingTemplate.convertAndSend(
                "/topic/session/" + accessCode + "/participants",
                participantsList);
    }

    public void updateParticipantStatus(String accessCode, String studentId) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        Optional<GameSession.Participant> participant = session.getParticipants().stream()
                .filter(p -> p.getUserId().equals(studentId))
                .findFirst();
        if (participant.isPresent()) {
            participant.get().setLastActiveAt(new Date());
            participant.get().setActive(true);
            gameSessionRepository.save(session);
        }
    }

    public List<Map<String, Object>> getSessionParticipants(String accessCode) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        return session.getParticipants().stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId", p.getUserId());
                    map.put("displayName", p.getDisplayName());
                    map.put("avatarUrl", p.getAvatarUrl());
                    map.put("active", p.isActive());
                    map.put("totalScore", p.getTotalScore());
                    return map;
                })
                .collect(Collectors.toList());
    }

    public GameSession advanceActivity(String sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Move current activity to completed list
        if (session.getCurrentActivity() != null) {
            session.getCurrentActivity().setEndTime(new Date());
            session.getCurrentActivity().setStatus(GameSession.ActivityStatus.COMPLETED);
            if (session.getCompletedActivities() == null) {
                session.setCompletedActivities(new ArrayList<>());
            }
            session.getCompletedActivities().add(session.getCurrentActivity());
        }

        Games game = gamesRepository.findById(session.getGameId())
                .orElseThrow(() -> new RuntimeException("Game not found"));

        int nextIndex = session.getCurrentActivityIndex() + 1;

        if (nextIndex < game.getActivities().size()) {
            // Create new activity
            GameSession.SessionActivity newActivity = new GameSession.SessionActivity();
            newActivity.setActivityId(game.getActivities().get(nextIndex).getActivityId());
            newActivity.setStartTime(new Date());
            newActivity.setStatus(GameSession.ActivityStatus.ACTIVE);
            newActivity.setResponses(new ArrayList<>());
            newActivity.setCurrentContentIndex(0);

            session.setCurrentActivity(newActivity);
            session.setCurrentActivityIndex(nextIndex);

            // Save and return
            GameSession updatedSession = gameSessionRepository.save(session);
            Activity nextActivity = getActivityById(newActivity.getActivityId());

            messagingTemplate.convertAndSend(
                    "/topic/session/" + session.getAccessCode() + "/activity",
                    nextActivity);

            return updatedSession;
        } else {
            return endGameSession(sessionId);
        }
    }

    private Activity getActivityById(String activityId) {
        return activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
    }

    public GameSession startGameSession(String sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setStatus(GameSession.SessionStatus.ACTIVE);
        Games game = gamesRepository.findById(session.getGameId())
                .orElseThrow(() -> new RuntimeException("Game not found"));
        if (game.getActivities() != null && !game.getActivities().isEmpty()) {
            GameSession.SessionActivity sessionActivity = new GameSession.SessionActivity();
            sessionActivity.setActivityId(game.getActivities().get(0).getActivityId());
            sessionActivity.setStartTime(new Date());
            sessionActivity.setStatus(GameSession.ActivityStatus.ACTIVE);
            sessionActivity.setResponses(new ArrayList<>());
            // Ensure content index starts at 0
            sessionActivity.setCurrentContentIndex(0);
            session.setCurrentActivity(sessionActivity);
            session.setCurrentActivityIndex(0);
        }
        GameSession updatedSession = gameSessionRepository.save(session);
        messagingTemplate.convertAndSend(
                "/topic/session/" + session.getAccessCode() + "/status",
                "ACTIVE");
        if (game.getActivities() != null && !game.getActivities().isEmpty()) {
            Activity firstActivity = getActivityById(game.getActivities().get(0).getActivityId());
            messagingTemplate.convertAndSend(
                    "/topic/session/" + session.getAccessCode() + "/activity",
                    firstActivity);
        }
        return updatedSession;
    }

    private boolean evaluateMatching(Object content, Object answer) {
        try {
            Map<String, Object> contentMap = (Map<String, Object>) content;
            Map<String, Object> answerMap = (Map<String, Object>) answer;
            Map<String, Object> studentAnswer = (Map<String, Object>) answerMap.get("answer");

            List<Map<String, Object>> pairs = (List<Map<String, Object>>) contentMap.get("pairs");
            List<Map<String, String>> studentConnections = (List<Map<String, String>>) studentAnswer.get("connections");

            Set<String> correctConnections = new HashSet<>();
            for (int i = 0; i < pairs.size(); i++) {
                correctConnections.add("left-" + i + "-right-" + i);
            }

            Set<String> userConnections = studentConnections.stream()
                    .map(conn -> conn.get("leftId") + "-" + conn.get("rightId"))
                    .collect(Collectors.toSet());

            // So sánh
            return correctConnections.equals(userConnections);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private boolean evaluateMultipleChoice(Object content, Object answer) {
        try {
            int questionIndex = 0;
            int selectedOptionIndex = -1;

            if (answer instanceof Map) {
                Map<String, Object> answerMap = (Map<String, Object>) answer;
                questionIndex = (int) answerMap.getOrDefault("questionIndex", 0);
                selectedOptionIndex = (int) answerMap.getOrDefault("selectedOption", -1);
            } else if (answer instanceof Integer) {
                selectedOptionIndex = (Integer) answer;
            }

            List<?> options = getOptionsForQuestion(content, questionIndex);

            if (options == null || options.isEmpty()) {
                System.err.println("No options found for question index: " + questionIndex);
                return false;
            }

            if (selectedOptionIndex < 0 || selectedOptionIndex >= options.size()) {
                return false;
            }

            return isOptionCorrect(options.get(selectedOptionIndex));
        } catch (Exception e) {
            System.err.println("Error evaluating multiple choice: " + e.getMessage());
            return false;
        }
    }

    private List<?> getOptionsForQuestion(Object content, int questionIndex) {
        if (content instanceof Activity.MultipleChoiceContent) {
            Activity.MultipleChoiceContent mcContent = (Activity.MultipleChoiceContent) content;
            if (mcContent.getQuestions() != null && mcContent.getQuestions().size() > questionIndex) {
                return mcContent.getQuestions().get(questionIndex).getOptions();
            }
        } else if (content instanceof Map) {
            Map<String, Object> contentMap = (Map<String, Object>) content;

            // Handle content item format (single question per content item)
            if (contentMap.containsKey("options")) {
                return (List<?>) contentMap.get("options");
            }
            // Handle legacy format with questions array
            else if (contentMap.containsKey("questions")) {
                List<Map<String, Object>> questions = (List<Map<String, Object>>) contentMap.get("questions");
                if (questions.size() > questionIndex) {
                    return (List<?>) questions.get(questionIndex).get("options");
                }
            }
        }
        return null;
    }

    private boolean isOptionCorrect(Object option) {
        if (option instanceof Activity.Option) {
            return ((Activity.Option) option).isCorrect();
        } else if (option instanceof Map) {
            return Boolean.TRUE.equals(((Map<String, Object>) option).get("isCorrect"));
        }
        return false;
    }

    public boolean isUserParticipant(GameSession session, String userId) {
        return session.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(userId));
    }

    public Map<String, Object> getGameContent(String accessCode) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        if (session.getStatus() != GameSession.SessionStatus.ACTIVE) {
            throw new RuntimeException("Game session is not active");
        }
        Games game = gamesRepository.findById(session.getGameId())
                .orElseThrow(() -> new RuntimeException("Game not found"));
        int currentActivityIndex = session.getCurrentActivityIndex();
        Map<String, Object> gameContent = new HashMap<>();
        gameContent.put("gameId", game.getId());
        gameContent.put("title", game.getTitle());
        gameContent.put("description", game.getDescription());
        gameContent.put("activities", game.getActivities());
        gameContent.put("currentActivityIndex", currentActivityIndex);

        if (game.getActivities() != null && !game.getActivities().isEmpty()
                && currentActivityIndex < game.getActivities().size()) {
            String activityId = game.getActivities().get(currentActivityIndex).getActivityId();
            Activity currentActivity = getActivityById(activityId);
            gameContent.put("currentActivity", currentActivity);
        }
        return gameContent;
    }

    public Map<String, Object> advanceContentForActivity(String sessionId, String activityId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getCurrentActivity() == null || !session.getCurrentActivity().getActivityId().equals(activityId)) {
            throw new RuntimeException("Activity is not the current active activity");
        }

        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        int currentIndex = session.getCurrentActivity().getCurrentContentIndex();
        int nextIndex = currentIndex + 1;

        // If we're out of content items or there are none, move to the next activity
        if (activity.getContentItems() == null ||
                activity.getContentItems().isEmpty() ||
                nextIndex >= activity.getContentItems().size()) {

            advanceActivity(sessionId);
            return Map.of("status", "advanced_activity");
        }

        session.getCurrentActivity().setCurrentContentIndex(nextIndex);
        gameSessionRepository.save(session);

        Activity.ActivityContent nextContent = activity.getContentItems().get(nextIndex);

        Map<String, Object> contentUpdate = new HashMap<>();
        contentUpdate.put("status", "advanced_content");
        contentUpdate.put("contentItem", nextContent);
        contentUpdate.put("currentIndex", nextIndex);

        messagingTemplate.convertAndSend(
                "/topic/session/" + session.getAccessCode() + "/content",
                contentUpdate);

        return contentUpdate;
    }

    /**
     * Gets content for a specific activity and content index, respecting the
     * duration property
     */
    public Map<String, Object> getActivityContent(String accessCode, String activityId, int contentIndex) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        // Check if the activity has multiple content items
        if (activity.getContentItems() == null || activity.getContentItems().isEmpty()) {
            // Return the legacy content with the activity's timeLimit as duration
            Map<String, Object> response = new HashMap<>();
            response.put("content", activity.getContent());
            response.put("isLegacy", true);
            response.put("duration", activity.getTimeLimit()); // Use timeLimit as fallback
            return response;
        }

        // Check if contentIndex is valid
        if (contentIndex < 0 || contentIndex >= activity.getContentItems().size()) {
            throw new RuntimeException("Invalid content index");
        }

        // Get the specific content item
        Activity.ActivityContent contentItem = activity.getContentItems().get(contentIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("contentItem", contentItem);
        response.put("totalItems", activity.getContentItems().size());
        response.put("currentIndex", contentIndex);
        response.put("duration", contentItem.getDuration()); // Use the duration from the content item

        return response;
    }

    private void updateActivityStatistics(GameSession session, String activityId, boolean isCorrect) {
        if (session == null || session.getStatistics() == null) {
            return;
        }
        GameSession.SessionStatistics stats = session.getStatistics();
        if (stats.getActivityPerformance() == null) {
            stats.setActivityPerformance(new HashMap<>());
        }
        GameSession.PerformanceMetric metric = stats.getActivityPerformance()
                .getOrDefault(activityId, new GameSession.PerformanceMetric());
        metric.setTotalAttempts(metric.getTotalAttempts() + 1);

        if (isCorrect) {
            metric.setCorrectAttempts(metric.getCorrectAttempts() + 1);
        }
        double totalScore = (metric.getAverageScore() * (metric.getTotalAttempts() - 1));
        double newAverage = (totalScore + (isCorrect ? 1 : 0)) / metric.getTotalAttempts();
        metric.setAverageScore(newAverage);
        stats.getActivityPerformance().put(activityId, metric);
        updateOverallStatistics(session);
    }

    private void updateOverallStatistics(GameSession session) {
        if (session == null || session.getStatistics() == null) {
            return;
        }
        GameSession.SessionStatistics stats = session.getStatistics();
        int totalResponses = 0;
        int totalPossibleResponses = 0;
        int totalCorrectResponses = 0;

        for (GameSession.PerformanceMetric metric : stats.getActivityPerformance().values()) {
            totalResponses += metric.getTotalAttempts();
            totalCorrectResponses += metric.getCorrectAttempts();
        }
        Games game = gamesRepository.findById(session.getGameId()).orElse(null);
        if (game != null && game.getActivities() != null) {
            totalPossibleResponses = session.getParticipants().size() * game.getActivities().size();
        }
        double completionPercentage = totalPossibleResponses > 0
                ? (double) totalResponses / totalPossibleResponses * 100
                : 0;
        double correctAnswerPercentage = totalResponses > 0
                ? (double) totalCorrectResponses / totalResponses * 100
                : 0;
        stats.setOverallCompletionPercentage(completionPercentage);
        stats.setOverallCorrectAnswerPercentage(correctAnswerPercentage);
    }

    public Map<String, Object> processStudentAnswer(
            String accessCode, String studentId, String activityId, String contentId, Object answer) {

        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != GameSession.SessionStatus.ACTIVE) {
            throw new RuntimeException("Game session is not active");
        }

        GameSession.Participant participant = session.getParticipants().stream()
                .filter(p -> p.getUserId().equals(studentId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Participant not found in session"));
        Activity activity = getActivityById(activityId);

        Object contentToEvaluate = null;
        String explanation = null;
        Optional<Activity.ActivityContent> contentItem = Optional.empty();

        if (contentId != null && !contentId.equals("legacy")) {
            if (activity.getContentItems() != null) {
                contentItem = activity.getContentItems().stream()
                        .filter(c -> c.getContentId().equals(contentId))
                        .findFirst();

                if (contentItem.isPresent()) {
                    contentToEvaluate = contentItem.get().getData();
                    if (contentItem.get().getData() instanceof Map) {
                        Map<String, Object> dataMap = (Map<String, Object>) contentItem.get().getData();
                        if (dataMap.containsKey("explanation")) {
                            explanation = (String) dataMap.get("explanation");
                        }
                    }
                } else {
                    contentToEvaluate = activity.getContent();
                }
            } else {
                contentToEvaluate = activity.getContent();
            }
        } else {
            contentToEvaluate = activity.getContent();
        }
        Map<String, Object> answerData = (Map<String, Object>) answer;
        int remainingTime = (int) answerData.getOrDefault("timeRemaining", 0);

        int totalDuration = contentItem.isPresent()
                ? contentItem.get().getDuration()
                : activity.getTimeLimit();
        int timeSpent = Math.max(0, totalDuration - remainingTime);

        boolean isCorrect = evaluateAnswer(activity.getType().toString(), contentToEvaluate, answer);
        int pointsEarned = isCorrect ? calculatePoints(activity) : 0;
        if (isCorrect && totalDuration > 0) {
            double timeFactor = 1.0 - (Math.min(timeSpent, totalDuration) / (double) totalDuration);
            timeFactor = Math.max(timeFactor, 0.3);
            pointsEarned = (int) Math.round(pointsEarned * timeFactor);
        }
        participant.setTotalScore(participant.getTotalScore() + pointsEarned);

        if (participant.getActivityScores() == null) {
            participant.setActivityScores(new HashMap<>());
        }

        String scoreKey = contentId != null && !contentId.equals("legacy")
                ? activityId + ":" + contentId
                : activityId;
        participant.getActivityScores().put(scoreKey, pointsEarned);

        // Validate content index if needed
        if (session.getCurrentActivity() != null
                && session.getCurrentActivity().getActivityId().equals(activityId)) {
            if (activity.getContentItems() != null && !activity.getContentItems().isEmpty()) {
                int currentContentIndex = session.getCurrentActivity().getCurrentContentIndex();
                if (currentContentIndex < activity.getContentItems().size()) {
                    String expectedContentId = activity.getContentItems().get(currentContentIndex).getContentId();
                    if (!contentId.equals(expectedContentId) && !contentId.equals("legacy")) {
                        return Map.of(
                                "error", "You're answering a different question than the current one",
                                "valid", false);
                    }
                }
            }
        }

        // Create and populate the response
        if (session.getCurrentActivity() != null
                && activityId.equals(session.getCurrentActivity().getActivityId())) {
            GameSession.ParticipantResponse response = new GameSession.ParticipantResponse();
            response.setParticipantId(studentId);
            response.setActivityId(activityId);
            response.setContentId(contentId);
            response.setAnswer(answer);
            response.setCorrect(isCorrect);
            response.setPointsEarned(pointsEarned);
            response.setSubmittedAt(new Date());
            response.setTimeSpent(timeSpent); // Set calculated timeSpent

            if (session.getCurrentActivity().getResponses() == null) {
                session.getCurrentActivity().setResponses(new ArrayList<>());
            }
            session.getCurrentActivity().getResponses().add(response);
        }

        updateActivityStatistics(session, activityId, isCorrect);
        gameSessionRepository.save(session);

        if (session.getCurrentActivity() != null
                && activity.getContentItems() != null
                && !activity.getContentItems().isEmpty()) {
            int currentContentIndex = session.getCurrentActivity().getCurrentContentIndex();
            String currentContentId = activity.getContentItems().get(currentContentIndex).getContentId();
            String expectedScoreKey = activityId + ":" + currentContentId;
            boolean allAnswered = session.getParticipants().stream()
                    .allMatch(p -> p.getActivityScores().containsKey(expectedScoreKey));
            if (allAnswered) {
                advanceContentForActivity(session.getId(), activityId);
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("correct", isCorrect);
        result.put("pointsEarned", pointsEarned);
        result.put("totalScore", participant.getTotalScore());

        // Include explanation and correct answer if enabled
        if (session.getSettings() != null && session.getSettings().isShowCorrectAnswers()) {
            result.put("explanation", explanation != null ? explanation : activity.getExplanation());
            if (contentToEvaluate instanceof Map) {
                Map<String, Object> contentMap = (Map<String, Object>) contentToEvaluate;
                result.put("correctAnswer", contentMap.getOrDefault("correctAnswer", activity.getCorrectAnswer()));
            } else {
                result.put("correctAnswer", activity.getCorrectAnswer());
            }
        }

        // Update leaderboard
        if (session.getSettings() != null && session.getSettings().isShowLeaderboard()) {
            sendLeaderboardUpdate(session);
        }

        return result;
    }

    private boolean evaluateAnswer(String activityType, Object contentToEvaluate, Object answer) {
        if (contentToEvaluate == null) {
            return false;
        }

        try {
            if (contentToEvaluate instanceof Activity.ActivityContent) {
                contentToEvaluate = ((Activity.ActivityContent) contentToEvaluate).getData();
            }

            if (contentToEvaluate instanceof Map && ((Map<?, ?>) contentToEvaluate).containsKey("data")) {
                contentToEvaluate = ((Map<?, ?>) contentToEvaluate).get("data");
            }

            Activity.ActivityType type = Activity.ActivityType.valueOf(activityType);

            switch (type) {
                case MULTIPLE_CHOICE:
                    return evaluateMultipleChoice(contentToEvaluate, answer);
                case OPEN_ENDED:
                    return true;
                case SORTING:
                case FILL_IN_BLANK:
                    return evaluateFillInBlank(contentToEvaluate, answer);
                case MATCHING:
                    return evaluateMatching(contentToEvaluate, answer);
                default:
                    return true;
            }
        } catch (Exception e) {
            System.err.println("Error evaluating answer: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private int calculatePoints(Activity activity) {
        System.out.println("Calculating points for activity: " + activity.getId());
        System.out.println("Activity points: " + activity.getPoints());
        System.out.println("Difficulty: " + activity.getDifficulty());
        if (activity == null) {
            System.out.println("Activity is null, returning default points");
            return 10;
        }
        int basePoints = activity.getPoints() > 0 ? activity.getPoints() : 10; // Default to 10
        System.out.println("Base points: " + basePoints);
        if (activity.getDifficulty() != null) {
            switch (activity.getDifficulty()) {
                case "HARD":
                    basePoints *= 1.5;
                    break;
                case "MEDIUM":
                    break;
                case "EASY":
                    basePoints *= 0.8;
                    break;
            }
        }
        return basePoints;
    }

    private void sendLeaderboardUpdate(GameSession session) {
        List<Map<String, Object>> leaderboard = session.getParticipants().stream()
                .map(p -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("userId", p.getUserId());
                    entry.put("displayName", p.getDisplayName());
                    entry.put("score", p.getTotalScore());
                    entry.put("avatarUrl", p.getAvatarUrl());

                    int correctCount = 0;
                    int incorrectCount = 0;

                    List<GameSession.SessionActivity> allActivities = new ArrayList<>();
                    if (session.getCompletedActivities() != null) {
                        allActivities.addAll(session.getCompletedActivities());
                    }
                    if (session.getCurrentActivity() != null) {
                        allActivities.add(session.getCurrentActivity()); // Include current activity
                    }
                    for (GameSession.SessionActivity activity : allActivities) {
                        if (activity.getResponses() != null) {
                            for (GameSession.ParticipantResponse response : activity.getResponses()) {
                                if (response.getParticipantId().equals(p.getUserId())) {
                                    if (response.isCorrect()) {
                                        correctCount++;
                                    } else {
                                        incorrectCount++;
                                    }
                                }
                            }
                        }
                    }

                    entry.put("correctCount", correctCount);
                    entry.put("incorrectCount", incorrectCount);

                    return entry;
                })
                .sorted((p1, p2) -> Integer.compare((int) p2.get("score"), (int) p1.get("score")))
                .collect(Collectors.toList());

        messagingTemplate.convertAndSend(
                "/topic/session/" + session.getAccessCode() + "/leaderboard",
                leaderboard);
    }

    public GameSession getSessionByAccessCode(String accessCode) {
        String normalizedCode = accessCode.toUpperCase();
        Optional<GameSession> sessionOpt = gameSessionRepository.findByAccessCode(normalizedCode);
        if (!sessionOpt.isPresent()) {
            System.out.println("No session found for access code: " + normalizedCode);
            return null;
        }
        return sessionOpt.get();
    }

    public void createTeams(String accessCode, boolean autoAssign) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        Games game = gamesRepository.findById(session.getGameId())
                .orElseThrow(() -> new RuntimeException("Game not found"));

        if (!game.getSettings().isTeamBased()) {
            throw new RuntimeException("This game is not configured for team-based play");
        }

        Games.GameSettings.TeamGameSettings teamSettings = game.getSettings().getTeamSettings();
        if (teamSettings == null) {
            throw new RuntimeException("Team settings not configured for this game");
        }
        int numberOfTeams;
        if (autoAssign) {
            List<GameSession.Participant> participants = session.getParticipants();
            if (participants.isEmpty()) {
                throw new RuntimeException("No participants to assign to teams");
            }
            int participantCount = participants.size();
            int maxTeamSize = teamSettings.getMaxTeamSize();
            int minTeamSize = teamSettings.getMinTeamSize();
            numberOfTeams = Math.max(2, participantCount / maxTeamSize);
            if (participantCount / numberOfTeams < minTeamSize) {
                numberOfTeams = Math.max(1, participantCount / minTeamSize);
            }
        } else {
            numberOfTeams = 2;
        }
        session.setTeams(new ArrayList<>());

        if (autoAssign) {
            List<GameSession.Participant> participants = session.getParticipants();
            if (participants.isEmpty()) {
                throw new RuntimeException("No participants to assign to teams");
            }

            Collections.shuffle(participants);
            for (int i = 0; i < numberOfTeams; i++) {
                GameSession.Team team = new GameSession.Team();
                team.setTeamId(UUID.randomUUID().toString());
                team.setTeamName("Team " + (i + 1));
                team.setTeamMembers(new ArrayList<>());
                team.setTeamScore(0);
                team.setNextDrawerIndex(0); // Initialize drawer index
                team.setCurrentContentIndex(0); // 🚨 Move initialization HERE
                session.getTeams().add(team);
            }

            for (int i = 0; i < participants.size(); i++) {
                GameSession.Participant participant = participants.get(i);
                int teamIndex = i % numberOfTeams;
                GameSession.Team team = session.getTeams().get(teamIndex);
                team.getTeamMembers().add(participant.getUserId());
                participant.setTeamId(team.getTeamId());
            }
            for (GameSession.Team team : session.getTeams()) {
                if (team.getTeamMembers() != null && !team.getTeamMembers().isEmpty()) {
                    team.setCurrentDrawerId(team.getTeamMembers().get(0));
                    team.setNextDrawerIndex(1 % Math.max(1, team.getTeamMembers().size()));
                }
            }
        }
        gameSessionRepository.save(session);
        messagingTemplate.convertAndSend(
                "/topic/session/" + session.getAccessCode() + "/teams",
                session.getTeams());
    }

    private Map<String, Object> getTeamDrawerInfo(String userId, Activity.TeamChallengeContent.DrawingPrompt prompt) {
        Map<String, Object> drawerInfo = new HashMap<>();
        drawerInfo.put("userId", userId);
        drawerInfo.put("prompt", prompt.getPrompt());
        drawerInfo.put("category", prompt.getCategory());
        drawerInfo.put("timeLimit", prompt.getTimeLimit());
        return drawerInfo;
    }

    private boolean evaluateTeamGuess(
            Activity.TeamChallengeContent teamChallengeContent,
            Activity.TeamChallengeContent.DrawingPrompt currentPrompt,
            String guess) {

        if (guess == null || guess.trim().isEmpty())
            return false;

        String normalizedGuess = guess.trim().toLowerCase();
        String normalizedPrompt = currentPrompt.getPrompt().trim().toLowerCase();

        Activity.TeamChallengeContent.GuessValidation validationMethod = teamChallengeContent
                .getPictionarySettings() != null ? teamChallengeContent.getPictionarySettings().getGuessValidation()
                        : Activity.TeamChallengeContent.GuessValidation.EXACT_MATCH;

        switch (validationMethod) {
            case EXACT_MATCH:
                return normalizedGuess.equals(normalizedPrompt);
            case CONTAINS_KEYWORD:
                return normalizedGuess.contains(normalizedPrompt) ||
                        normalizedPrompt.contains(normalizedGuess);
            case SYNONYM_MATCH:
                if (normalizedGuess.equals(normalizedPrompt))
                    return true;
                return currentPrompt.getSynonyms().stream()
                        .anyMatch(synonym -> synonym.trim().equalsIgnoreCase(normalizedGuess));
            default:
                return false;
        }
    }

    private boolean advanceToNextPrompt(GameSession session, Activity activity, Team team) {
        GameSession.SessionActivity currentActivity = session.getCurrentActivity();
        if (currentActivity == null)
            return false;

        Activity.TeamChallengeContent teamChallengeContent = getTeamChallengeContent(activity);
        if (teamChallengeContent == null || teamChallengeContent.getPrompts() == null)
            return false;

        int totalPrompts = teamChallengeContent.getPrompts().size();
        int currentIndex = team.getCurrentContentIndex();

        if (currentIndex >= totalPrompts - 1) {
            team.setCurrentContentIndex(totalPrompts);
            gameSessionRepository.save(session);
            boolean allTeamsCompleted = session.getTeams().stream()
                    .allMatch(t -> t.getCurrentContentIndex() >= totalPrompts);

            if (allTeamsCompleted) {
                this.advanceActivity(session.getId());
                Map<String, Object> completionMessage = new HashMap<>();
                completionMessage.put("status", "COMPLETED");
                completionMessage.put("totalPrompts", totalPrompts);
                messagingTemplate.convertAndSend(
                        "/topic/session/" + session.getAccessCode() + "/teamchallenge/status",
                        completionMessage);
                return false;
            }
            Map<String, Object> update = new HashMap<>();
            update.put("teamId", team.getTeamId());
            update.put("currentPromptIndex", totalPrompts);
            update.put("status", "AWAITING_OTHERS");
            messagingTemplate.convertAndSend(
                    "/topic/session/" + session.getAccessCode() + "/teamchallenge/status",
                    update);
            return true;
        } else {
            int newIndex = currentIndex + 1;
            team.setCurrentContentIndex(newIndex);
            gameSessionRepository.save(session);

            Activity.TeamChallengeContent.DrawingPrompt newPrompt = teamChallengeContent.getPrompts().get(newIndex);
            Map<String, Object> promptUpdate = new HashMap<>();
            promptUpdate.put("type", "PROMPT_ADVANCE");
            promptUpdate.put("teamId", team.getTeamId());
            promptUpdate.put("newPromptIndex", newIndex);
            promptUpdate.put("newPrompt", newPrompt.getPrompt());
            messagingTemplate.convertAndSend(
                    "/topic/session/" + session.getAccessCode() + "/teamchallenge/prompts",
                    promptUpdate);
            return true;
        }
    }

    private void rotateDrawer(GameSession session, GameSession.Team team) {
        if (team.getTeamMembers() == null || team.getTeamMembers().isEmpty()) {
            return;
        }

        String nextDrawer = team.getNextDrawer();
        if (nextDrawer != null) {
            team.setCurrentDrawerId(nextDrawer);
        }
    }

    private boolean evaluateFillInBlank(Object content, Object answer) {
        if (!(answer instanceof Map)) {
            return false;
        }
        Map<String, Object> answerMap = (Map<String, Object>) answer;

        // Get question index and blank index
        Object qIdxObj = answerMap.get("questionIndex");
        Object bIdxObj = answerMap.get("blankIndex");
        if (qIdxObj == null || bIdxObj == null)
            return false;

        int questionIndex = Integer.parseInt(String.valueOf(qIdxObj));
        int blankIndex = Integer.parseInt(String.valueOf(bIdxObj));

        // Get user's answer
        final String answerStr = answerMap.get("answer") != null
                ? answerMap.get("answer").toString().trim().toLowerCase()
                : "";

        // Get acceptable answers from the answer data
        Map<String, Map<String, List<String>>> acceptableAnswers = null;
        if (answerMap.get("acceptableAnswers") instanceof Map) {
            acceptableAnswers = (Map<String, Map<String, List<String>>>) answerMap.get("acceptableAnswers");
        }

        if (acceptableAnswers != null &&
                acceptableAnswers.containsKey(String.valueOf(questionIndex)) &&
                acceptableAnswers.get(String.valueOf(questionIndex)).containsKey(String.valueOf(blankIndex))) {

            List<String> answersForThisBlank = acceptableAnswers.get(String.valueOf(questionIndex))
                    .get(String.valueOf(blankIndex));
            if (answersForThisBlank != null) {
                return answersForThisBlank.stream()
                        .map(String::toLowerCase)
                        .map(String::trim)
                        .anyMatch(correctAns -> correctAns.equals(answerStr));
            }
        }
        return false;
    }

    private Activity.TeamChallengeContent convertMapToTeamChallengeContent(Map<String, Object> contentMap) {
        Activity.TeamChallengeContent teamChallengeContent = new Activity.TeamChallengeContent();
        List<Activity.TeamChallengeContent.DrawingPrompt> prompts = new ArrayList<>();

        if (contentMap.containsKey("prompts")) {
            List<?> promptEntries = (List<?>) contentMap.get("prompts");
            for (Object entry : promptEntries) {
                Activity.TeamChallengeContent.DrawingPrompt prompt = new Activity.TeamChallengeContent.DrawingPrompt();

                if (entry instanceof String) {
                    // Handle simple string prompts
                    prompt.setPrompt((String) entry);
                    prompt.setPoints(100);
                    prompt.setTimeLimit(60);
                    prompt.setSynonyms(new ArrayList<>());
                    prompt.setHints(new ArrayList<>());
                } else if (entry instanceof Map) {
                    // Handle full prompt objects
                    Map<String, Object> promptMap = (Map<String, Object>) entry;
                    prompt.setPrompt((String) promptMap.getOrDefault("prompt", ""));
                    prompt.setPoints(((Number) promptMap.getOrDefault("points", 100)).intValue());
                    prompt.setTimeLimit(((Number) promptMap.getOrDefault("timeLimit", 60)).intValue());
                    prompt.setSynonyms((List<String>) promptMap.getOrDefault("synonyms", new ArrayList<>()));
                    prompt.setHints((List<String>) promptMap.getOrDefault("hints", new ArrayList<>()));
                }
                prompts.add(prompt);
            }
        }

        // Handle pictionary settings
        if (contentMap.containsKey("pictionarySettings")) {
            Map<String, Object> settingsMap = (Map<String, Object>) contentMap.get("pictionarySettings");
            Activity.TeamChallengeContent.PictionarySettings settings = new Activity.TeamChallengeContent.PictionarySettings();

            settings.setRotateDrawers((Boolean) settingsMap.getOrDefault("rotateDrawers", false));
            settings.setRoundsPerPlayer(((Number) settingsMap.getOrDefault("roundsPerPlayer", 1)).intValue());
            settings.setAllowPartialPoints((Boolean) settingsMap.getOrDefault("allowPartialPoints", false));
            settings.setRevealAnswerOnFail((Boolean) settingsMap.getOrDefault("revealAnswerOnFail", true));
            settings.setMaxGuessesPerTeam(((Number) settingsMap.getOrDefault("maxGuessesPerTeam", 3)).intValue());

            try {
                settings.setGuessValidation(Activity.TeamChallengeContent.GuessValidation.valueOf(
                        (String) settingsMap.getOrDefault("guessValidation", "EXACT_MATCH")));
            } catch (IllegalArgumentException e) {
                settings.setGuessValidation(Activity.TeamChallengeContent.GuessValidation.EXACT_MATCH);
            }

            teamChallengeContent.setPictionarySettings(settings);
        }

        teamChallengeContent.setPrompts(prompts);
        return teamChallengeContent;
    }

    public Map<String, Object> submitDrawing(String accessCode, String studentId, String teamId, String drawingData) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        Map<String, Object> result = new HashMap<>();
        result.put("status", "DRAWING_SUBMITTED");
        result.put("drawerId", studentId);

        messagingTemplate.convertAndSend(
                "/topic/session/" + accessCode + "/teamchallenge/drawing",
                result);
        return result;
    }

    public Map<String, Object> switchTeamDrawer(String accessCode, String teamId, String newDrawerId) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        GameSession.Team team = session.getTeams().stream()
                .filter(t -> t.getTeamId().equals(teamId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (!team.getTeamMembers().contains(newDrawerId)) {
            throw new RuntimeException("User is not a member of this team");
        }
        team.setCurrentDrawerId(newDrawerId);
        Activity activity = activityRepository.findById(session.getCurrentActivity().getActivityId())
                .orElseThrow(() -> new RuntimeException("Activity not found"));
        Activity.TeamChallengeContent content = (Activity.TeamChallengeContent) activity.getContent();
        int currentIndex = session.getCurrentActivity().getCurrentContentIndex();
        Activity.TeamChallengeContent.DrawingPrompt currentPrompt = content.getPrompts().get(currentIndex);
        Map<String, Object> drawerInfo = getTeamDrawerInfo(newDrawerId, currentPrompt);
        gameSessionRepository.save(session);
        Map<String, Object> result = new HashMap<>();
        result.put("teamId", teamId);
        result.put("newDrawerId", newDrawerId);
        result.put("prompt", drawerInfo);
        messagingTemplate.convertAndSend(
                "/topic/session/" + session.getAccessCode() + "/teamchallenge/drawer/" + teamId,
                result);

        return result;
    }

    public Map<String, Object> startTeamChallenge(String accessCode, String activityId) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Get the activity
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        // Get the team challenge content
        Activity.TeamChallengeContent teamChallengeContent = getTeamChallengeContent(activity);
        if (teamChallengeContent == null || teamChallengeContent.getPrompts() == null
                || teamChallengeContent.getPrompts().isEmpty()) {
            throw new RuntimeException("No prompts available for this team challenge");
        }

        // Create a new SessionActivity for the team challenge
        GameSession.SessionActivity sessionActivity = new GameSession.SessionActivity();
        sessionActivity.setActivityId(activityId);
        sessionActivity.setStartTime(new Date());
        sessionActivity.setCurrentContentIndex(0); // Start with the first prompt
        sessionActivity.setResponses(new ArrayList<>());
        // Set this as the current activity in the session
        session.setCurrentActivity(sessionActivity);

        // Get the first prompt
        Activity.TeamChallengeContent.DrawingPrompt firstPrompt = teamChallengeContent.getPrompts().get(0);

        // Create and return information about the round
        Map<String, Object> roundInfo = new HashMap<>();
        roundInfo.put("status", "ACTIVE");
        roundInfo.put("activityId", activityId);
        roundInfo.put("teamsCount", session.getTeams().size());
        roundInfo.put("currentPromptIndex", 0);
        roundInfo.put("currentWord", firstPrompt.getPrompt());
        roundInfo.put("currentPoints", firstPrompt.getPoints());

        // Save the session
        gameSessionRepository.save(session);

        // Send event to all clients
        messagingTemplate.convertAndSend(
                "/topic/session/" + accessCode + "/teamchallenge/start",
                roundInfo);

        return roundInfo;
    }

    private Activity.TeamChallengeContent getTeamChallengeContent(Activity activity) {
        if (activity == null)
            return null;

        // Check contentItems first
        if (activity.getContentItems() != null && !activity.getContentItems().isEmpty()) {
            for (Activity.ActivityContent content : activity.getContentItems()) {
                if (content.getData() instanceof Map) {
                    Map<String, Object> contentMap = (Map<String, Object>) content.getData();
                    Activity.TeamChallengeContent teamContent = new Activity.TeamChallengeContent();

                    // Handle prompts array
                    List<?> promptEntries = (List<?>) contentMap.get("prompts");
                    List<Activity.TeamChallengeContent.DrawingPrompt> prompts = new ArrayList<>();

                    for (Object entry : promptEntries) {
                        Activity.TeamChallengeContent.DrawingPrompt prompt = new Activity.TeamChallengeContent.DrawingPrompt();

                        if (entry instanceof String) {
                            // Handle string prompts like ["dog", "cat", "bird"]
                            prompt.setPrompt((String) entry);
                            prompt.setPoints(100); // Default value
                            prompt.setTimeLimit(60); // Default value
                        } else if (entry instanceof Map) {
                            // Handle full prompt objects
                            Map<String, Object> promptMap = (Map<String, Object>) entry;
                            prompt.setPrompt((String) promptMap.get("prompt"));
                            prompt.setPoints(((Number) promptMap.getOrDefault("points", 100)).intValue());
                            prompt.setTimeLimit(((Number) promptMap.getOrDefault("timeLimit", 60)).intValue());
                        }
                        prompts.add(prompt);
                    }
                    teamContent.setPrompts(prompts);

                    // Handle pictionarySettings
                    if (contentMap.containsKey("pictionarySettings")) {
                        Map<String, Object> settingsMap = (Map<String, Object>) contentMap.get("pictionarySettings");
                        Activity.TeamChallengeContent.PictionarySettings settings = new Activity.TeamChallengeContent.PictionarySettings();

                        settings.setGuessValidation(Activity.TeamChallengeContent.GuessValidation.valueOf(
                                (String) settingsMap.getOrDefault("guessValidation", "EXACT_MATCH")));
                        // Set other settings properties...

                        teamContent.setPictionarySettings(settings);
                    }

                    return teamContent;
                }
            }
        }

        // Fallback to legacy content handling
        return null;
    }

    public Map<String, Object> submitTeamGuess(String accessCode, String teamId, String guess) {
        System.out.println("DEBUG: Received guess '" + guess + "' for team " + teamId);
        System.out.println("DEBUG: Submitting team guess - accessCode: " + accessCode +
                ", teamId: " + teamId + ", guess: " + guess);
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        GameSession.Team team = session.getTeams().stream()
                .filter(t -> t.getTeamId().equals(teamId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Team not found"));

        GameSession.SessionActivity currentActivity = session.getCurrentActivity();
        if (currentActivity == null) {
            throw new RuntimeException("No active team challenge");
        }

        Activity activity = activityRepository.findById(currentActivity.getActivityId())
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        // Get the current prompt
        Activity.TeamChallengeContent teamChallengeContent = getTeamChallengeContent(activity);
        if (teamChallengeContent == null || teamChallengeContent.getPrompts() == null) {
            throw new RuntimeException("No prompts available for this team challenge");
        }

        int currentContentIndex = team.getCurrentContentIndex();
        if (currentContentIndex >= teamChallengeContent.getPrompts().size()) {
            throw new RuntimeException("Invalid prompt index: " + currentContentIndex);
        }

        Activity.TeamChallengeContent.DrawingPrompt currentPrompt = teamChallengeContent.getPrompts()
                .get(currentContentIndex);
        int pointsEarned = currentPrompt.getPoints();

        // Evaluate the guess using the appropriate validation method
        boolean isCorrect = evaluateTeamGuess(
                teamChallengeContent,
                currentPrompt,
                guess);

        Map<String, Object> result = new HashMap<>();
        result.put("teamId", teamId);
        result.put("guess", guess);
        result.put("correct", isCorrect);

        if (isCorrect) {
            // Record the response and update team score
            GameSession.ParticipantResponse response = new GameSession.ParticipantResponse();
            response.setParticipantId(team.getCurrentDrawerId()); // Drawer gets credit
            response.setActivityId(activity.getId());
            response.setTeamId(teamId);
            response.setDrawerId(team.getCurrentDrawerId());
            response.setAnswer(guess);
            response.setCorrect(true);
            response.setPointsEarned(pointsEarned);
            response.setSubmittedAt(new Date());

            if (currentActivity.getResponses() == null) {
                currentActivity.setResponses(new ArrayList<>());
            }
            currentActivity.getResponses().add(response);
            team.setTeamScore(team.getTeamScore() + pointsEarned);
            int teamSize = team.getTeamMembers().size();
            int pointsPerMember = pointsEarned / teamSize;
            int remainder = pointsEarned % teamSize;

            List<String> members = team.getTeamMembers();
            for (int i = 0; i < members.size(); i++) {
                String memberId = members.get(i);
                int pointsToAdd = pointsPerMember + (i < remainder ? 1 : 0); // Distribute remainder
                session.getParticipants().stream()
                        .filter(p -> p.getUserId().equals(memberId))
                        .findFirst()
                        .ifPresent(participant -> {
                            participant.setTotalScore(participant.getTotalScore() + pointsToAdd);
                            String scoreKey = activity.getId() + ":team_challenge";
                            participant.getActivityScores().merge(
                                    scoreKey,
                                    pointsToAdd,
                                    Integer::sum);
                        });
            }
            boolean advancedToNextPrompt = advanceToNextPrompt(session, activity, team);
            result.put("pointsEarned", pointsEarned);
            result.put("totalTeamScore", team.getTeamScore());
            result.put("advancedToNextPrompt", advancedToNextPrompt);

            if (!advancedToNextPrompt) {
                result.put("status", "ACTIVITY_COMPLETED");
            }
        } else {
            // Record incorrect guess
            GameSession.ParticipantResponse response = new GameSession.ParticipantResponse();
            response.setParticipantId("team");
            response.setActivityId(activity.getId());
            response.setTeamId(teamId);
            response.setAnswer(guess);
            response.setCorrect(false);
            response.setPointsEarned(0);
            response.setSubmittedAt(new Date());

            if (currentActivity.getResponses() == null) {
                currentActivity.setResponses(new ArrayList<>());
            }
            currentActivity.getResponses().add(response);

            // Check for max guesses
            if (teamChallengeContent.getPictionarySettings() != null &&
                    teamChallengeContent.getPictionarySettings().getMaxGuessesPerTeam() > 0) {

                long guessCount = currentActivity.getResponses().stream()
                        .filter(r -> r.getTeamId().equals(teamId) && !r.isCorrect())
                        .count();

                if (guessCount >= teamChallengeContent.getPictionarySettings().getMaxGuessesPerTeam()) {
                    result.put("status", "MAX_GUESSES_REACHED");
                    result.put("correctAnswer", currentPrompt.getPrompt());

                    if (teamChallengeContent.getPictionarySettings().isRevealAnswerOnFail()) {
                        boolean advancedToNextPrompt = advanceToNextPrompt(session, activity, team);
                        result.put("advancedToNextPrompt", advancedToNextPrompt);
                    }
                }
            }
        }
        System.out.println("DEBUG: Team challenge content: " + teamChallengeContent);
        if (teamChallengeContent != null && teamChallengeContent.getPrompts() != null) {
            System.out.println("DEBUG: Available prompts: " +
                    teamChallengeContent.getPrompts().stream()
                            .map(p -> p.getPrompt())
                            .collect(Collectors.joining(", ")));
        }
        System.out.println("Current prompt: " + currentPrompt.getPrompt());
        System.out.println("Team guess: " + guess);

        gameSessionRepository.save(session);
        messagingTemplate.convertAndSend(
                "/topic/session/" + session.getAccessCode() + "/teamchallenge/guess/" + teamId,
                result);
        sendLeaderboardUpdate(session);
        return result;
    }

    public Object getTeamDrawing(String accessCode, String teamId) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Find the team
        Team team = session.getTeams().stream()
                .filter(t -> t.getTeamId().equals(teamId))
                .findFirst()
                .orElse(null);

        if (team == null) {
            return null;
        }

        // Return the current drawing from the team
        return team.getCurrentDrawing();
    }

    public void broadcastDrawingUpdate(String accessCode, String teamId, Object paths) {
        messagingTemplate.convertAndSend(
                "/topic/session/" + accessCode + "/teamchallenge/drawing/" + teamId,
                paths);
    }

    // Modified saveTeamDrawing method in GameSessionService.java
    public void saveTeamDrawing(String accessCode, String teamId, Object paths) {
        Optional<GameSession> optionalSession = gameSessionRepository.findByAccessCode(accessCode);

        GameSession session = optionalSession
                .orElseThrow(() -> new RuntimeException("Session not found"));

        session.getTeams().stream()
                .filter(t -> t.getTeamId().equals(teamId))
                .findFirst()
                .ifPresent(team -> {
                    team.setCurrentDrawing((List<Map<String, Object>>) paths);
                    team.setLastDrawingUpdate(new Date());
                    gameSessionRepository.save(session);
                    // Make sure to broadcast after saving
                    broadcastDrawingUpdate(accessCode, teamId, paths);
                });
    }

    public Map<String, Object> getTeamChallengeStatus(String accessCode) {
        GameSession session = gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getCurrentActivity() == null) {
            throw new RuntimeException("No active team challenge");
        }
        Activity activity = activityRepository.findById(session.getCurrentActivity().getActivityId())
                .orElseThrow(() -> new RuntimeException("Activity not found"));
        Map<String, Object> status = new HashMap<>();
        status.put("activityId", activity.getId());
        status.put("activityTitle", activity.getTitle());
        status.put("currentPromptIndex", session.getCurrentActivity().getCurrentContentIndex());
        status.put("status", session.getCurrentActivity().getStatus().name());
        if (session.getTeams() != null) {
            status.put("teams", session.getTeams());
        }
        Object rawContent = activity.getContent();
        int totalPrompts = 0;
        if (rawContent instanceof Activity.TeamChallengeContent) {
            Activity.TeamChallengeContent content = (Activity.TeamChallengeContent) rawContent;
            totalPrompts = content.getPrompts() != null ? content.getPrompts().size() : 0;
        } else if (rawContent instanceof Map) {
            Map<String, Object> contentMap = (Map<String, Object>) rawContent;
            Object promptsObj = contentMap.get("prompts");
            if (promptsObj instanceof List) {
                totalPrompts = ((List<?>) promptsObj).size();
            }
        }
        status.put("totalPrompts", totalPrompts);
        Map<String, Object> currentRound = new HashMap<>();
        currentRound.put("index", session.getCurrentActivity().getCurrentContentIndex());
        List<Map<String, Object>> teamInfo = new ArrayList<>();
        if (session.getTeams() != null) {
            teamInfo = session.getTeams().stream()
                    .filter(team -> team.getTeamId() != null)
                    .map(team -> {
                        Map<String, Object> info = new HashMap<>();
                        info.put("id", team.getTeamId());
                        info.put("name", team.getTeamName());
                        info.put("score", team.getTeamScore());
                        info.put("currentPromptIndex", team.getCurrentContentIndex());
                        info.put("currentDrawerId", team.getCurrentDrawerId());
                        List<Map<String, Object>> members = team.getTeamMembers().stream()
                                .map(memberId -> {
                                    User user = userRepository.findByEmail(memberId).orElse(null); // Use email
                                    Map<String, Object> memberMap = new HashMap<>();
                                    memberMap.put("userId", memberId);
                                    memberMap.put("displayName", user != null ? user.getDisplayName() : "Unknown");
                                    return memberMap;
                                })
                                .collect(Collectors.toList());
                        info.put("members", members);
                        return info;
                    })
                    .collect(Collectors.toList());
        }
        status.put("teamInfo", teamInfo);
        if (session.getCurrentActivity().getResponses() != null) {
            List<Map<String, Object>> guesses = session.getCurrentActivity().getResponses().stream()
                    .filter(response -> response.getAnswer() != null)
                    .map(response -> {
                        Map<String, Object> guess = new HashMap<>();
                        guess.put("teamId", response.getTeamId());
                        guess.put("guess", response.getAnswer());
                        guess.put("correct", response.isCorrect());

                        // Find player name
                        User user = userRepository.findById(response.getParticipantId()).orElse(null);
                        guess.put("playerName", user != null ? user.getDisplayName() : "Unknown");

                        return guess;
                    })
                    .collect(Collectors.toList());

            currentRound.put("guesses", guesses);
        }

        if (session.getCurrentActivity().getResponses() != null) {
            Optional<GameSession.ParticipantResponse> lastDrawing = session.getCurrentActivity().getResponses().stream()
                    .filter(r -> r.getAnswer() != null && ((String) r.getAnswer()).startsWith("data:image/"))
                    .max(Comparator.comparing(GameSession.ParticipantResponse::getSubmittedAt));

            if (lastDrawing.isPresent()) {
                currentRound.put("currentDrawing", lastDrawing.get().getAnswer());
            }
        }
        status.put("currentRound", currentRound);
        if (session.getCurrentActivity().getStatus() == GameSession.ActivityStatus.COMPLETED) {
            List<Map<String, Object>> winners = session.getTeams().stream()
                    .sorted(Comparator.comparing(GameSession.Team::getTeamScore).reversed())
                    .limit(3) // Top 3 teams
                    .map(team -> {
                        Map<String, Object> winner = new HashMap<>();
                        winner.put("teamId", team.getTeamId());
                        winner.put("teamName", team.getTeamName());
                        winner.put("points", team.getTeamScore());
                        return winner;
                    })
                    .collect(Collectors.toList());

            status.put("winners", winners);
        }

        return status;
    }

    public List<GameSession> getRecentSessionsByStudentId(String studentId) {
        return gameSessionRepository.findByParticipantsUserIdOrderByStartTimeDesc(studentId);
    }

}