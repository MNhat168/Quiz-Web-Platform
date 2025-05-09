package com.QuizWeb.TheQuizWeb.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;

import com.QuizWeb.TheQuizWeb.Model.Activity.TeamChallengeContent;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

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
    private List<ActivityContent> contentItems; // Multiple content items for this activity
    private Object content; // Will be deserialized to specific activity content
    private List<String> tags;
    private List<PowerUpRule> powerUpRules;
    private ActivitySettings settings;
    private Date createdAt;
    private boolean isPublic; 

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
    public static class ActivityContent {
        private String contentId;
        private String title;
        private String instructions;
        private Object data; // The actual content data
        private int duration; // Duration in seconds
    }

    @Data
    public static class PowerUpRule {
        private String powerUpId;
        private int pointThreshold;
        private int maxQuantity;
    }

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
        private List<DrawingPrompt> prompts;
        private PictionarySettings pictionarySettings;
        
        @Data
        public static class DrawingPrompt {
            private String prompt;       
            private String category;      
            private String difficulty;    
            private int timeLimit;       
            private int points;           
            private List<String> hints;  
            private List<String> synonyms; 
        }
        
        @Data
        public static class PictionarySettings {
            private boolean rotateDrawers;      
            private int roundsPerPlayer;        
            private boolean allowPartialPoints; 
            private boolean revealAnswerOnFail;  
            private int maxGuessesPerTeam;       
            private GuessValidation guessValidation; 
        }
        
        public enum GuessValidation {
            EXACT_MATCH,        
            CONTAINS_KEYWORD,   
            SYNONYM_MATCH,     
            MANUAL_TEACHER     
        }
    }

    public String getCorrectAnswer() {
        if (this.contentItems != null && !this.contentItems.isEmpty()) {
            // Handle multi-content activities
            return contentItems.stream()
                .map(contentItem -> getAnswerForContent(contentItem.getData()))
                .filter(Objects::nonNull)
                .collect(Collectors.joining(" | "));
        }
        
        // Fallback to legacy content if no contentItems
        return getAnswerForContent(this.content);
    }
    
    private String getAnswerForContent(Object contentData) {
        if (contentData == null) return null;
    
        switch (this.type) {
            case MULTIPLE_CHOICE:
                if (contentData instanceof MultipleChoiceContent) {
                    MultipleChoiceContent mcContent = (MultipleChoiceContent) contentData;
                    return mcContent.getQuestions().stream()
                        .map(question -> question.getOptions().stream()
                            .filter(Option::isCorrect)
                            .map(Option::getText)
                            .collect(Collectors.joining(", ")))
                        .collect(Collectors.joining("; "));
                }
                break;
    
            case TRUE_FALSE:
                if (contentData instanceof Map) {
                    Map<String, Object> tfContent = (Map<String, Object>) contentData;
                    return tfContent.containsKey("correctAnswer") ? 
                        String.valueOf(tfContent.get("correctAnswer")) : null;
                }
                break;
    
            case FILL_IN_BLANK:
                if (contentData instanceof FillInBlankContent) {
                    FillInBlankContent fbContent = (FillInBlankContent) contentData;
                    return fbContent.getAnswers().values().stream()
                        .collect(Collectors.joining(", "));
                }
                break;
    
            case MATH_PROBLEM:
                if (contentData instanceof MathProblemContent) {
                    return ((MathProblemContent) contentData).getCorrectAnswer();
                }
                break;
    
            case SORTING:
                if (contentData instanceof SortingContent) {
                    SortingContent sContent = (SortingContent) contentData;
                    return "Correct order: " + sContent.getItems().stream()
                        .sorted(Comparator.comparingInt(SortItem::getCorrectPosition))
                        .map(SortItem::getText)
                        .collect(Collectors.joining(" → "));
                }
                break;
    
            case MATCHING:
                if (contentData instanceof MatchingContent) {
                    MatchingContent mContent = (MatchingContent) contentData;
                    return mContent.getPairs().stream()
                        .map(pair -> pair.getItem1() + " → " + pair.getItem2())
                        .collect(Collectors.joining(", "));
                }
                break;
    
            case TEAM_CHALLENGE:
                if (contentData instanceof TeamChallengeContent) {
                    TeamChallengeContent tcContent = (TeamChallengeContent) contentData;
                    return tcContent.getPrompts().stream()
                        .map(prompt -> {
                            StringBuilder sb = new StringBuilder(prompt.getPrompt());
                            if (prompt.getSynonyms() != null && !prompt.getSynonyms().isEmpty()) {
                                sb.append(" (or ")
                                  .append(String.join(", ", prompt.getSynonyms()))
                                  .append(")");
                            }
                            return sb.toString();
                        })
                        .collect(Collectors.joining(" | "));
                }
                break;
    
            default:
                return "No single correct answer for this activity type";
        }
        return null;
    }

    public String getExplanation() {
        if (this.content == null) {
            return null;
        }

        switch (this.type) {
            case MULTIPLE_CHOICE:
                if (this.content instanceof MultipleChoiceContent) {
                    MultipleChoiceContent mcContent = (MultipleChoiceContent) this.content;
                    if (mcContent.getQuestions() != null && !mcContent.getQuestions().isEmpty()) {
                        QuestionItem question = mcContent.getQuestions().get(0);
                        return question.getExplanation();
                    }
                }
                break;

            case MATH_PROBLEM:
                if (this.content instanceof MathProblemContent) {
                    MathProblemContent mpContent = (MathProblemContent) this.content;
                    if (mpContent.getSolutionSteps() != null) {
                        return String.join("\n", mpContent.getSolutionSteps());
                    }
                }
                break;

            default:
                return null;
        }

        return null;
    }
}