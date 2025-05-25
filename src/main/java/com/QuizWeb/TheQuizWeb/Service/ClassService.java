package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.Class;
import com.QuizWeb.TheQuizWeb.Model.Class.ClassGameHistory;
import com.QuizWeb.TheQuizWeb.Model.Class.StudentPerformanceSummary;
import com.QuizWeb.TheQuizWeb.Model.Class.SubjectProgress;
import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Model.GameSession.Participant;
import com.QuizWeb.TheQuizWeb.Model.GameSession.PerformanceMetric;
import com.QuizWeb.TheQuizWeb.Model.GameSession.SessionActivity;
import com.QuizWeb.TheQuizWeb.Model.Games;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Repository.ActivityRepository;
import com.QuizWeb.TheQuizWeb.Repository.ClassRepository;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;
import com.QuizWeb.TheQuizWeb.Repository.GamesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ClassService {

    @Autowired
    private ClassRepository classRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GamesRepository gamesRepository;
    

    public Class createClass(Class newClass, String classCode) {
        // Initialize empty lists if null
        if (newClass.getStudentIds() == null) {
            newClass.setStudentIds(new ArrayList<>());
        }
        if (newClass.getAssignedGameIds() == null) {
            newClass.setAssignedGameIds(new ArrayList<>());
        }
        if (newClass.getGameHistory() == null) {
            newClass.setGameHistory(new ArrayList<>());
        }
        if (newClass.getSubjectProgress() == null) {
            newClass.setSubjectProgress(new HashMap<>());
        }

        // Set the class code
        newClass.setClassCode(classCode);

        // Save class
        return classRepository.save(newClass);
    }

    public String generateClassCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        SecureRandom random = new SecureRandom();
        int codeLength = 6;

        String code;
        do {
            StringBuilder sb = new StringBuilder(codeLength);
            for (int i = 0; i < codeLength; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            code = sb.toString();
        } while (classRepository.findByClassCode(code).isPresent()); // Check against database

        return code;
    }

    public Class getClassByCode(String classCode) {
        return classRepository.findByClassCode(classCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid class code"));
    }

    public String regenerateClassCode(String classId) {
        Class classToUpdate = classRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found"));

        String newCode;
        do {
            newCode = generateClassCode();
        } while (classRepository.findByClassCode(newCode).isPresent());

        classToUpdate.setClassCode(newCode);
        classRepository.save(classToUpdate);

        return newCode;
    }
    /**
     * Add a student to a class
     */
    public void addStudentToClass(String studentId, String classId) {
        Class classToUpdate = classRepository.findById(classId)
            .orElseThrow(() -> new IllegalArgumentException("Class not found"));

        List<String> studentIds = classToUpdate.getStudentIds();
        if (studentIds == null) {
            studentIds = new ArrayList<>();
            classToUpdate.setStudentIds(studentIds);
        }

        if (!studentIds.contains(studentId)) {
            studentIds.add(studentId);
            classRepository.save(classToUpdate);
        }
    }

    /**
     * Remove a student from a class
     */
    public void removeStudentFromClass(String studentId, String classId) {
        Class classToUpdate = classRepository.findById(classId)
            .orElseThrow(() -> new IllegalArgumentException("Class not found"));

        List<String> studentIds = classToUpdate.getStudentIds();
        if (studentIds != null && studentIds.contains(studentId)) {
            studentIds.remove(studentId);
            classRepository.save(classToUpdate);
        }
    }

    /**
     * Check if a student is already in a class
     */
    public boolean isStudentInClass(String studentId, String classId) {
        Class classToCheck = classRepository.findById(classId)
            .orElseThrow(() -> new IllegalArgumentException("Class not found"));

        List<String> studentIds = classToCheck.getStudentIds();
        return studentIds != null && studentIds.contains(studentId);
    }


    /**
     * Get classes where user is teacher
     */
    public List<Class> getClassesByTeacherId(String teacherId) {
        return classRepository.findByTeacherId(teacherId);
    }

    /**
     * Get classes where user is student
     */
    public List<Class> getClassesByStudentId(String studentId) {
        return classRepository.findByStudentIdsContains(studentId);
    }

    /**
     * Get class by ID
     */
    public Class getClassById(String classId) {
        return classRepository.findById(classId).orElse(null);
    }

    /**
     * Check if user has access to class (either as teacher or student)
     */
    public boolean userHasAccessToClass(String userId, String classId) {
        Class foundClass = classRepository.findById(classId).orElse(null);
        if (foundClass == null) {
            return false;
        }

        // User is teacher of class
        if (foundClass.getTeacherId().equals(userId)) {
            return true;
        }

        // User is student in class
        List<String> studentIds = foundClass.getStudentIds();
        return studentIds != null && studentIds.contains(userId);
    }

    public ClassGameHistory analyzeGameSession(GameSession session) {
        ClassGameHistory history = new ClassGameHistory();

        history.setGameSessionId(session.getId().toString());
        history.setGameId(session.getGameId());
        history.setPlayedOn(session.getEndTime());

        List<Participant> participants = session.getParticipants();
        int totalParticipants = participants.size();

        int classSize = getClassSize(session.getClassId());
        int participationPercentage = classSize == 0 ? 0 : (totalParticipants * 100 / classSize);
        history.setParticipationPercentage(participationPercentage);

        Map<String, StudentPerformanceSummary> performanceMap = new HashMap<>();

        for (Participant p : participants) {
            StudentPerformanceSummary summary = new StudentPerformanceSummary();
            summary.setTotalScore(p.getTotalScore());

            int correctAnswers = 0;
            int incorrectAnswers = 0;
            int completedActivities = 0;
            int skippedActivities = 0;
            long totalResponseTime = 0;
            int responseCount = 0;

            Map<String, Integer> activityScores = new HashMap<>();

            for (GameSession.SessionActivity activity : session.getCompletedActivities()) {
                Optional<GameSession.ParticipantResponse> responseOpt = activity.getResponses().stream()
                    .filter(r -> r.getParticipantId().equals(p.getUserId()))
                    .findFirst();

                if (responseOpt.isPresent()) {
                    GameSession.ParticipantResponse response = responseOpt.get();
                    completedActivities++;

                    if (response.isCorrect()) {
                        correctAnswers++;
                    } else {
                        incorrectAnswers++;
                    }

                    activityScores.put(activity.getActivityId(), response.getPointsEarned());
                    totalResponseTime += response.getTimeSpent();
                    responseCount++;
                } else {
                    skippedActivities++;
                }
            }

            summary.setCorrectAnswers(correctAnswers);
            summary.setIncorrectAnswers(incorrectAnswers);
            summary.setCompletedActivities(completedActivities);
            summary.setSkippedActivities(skippedActivities);
            summary.setActivityScores(activityScores);
            summary.setAverageResponseTime(responseCount == 0 ? 0 : totalResponseTime / responseCount);

            performanceMap.put(p.getUserId(), summary);
        }

        history.setStudentPerformance(performanceMap);

        double totalScoreSum = performanceMap.values().stream()
            .mapToDouble(StudentPerformanceSummary::getTotalScore)
            .sum();
        history.setClassAverageScore(totalParticipants == 0 ? 0 : totalScoreSum / totalParticipants);

        return history;
    }

    private int getClassSize(String classId) {
        Optional<Class> classOpt = classRepository.findById(classId);
        return classOpt.map(c -> c.getStudentIds().size()).orElse(0);
    }

    public SubjectProgress calculateSubjectProgress(GameSession session) {
        // B1: Lấy thông tin Game
        Games game = gamesRepository.findById(session.getGameId())
            .orElseThrow(() -> new RuntimeException("Game not found: " + session.getGameId()));

        // B2: Lấy subject
        String subject = game.getSubject();

        // B3: Tính totalActivitiesCompleted và lastActivity
        int completed = session.getCompletedActivities().size();

        LocalDateTime lastActivityLocal = session.getCompletedActivities().stream()
            .map(activity -> {
                Date endDate = activity.getEndTime();
                if (endDate == null) return null;
                return LocalDateTime.ofInstant(endDate.toInstant(), ZoneId.systemDefault());
            })
            .filter(Objects::nonNull)
            .max(Comparator.naturalOrder())
            .orElse(null);

        Date lastActivity = null;
        if (lastActivityLocal != null) {
            lastActivity = Date.from(lastActivityLocal.atZone(ZoneId.systemDefault()).toInstant());
        }

        // B4: Tính averageScore
        Map<String, PerformanceMetric> perfMap = session.getStatistics().getActivityPerformance();
        double avgScoreNormalized = perfMap.values().stream()
            .mapToDouble(PerformanceMetric::getAverageScore)
            .average()
            .orElse(0.0);

        double avgScore = avgScoreNormalized * 10;

        // // B5: Tính topicScores nếu cần (dựa trên activityId → topic)
        // Map<String, List<Double>> topicToScores = new HashMap<>();
        // for (Map.Entry<String, ActivityPerformance> entry : perfMap.entrySet()) {
        //     String activityId = entry.getKey();
        //     double score = entry.getValue().getAverageScore();

        //     // giả sử bạn có thể lấy topic từ activityId
        //     String topic = activityRepository.findTopicByActivityId(activityId);
        //     topicToScores.computeIfAbsent(topic, k -> new ArrayList<>()).add(score);
        // }

        // Map<String, Double> topicScores = topicToScores.entrySet().stream()
        //     .collect(Collectors.toMap(
        //         Map.Entry::getKey,
        //         e -> e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0)
        //     ));

        // B6: Trả về SubjectProgress
        SubjectProgress sp = new SubjectProgress();
        sp.setSubject(subject);
        sp.setTotalActivitiesCompleted(completed);
        sp.setLastActivity(lastActivity);
        sp.setAverageScore(avgScore);
        return sp;
    }
}



