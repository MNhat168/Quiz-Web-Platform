package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.SessionSettings;
import com.QuizWeb.TheQuizWeb.Model.Activity;
import com.QuizWeb.TheQuizWeb.Model.Activity.Option;
import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Model.Games;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Repository.ActivityRepository;
import com.QuizWeb.TheQuizWeb.Repository.GameSessionRepository;
import com.QuizWeb.TheQuizWeb.Repository.GamesRepository;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GameSessionService {

    @Autowired
    private GameSessionRepository gameSessionRepository;

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

        session.setStatus(GameSession.SessionStatus.COMPLETED);
        session.setEndTime(new Date());

        GameSession updatedSession = gameSessionRepository.save(session);
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
        Games game = gamesRepository.findById(session.getGameId())
                .orElseThrow(() -> new RuntimeException("Game not found"));

        int currentIndex = session.getCurrentActivityIndex();
        int nextIndex = currentIndex + 1;

        if (game.getActivities() != null && nextIndex < game.getActivities().size()) {
            session.setCurrentActivityIndex(nextIndex);
            GameSession.SessionActivity sessionActivity = new GameSession.SessionActivity();
            sessionActivity.setActivityId(game.getActivities().get(nextIndex).getActivityId());
            sessionActivity.setStartTime(new Date());
            sessionActivity.setStatus(GameSession.ActivityStatus.ACTIVE);
            sessionActivity.setResponses(new ArrayList<>());
            // Reset content index when moving to a new activity
            sessionActivity.setCurrentContentIndex(0);
            session.setCurrentActivity(sessionActivity);

            GameSession updatedSession = gameSessionRepository.save(session);
            Activity nextActivity = getActivityById(game.getActivities().get(nextIndex).getActivityId());
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

        // Otherwise, move to the next content item within this activity
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
     * Gets content for a specific activity and content index, respecting the duration property
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

        if (contentId != null && !contentId.equals("legacy")) {
            if (activity.getContentItems() != null) {
                Optional<Activity.ActivityContent> contentItem = activity.getContentItems().stream()
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
                    System.out.println("Content item not found with ID: " + contentId);
                    contentToEvaluate = activity.getContent(); // Fallback to legacy content
                }
            } else {
                System.out.println("Activity has no content items, using legacy content");
                contentToEvaluate = activity.getContent();
            }
        } else {
            System.out.println("Using legacy content for activity: " + activity.getId());
            contentToEvaluate = activity.getContent();
        }

        boolean isCorrect = evaluateAnswer(activity.getType().toString(), contentToEvaluate, answer);
        int pointsEarned = isCorrect ? calculatePoints(activity) : 0;
        participant.setTotalScore(participant.getTotalScore() + pointsEarned);
        if (participant.getActivityScores() == null) {
            participant.setActivityScores(new HashMap<>());
        }

        String scoreKey = contentId != null && !contentId.equals("legacy") ? activityId + ":" + contentId : activityId;
        participant.getActivityScores().put(scoreKey, pointsEarned);

        if (session.getCurrentActivity() != null &&
                session.getCurrentActivity().getActivityId().equals(activityId)) {
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

        if (session.getCurrentActivity() != null &&
                activityId.equals(session.getCurrentActivity().getActivityId())) {

            GameSession.ParticipantResponse response = new GameSession.ParticipantResponse();
            response.setParticipantId(studentId);
            response.setActivityId(activityId);
            response.setContentId(contentId); // Store contentId with the response
            response.setAnswer(answer);
            response.setCorrect(isCorrect);
            response.setPointsEarned(pointsEarned);
            response.setSubmittedAt(new Date());

            if (session.getCurrentActivity().getResponses() == null) {
                session.getCurrentActivity().setResponses(new ArrayList<>());
            }
            session.getCurrentActivity().getResponses().add(response);
        }

        updateActivityStatistics(session, activityId, isCorrect);
        gameSessionRepository.save(session);
        Map<String, Object> result = new HashMap<>();
        result.put("correct", isCorrect);
        result.put("pointsEarned", pointsEarned);
        result.put("totalScore", participant.getTotalScore());

        if (session.getSettings() != null && session.getSettings().isShowCorrectAnswers()) {
            if (explanation != null) {
                result.put("explanation", explanation);
            } else {
                result.put("explanation", activity.getExplanation());
            }
            if (contentToEvaluate instanceof Map) {
                Map<String, Object> contentMap = (Map<String, Object>) contentToEvaluate;
                if (contentMap.containsKey("correctAnswer")) {
                    result.put("correctAnswer", contentMap.get("correctAnswer"));
                }
            } else {
                result.put("correctAnswer", activity.getCorrectAnswer());
            }
        }
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
            System.out.println("Evaluating answer for activity type: " + activityType);
            System.out.println("Content type: " + contentToEvaluate.getClass().getName());
            System.out.println("Answer type: " + (answer != null ? answer.getClass().getName() : "null"));

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
                case TRUE_FALSE:
                    return evaluateTrueFalse(contentToEvaluate, answer);
                case FILL_IN_BLANK:
                    return evaluateFillInBlank(contentToEvaluate, answer);
                case MATH_PROBLEM:
                    return evaluateMathProblem(contentToEvaluate, answer);
                case OPEN_ENDED:
                    // For open-ended questions, always return true
                    return true;
                case SORTING:
                case MATCHING:
                case PUZZLE:
                    return evaluateComplexActivity(contentToEvaluate, answer);
                default:
                    // For other activity types (including polls/surveys)
                    return true;
            }
        } catch (Exception e) {
            System.err.println("Error evaluating answer: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private boolean evaluateMultipleChoice(Object content, Object answer) {
        int questionIndex = 0;
        Object selectedOption = answer;
        if (answer instanceof Map) {
            Map<String, Object> answerMap = (Map<String, Object>) answer;
            if (answerMap.containsKey("questionIndex")) {
                questionIndex = ((Number) answerMap.get("questionIndex")).intValue();
            }
            if (answerMap.containsKey("selectedOption")) {
                selectedOption = answerMap.get("selectedOption");
            } else if (answerMap.containsKey("answer")) {
                selectedOption = answerMap.get("answer");
            }
            if (selectedOption == null) {
                return false;
            }
        }
        List<?> options = getOptionsForQuestion(content, questionIndex);
        if (options == null || options.isEmpty()) {
            return false;
        }
        return isCorrectOption(options, selectedOption);
    }

    private List<?> getOptionsForQuestion(Object content, int questionIndex) {
        if (content instanceof Activity.MultipleChoiceContent) {
            Activity.MultipleChoiceContent mcContent = (Activity.MultipleChoiceContent) content;
            if (mcContent.getQuestions() != null && mcContent.getQuestions().size() > questionIndex) {
                return mcContent.getQuestions().get(questionIndex).getOptions();
            }
        } else if (content instanceof Map) {
            Map<String, Object> contentMap = (Map<String, Object>) content;
            if (contentMap.containsKey("questions")) {
                List<Map<String, Object>> questions = (List<Map<String, Object>>) contentMap.get("questions");
                if (questions.size() > questionIndex) {
                    Map<String, Object> question = questions.get(questionIndex);
                    if (question.containsKey("options")) {
                        return (List<?>) question.get("options");
                    }
                }
            }
        }
        return null;
    }

    private boolean isCorrectOption(List<?> options, Object selectedAnswer) {
        if (selectedAnswer instanceof Integer) {
            int selectedIndex = (Integer) selectedAnswer;
            if (selectedIndex < 0 || selectedIndex >= options.size()) {
                return false;
            }

            Object option = options.get(selectedIndex);
            return isOptionCorrect(option);
        } else {
            String answerText = selectedAnswer.toString().trim();
            return options.stream()
                    .filter(opt -> getOptionText(opt).equalsIgnoreCase(answerText) && isOptionCorrect(opt))
                    .findFirst()
                    .isPresent();
        }
    }

    private boolean isOptionCorrect(Object option) {
        if (option instanceof Activity.Option) {
            return ((Activity.Option) option).isCorrect();
        } else if (option instanceof Map) {
            return Boolean.TRUE.equals(((Map<String, Object>) option).get("isCorrect"));
        }
        return false;
    }

    private String getOptionText(Object option) {
        if (option instanceof Activity.Option) {
            return ((Activity.Option) option).getText().trim();
        } else if (option instanceof Map) {
            String text = (String) ((Map<String, Object>) option).get("text");
            return text != null ? text.trim() : "";
        }
        return "";
    }

    private boolean evaluateTrueFalse(Object content, Object answer) {
        boolean boolAnswer;

        if (answer instanceof Boolean) {
            boolAnswer = (Boolean) answer;
        } else if (answer instanceof String) {
            boolAnswer = Boolean.parseBoolean((String) answer);
        } else {
            return false;
        }

        if (content instanceof Map) {
            Map<String, Object> contentMap = (Map<String, Object>) content;
            if (contentMap.containsKey("correctAnswer")) {
                Object correctAnswerObj = contentMap.get("correctAnswer");

                if (correctAnswerObj instanceof Boolean) {
                    return boolAnswer == (Boolean) correctAnswerObj;
                } else if (correctAnswerObj instanceof String) {
                    boolean correctBool = Boolean.parseBoolean((String) correctAnswerObj);
                    return boolAnswer == correctBool;
                }
            }
        }

        return false;
    }

    private boolean evaluateFillInBlank(Object content, Object answer) {
        if (!(answer instanceof String)) {
            return false;
        }
        String answerStr = ((String) answer).trim().toLowerCase();
        if (content instanceof Activity.FillInBlankContent) {
            Activity.FillInBlankContent fbContent = (Activity.FillInBlankContent) content;
            for (List<String> acceptableAnswers : fbContent.getAcceptableAnswers().values()) {
                if (acceptableAnswers.stream()
                        .map(String::toLowerCase)
                        .map(String::trim)
                        .anyMatch(correctAns -> correctAns.equals(answerStr))) {
                    return true;
                }
            }
        } else if (content instanceof Map) {
            Map<String, Object> contentMap = (Map<String, Object>) content;

            if (contentMap.containsKey("acceptableAnswers")) {
                Map<String, List<String>> acceptableAnswers = (Map<String, List<String>>) contentMap
                        .get("acceptableAnswers");

                for (List<String> answers : acceptableAnswers.values()) {
                    if (answers.stream()
                            .map(String::toLowerCase)
                            .map(String::trim)
                            .anyMatch(correctAns -> correctAns.equals(answerStr))) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private boolean evaluateMathProblem(Object content, Object answer) {
        if (!(answer instanceof String)) {
            return false;
        }

        String answerStr = ((String) answer).trim();

        if (content instanceof Activity.MathProblemContent) {
            Activity.MathProblemContent mpContent = (Activity.MathProblemContent) content;
            String correctAnswer = mpContent.getCorrectAnswer();
            return normalizeNumericAnswer(answerStr).equals(normalizeNumericAnswer(correctAnswer));
        } else if (content instanceof Map) {
            Map<String, Object> contentMap = (Map<String, Object>) content;

            if (contentMap.containsKey("correctAnswer")) {
                String correctAnswer = (String) contentMap.get("correctAnswer");
                return normalizeNumericAnswer(answerStr).equals(normalizeNumericAnswer(correctAnswer));
            }
        }

        return false;
    }

    private String normalizeNumericAnswer(String answer) {
        if (answer == null)
            return "";
        String normalized = answer.replaceAll("\\s+", "").toLowerCase();
        try {
            double value = Double.parseDouble(normalized);
            if (value == Math.floor(value)) {
                return String.valueOf((int) value);
            }
            return String.valueOf(value);
        } catch (NumberFormatException e) {
            return normalized;
        }
    }

    private boolean evaluateComplexActivity(Object content, Object answer) {
        if (!(answer instanceof List)) {
            return false;
        }
        List<?> answerList = (List<?>) answer;
        if (content instanceof Activity.SortingContent) {
            Activity.SortingContent sortContent = (Activity.SortingContent) content;
            List<Activity.SortItem> correctItems = sortContent.getItems();
            return false;
        }
        if (content instanceof Activity.MatchingContent) {
            Activity.MatchingContent matchContent = (Activity.MatchingContent) content;
            List<Activity.MatchPair> correctPairs = matchContent.getPairs();
            return false;
        }

        return false;
    }

    public boolean isUserParticipant(GameSession session, String userId) {
        return session.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(userId));
    }

    private int calculatePoints(Activity activity) {
        if (activity == null) {
            System.out.println("Activity is null, returning default points");
            return 10; // Default points
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
        if (session == null) {
            return;
        }
        List<Map<String, Object>> leaderboard = session.getParticipants().stream()
                .map(p -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("userId", p.getUserId());
                    entry.put("displayName", p.getDisplayName());
                    entry.put("score", p.getTotalScore());
                    entry.put("avatarUrl", p.getAvatarUrl());
                    return entry;
                })
                .sorted((p1, p2) -> Integer.compare((int) p2.get("score"), (int) p1.get("score")))
                .collect(Collectors.toList());
        messagingTemplate.convertAndSend(
                "/topic/session/" + session.getAccessCode() + "/leaderboard",
                leaderboard);
    }

    public GameSession getSessionByAccessCode(String accessCode) {
        return gameSessionRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }
}