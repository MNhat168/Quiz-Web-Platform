package com.QuizWeb.TheQuizWeb.Payload;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}