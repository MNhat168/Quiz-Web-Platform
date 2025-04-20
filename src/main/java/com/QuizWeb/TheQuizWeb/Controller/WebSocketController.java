package com.QuizWeb.TheQuizWeb.Controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.QuizWeb.TheQuizWeb.Service.GameSessionService;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private GameSessionService gameSessionService;

    @MessageMapping("/session/{accessCode}/heartbeat")
    public void updateHeartbeat(@DestinationVariable String accessCode, String studentId) {
        gameSessionService.updateParticipantStatus(accessCode, studentId);
    }

    @MessageMapping("/session/{accessCode}/chat")
    public void processMessage(@DestinationVariable String accessCode, Map<String, String> message) {
        // This method handles chat messages in the game session
        messagingTemplate.convertAndSend("/topic/session/" + accessCode + "/chat", message);
    }
}