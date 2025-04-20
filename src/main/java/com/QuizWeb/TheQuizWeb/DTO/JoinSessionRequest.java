package com.QuizWeb.TheQuizWeb.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinSessionRequest {
    @NotBlank(message = "Access code is required")
    private String accessCode;
}
