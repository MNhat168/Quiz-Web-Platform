package com.QuizWeb.TheQuizWeb.DTO;

import lombok.Data;

@Data
public class SessionUpdateDTO {
    private String sessionId;
    private String updateType; // e.g., "NEW_PARTICIPANT", "PARTICIPANT_LEFT", "ACTIVITY_CHANGED", etc.
    private Object data; // The actual update data (participant, activity, etc.)
}
