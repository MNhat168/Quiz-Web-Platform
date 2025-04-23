package com.QuizWeb.TheQuizWeb.Config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.QuizWeb.TheQuizWeb.Security.JwtUtils;
import com.QuizWeb.TheQuizWeb.Security.CustomUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;

    public WebSocketAuthInterceptor(JwtUtils jwtUtils, CustomUserDetailsService userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            System.out.println("[DEBUG] Skipping auth for testing");
            return message; // Bypass auth
        }
        return message;
    }
    // @Override
    // public Message<?> preSend(Message<?> message, MessageChannel channel) {
    // StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message,
    // StompHeaderAccessor.class);

    // if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
    // String token = accessor.getFirstNativeHeader("Authorization");
    // System.out.println("WebSocket CONNECT detected. Token: " + token); // Log
    // token presence

    // if (token != null && token.startsWith("Bearer ")) {
    // token = token.substring(7);
    // System.out.println("Extracted JWT: " + token); // Log extracted token

    // try {
    // String username = jwtUtils.extractUsername(token);
    // System.out.println("Username from token: " + username); // Log extracted
    // username

    // if (username != null) {
    // UserDetails userDetails = userDetailsService.loadUserByUsername(username);
    // System.out.println("User details loaded: " + userDetails.getUsername()); //
    // Log user loading

    // if (jwtUtils.validateToken(token, userDetails)) {
    // System.out.println("Token validated successfully for user: " + username);
    // UsernamePasswordAuthenticationToken auth = new
    // UsernamePasswordAuthenticationToken(
    // userDetails, null, userDetails.getAuthorities());
    // SecurityContextHolder.getContext().setAuthentication(auth);
    // accessor.setUser(auth);
    // }
    // }
    // } catch (Exception e) {
    // System.err.println("WebSocket Auth Error: " + e.getMessage());
    // e.printStackTrace(); // Add detailed logging
    // }
    // }
    // }
    // return message;
    // }
}