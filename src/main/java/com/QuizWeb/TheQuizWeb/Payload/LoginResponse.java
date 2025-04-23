package com.QuizWeb.TheQuizWeb.Payload;


import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private String role;
    private String name;

    public LoginResponse(String token, String role, String name) {
        this.token = token;
        this.role = role;
        this.name = name;
    }

    public String getToken() {
        return token;
    }

    public String getRole() {
        return role;
    }

    public String getName() {
        return name;
    }
}
