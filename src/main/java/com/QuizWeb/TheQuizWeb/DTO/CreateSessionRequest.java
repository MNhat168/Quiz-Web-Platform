package com.QuizWeb.TheQuizWeb.DTO;

import com.QuizWeb.TheQuizWeb.Model.SessionSettings;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class CreateSessionRequest {
    @NotBlank(message = "Game ID is required")
    private String gameId;

    @NotBlank(message = "Class ID is required")
    private String classId;

    @NotNull(message = "Session settings are required")
    private SessionSettings settings;
}

