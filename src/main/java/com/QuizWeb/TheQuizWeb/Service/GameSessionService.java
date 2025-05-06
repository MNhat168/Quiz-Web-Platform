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
import java.util.stream.Collectors;

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
                    // For open-ended questions, always return true
                    return true;
                case SORTING:
                case FILL_IN_BLANK:
                    return evaluateFillInBlank(contentToEvaluate, answer);
                case MATCHING:
                    return evaluateMatching(contentToEvaluate, answer);
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

    private void sendLeaderboardUpdate(GameSession session) {
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
        String normalizedCode = accessCode.toUpperCase();
        Optional<GameSession> sessionOpt = gameSessionRepository.findByAccessCode(normalizedCode);
        GameSession session = sessionOpt.get();
        return session;
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
        int numberOfTeams = teamSettings.getMinTeamSize();
        if (numberOfTeams <= 0) {
            numberOfTeams = 2; // Default to 2 teams if not set
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
                team.setCurrentPromptIndex(0); // 🚨 Move initialization HERE
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

        if (guess == null || guess.trim().isEmpty()) {
            return false;
        }

        // Normalize the guess - trim and convert to lowercase
        String normalizedGuess = guess.trim().toLowerCase();
        String normalizedPrompt = currentPrompt.getPrompt().trim().toLowerCase();

        // Get validation method from settings or default to EXACT_MATCH
        Activity.TeamChallengeContent.GuessValidation validationMethod = (teamChallengeContent
                .getPictionarySettings() != null &&
                teamChallengeContent.getPictionarySettings().getGuessValidation() != null)
                        ? teamChallengeContent.getPictionarySettings().getGuessValidation()
                        : Activity.TeamChallengeContent.GuessValidation.EXACT_MATCH;

        switch (validationMethod) {
            case EXACT_MATCH:
                return normalizedGuess.equals(normalizedPrompt);

            case CONTAINS_KEYWORD:
                return normalizedPrompt.contains(normalizedGuess) || normalizedGuess.contains(normalizedPrompt);

            case SYNONYM_MATCH:
                // Check exact match first
                if (normalizedGuess.equals(normalizedPrompt)) {
                    return true;
                }

                // Then check against synonyms if available
                if (currentPrompt.getSynonyms() != null && !currentPrompt.getSynonyms().isEmpty()) {
                    for (String synonym : currentPrompt.getSynonyms()) {
                        if (normalizedGuess.equals(synonym.trim().toLowerCase())) {
                            return true;
                        }
                    }
                }
                return false;

            case MANUAL_TEACHER:
                // For manual validation, we'll return false and let the teacher validate
                // This would require additional UI/endpoint to handle teacher validation
                return false;

            default:
                return normalizedGuess.equals(normalizedPrompt);
        }
    }

    private boolean advanceToNextPrompt(GameSession session, Activity activity, Team team) {
        GameSession.SessionActivity currentActivity = session.getCurrentActivity();
        if (currentActivity == null)
            return false;

        Activity.TeamChallengeContent teamChallengeContent = getTeamChallengeContent(activity);
        if (teamChallengeContent == null || teamChallengeContent.getPrompts() == null)
            return false;

        int currentIndex = team.getCurrentPromptIndex();
        int totalPrompts = teamChallengeContent.getPrompts().size();

        if (currentIndex >= totalPrompts - 1) {
            // Notify completion
            Map<String, Object> completionMessage = new HashMap<>();
            completionMessage.put("status", "COMPLETED");
            completionMessage.put("totalPrompts", totalPrompts);
            messagingTemplate.convertAndSend(
                    "/topic/session/" + session.getAccessCode() + "/teamchallenge/status",
                    completionMessage);
            return false;
        }

        // Advance to next prompt
        int newIndex = currentIndex + 1;
        Activity.TeamChallengeContent.DrawingPrompt newPrompt = teamChallengeContent.getPrompts().get(newIndex);

        // Update ONLY the team's progress
        team.setCurrentPromptIndex(newIndex);

        // Prepare and broadcast update
        Map<String, Object> update = new HashMap<>();
        update.put("currentPromptIndex", newIndex);
        update.put("currentWord", newPrompt.getPrompt());
        update.put("status", "ACTIVE");

        if (newPrompt.getSynonyms() != null && !newPrompt.getSynonyms().isEmpty()) {
            update.put("synonyms", newPrompt.getSynonyms());
        }

        if (newPrompt.getTimeLimit() > 0) {
            update.put("timeLimit", newPrompt.getTimeLimit());
        }

        messagingTemplate.convertAndSend(
                "/topic/session/" + session.getAccessCode() + "/teamchallenge/status",
                update);

        return true;
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
                    prompt.setPrompt((String) entry);
                    prompt.setPoints(100); // Default points
                    prompt.setTimeLimit(60); // Default time limit
                } else if (entry instanceof Map) {
                    Map<String, Object> promptMap = (Map<String, Object>) entry;
                    prompt.setPrompt((String) promptMap.get("prompt"));
                    if (promptMap.containsKey("points")) {
                        prompt.setPoints(((Number) promptMap.get("points")).intValue());
                    }
                    if (promptMap.containsKey("category")) {
                        prompt.setCategory((String) promptMap.get("category"));
                    }
                    if (promptMap.containsKey("difficulty")) {
                        prompt.setDifficulty((String) promptMap.get("difficulty"));
                    }
                    if (promptMap.containsKey("timeLimit")) {
                        Object timeLimitObj = promptMap.get("timeLimit");
                        if (timeLimitObj instanceof Number) {
                            prompt.setTimeLimit(((Number) timeLimitObj).intValue());
                        }
                    }
                    if (promptMap.containsKey("hints")) {
                        prompt.setHints((List<String>) promptMap.get("hints"));
                    }
                    if (promptMap.containsKey("synonyms")) {
                        prompt.setSynonyms((List<String>) promptMap.get("synonyms"));
                    }
                }
                prompts.add(prompt);
            }
        }
        teamChallengeContent.setPrompts(prompts);
        if (contentMap.containsKey("pictionarySettings")) {
            Map<String, Object> settingsMap = (Map<String, Object>) contentMap.get("pictionarySettings");
            Activity.TeamChallengeContent.PictionarySettings settings = new Activity.TeamChallengeContent.PictionarySettings();
            if (settingsMap.containsKey("rotateDrawers")) {
                settings.setRotateDrawers((Boolean) settingsMap.get("rotateDrawers"));
            }
            if (settingsMap.containsKey("roundsPerPlayer")) {
                Object roundsObj = settingsMap.get("roundsPerPlayer");
                if (roundsObj instanceof Number) {
                    settings.setRoundsPerPlayer(((Number) roundsObj).intValue());
                }
            }
            if (settingsMap.containsKey("allowPartialPoints")) {
                settings.setAllowPartialPoints((Boolean) settingsMap.get("allowPartialPoints"));
            }
            if (settingsMap.containsKey("revealAnswerOnFail")) {
                settings.setRevealAnswerOnFail((Boolean) settingsMap.get("revealAnswerOnFail"));
            }
            if (settingsMap.containsKey("maxGuessesPerTeam")) {
                Object maxGuessesObj = settingsMap.get("maxGuessesPerTeam");
                if (maxGuessesObj instanceof Number) {
                    settings.setMaxGuessesPerTeam(((Number) maxGuessesObj).intValue());
                }
            }
            if (settingsMap.containsKey("guessValidation")) {
                String validationType = (String) settingsMap.get("guessValidation");
                try {
                    settings.setGuessValidation(Activity.TeamChallengeContent.GuessValidation.valueOf(validationType));
                } catch (IllegalArgumentException e) {
                    settings.setGuessValidation(Activity.TeamChallengeContent.GuessValidation.EXACT_MATCH);
                }
            }

            teamChallengeContent.setPictionarySettings(settings);
        }

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
        if (activity == null || activity.getContent() == null) {
            return null;
        }

        // Check contentItems first
        if (activity.getContentItems() != null && !activity.getContentItems().isEmpty()) {
            for (Activity.ActivityContent content : activity.getContentItems()) {
                if (content.getData() instanceof Activity.TeamChallengeContent) {
                    return (Activity.TeamChallengeContent) content.getData();
                } else if (content.getData() instanceof Map) {
                    return convertMapToTeamChallengeContent((Map<String, Object>) content.getData());
                }
            }
        }

        // Fallback to legacy content
        if (activity.getContent() instanceof Activity.TeamChallengeContent) {
            return (Activity.TeamChallengeContent) activity.getContent();
        } else if (activity.getContent() instanceof Map) {
            return convertMapToTeamChallengeContent((Map<String, Object>) activity.getContent());
        }

        return null;
    }

    public Map<String, Object> submitTeamGuess(String accessCode, String teamId, String guess) {
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

        int currentContentIndex = team.getCurrentPromptIndex();
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

}