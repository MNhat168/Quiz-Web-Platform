package com.QuizWeb.TheQuizWeb.Controller;

import com.QuizWeb.TheQuizWeb.DTO.RegisterRequest;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Model.User.UserRole;
import com.QuizWeb.TheQuizWeb.Payload.LoginRequest;
import com.QuizWeb.TheQuizWeb.Payload.LoginResponse;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;
import com.QuizWeb.TheQuizWeb.Security.JwtUtils;
import com.QuizWeb.TheQuizWeb.Security.UserPrincipal;
import com.QuizWeb.TheQuizWeb.Service.EmailService;
import com.QuizWeb.TheQuizWeb.Service.OtpService;
import com.QuizWeb.TheQuizWeb.Service.OtpService.OtpVerificationResult;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

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
    @Autowired
    private OtpService otpService;
    @Autowired
    private EmailService emailService;

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

            return ResponseEntity.ok(new LoginResponse(jwt, user.getRole().name(), user.getDisplayName()));
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
            role = UserRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            return ResponseEntity.badRequest().body("Invalid role. Valid roles: ADMIN, TEACHER, STUDENT");
        }

        // Generate OTP
        String otp = otpService.generateOtp();
        
        // Save OTP to temporary storage
        otpService.saveOtp(request.getEmail(), otp);

        // Send OTP via email
        try {
            emailService.sendOtpEmail(request.getEmail(), otp);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send OTP email");
        }

        // Create user but don't save to database yet
        User user = new User();
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setDisplayName(request.getDisplayName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setCreatedAt(new Date());
        user.setLastLoginAt(null);
        user.setEnabled(false);

        // Save user to temporary storage
        otpService.savePendingUser(request.getEmail(), user);

        return ResponseEntity.ok("OTP has been sent to your email. Please verify to complete registration.");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body("Email and OTP are required");
        }

        // Verify OTP
        OtpVerificationResult result = otpService.verifyOtp(email, otp);
        if (!result.isValid()) {
            return ResponseEntity.badRequest().body(result.getMessage());
        }

        // Get pending user
        User user = otpService.getPendingUser(email);
        if (user == null) {
            return ResponseEntity.badRequest().body("No pending registration found");
        }

        // Enable and save user to database
        user.setEnabled(true);
        userRepository.save(user);

        // Clear OTP and pending user from temporary storage
        otpService.clearOtp(email);
        otpService.clearPendingUser(email);

        return ResponseEntity.ok("Registration successful! Please login.");
    }
}
