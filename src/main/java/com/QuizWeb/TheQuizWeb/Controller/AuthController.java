package com.QuizWeb.TheQuizWeb.Controller;

import com.QuizWeb.TheQuizWeb.DTO.RegisterRequest;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Model.User.UserRole;
import com.QuizWeb.TheQuizWeb.Payload.LoginRequest;
import com.QuizWeb.TheQuizWeb.Payload.LoginResponse;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;
import com.QuizWeb.TheQuizWeb.Security.JwtUtils;
import com.QuizWeb.TheQuizWeb.Security.UserPrincipal;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtils jwtUtils;  
    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
            String jwt = jwtUtils.generateToken(user);

            return ResponseEntity.ok(new LoginResponse(jwt, user.getRole().name()));
        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Login failed: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already registered");
        }

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already taken");
        }

        UserRole role;
        try {
            role = UserRole.valueOf(request.getRole().toUpperCase()); // chuyển string thành Enum
        } catch (IllegalArgumentException | NullPointerException e) {
            return ResponseEntity.badRequest().body("Invalid role. Valid roles: ADMIN, TEACHER, STUDENT");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setDisplayName(request.getDisplayName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setCreatedAt(new Date());
        user.setLastLoginAt(null);

        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully");
    }
}
