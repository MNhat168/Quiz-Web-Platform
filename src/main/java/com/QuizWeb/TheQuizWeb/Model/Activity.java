package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "activities")
public class Activity {
    @Id
    private String id;
    private String creatorId; // Teacher who created this activity
    private String title;
    private ActivityType type;
    private String instructions;
    private List<String> mediaUrls;
    private int timeLimit; // In seconds
    private int points;
    private String difficulty; // EASY, MEDIUM, HARD
    private String subject;
    private String topic;
    private String learningObjective;
    private String gradeLevel;
    private Object content; // Will be deserialized to specific activity content
    private List<String> tags;
    private List<PowerUpRule> powerUpRules;
    private ActivitySettings settings;
    private Date createdAt;
    private boolean isPublic; // Whether other teachers can use this activity

    public enum ActivityType {
        MULTIPLE_CHOICE, TRUE_FALSE, OPEN_ENDED, PUZZLE, SORTING, MATCHING,
        TEAM_CHALLENGE, CREATIVE_RESPONSE, FILL_IN_BLANK, DIAGRAM_LABELING,
        MATH_PROBLEM, CODE_CHALLENGE
    }

    @Data
    public static class ActivitySettings {
        private boolean showTimer;
        private boolean showPoints;
        private boolean allowSkipping;
        private String scoringType; // TIME_BASED, ACCURACY_BASED, HYBRID
        private boolean showHints;
        private int maxHints;
        private boolean showFeedback;
        private boolean requireExplanation; // Require student to explain their answer
    }

    @Data
    public static class PowerUpRule {
        private String powerUpId;
        private int pointThreshold;
        private int maxQuantity;
    }

    // Activity Content Models (polymorphic design)
    @Data
    public static class MultipleChoiceContent {
        private List<QuestionItem> questions;
        private boolean allowMultipleAnswers;
        private List<String> hints;
    }
    
    @Data
    public static class QuestionItem {
        private String question;
        private List<Option> options;
        private String explanation;
    }

    @Data
    public static class Option {
        private String text;
        private boolean isCorrect;
        private String explanation; // Explanation shown after answering
    }

    @Data
    public static class SortingContent {
        private String instructions;
        private List<SortItem> items;
        private List<String> hints;
    }

    @Data
    public static class SortItem {
        private String text;
        private String imageUrl;
        private int correctPosition;
    }

    @Data
    public static class MatchingContent {
        private List<MatchPair> pairs;
        private boolean shuffleOptions;
        private List<String> hints;
    }

    @Data
    public static class MatchPair {
        private String item1;
        private String item2;
        private String item1ImageUrl;
        private String item2ImageUrl;
    }

    @Data
    public static class FillInBlankContent {
        private String text; // Text with blanks marked as [blank1], [blank2], etc.
        private Map<String, String> answers; // Map of blank IDs to correct answers
        private Map<String, List<String>> acceptableAnswers; // Map of blank IDs to list of acceptable answers
        private List<String> hints;
    }

    @Data
    public static class MathProblemContent {
        private String problem;
        private String correctAnswer;
        private List<String> solutionSteps;
        private boolean requireStepByStep; // Whether student must show work
        private List<String> hints;
    }

    @Data
    public static class TeamChallengeContent {
        private List<String> prompts; // List of drawing prompts
        private int roundTime; // Seconds per round
        private int maxRounds;
        private boolean allowGuessing; // Team members can guess
        private int pointsPerCorrect;
        private List<String> allowedWords; // Optional restricted word list
    }
}
