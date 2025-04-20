package com.QuizWeb.TheQuizWeb.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LeaveSessionRequest {
    @NotBlank(message = "Session ID is required")
    private String sessionId;
}
