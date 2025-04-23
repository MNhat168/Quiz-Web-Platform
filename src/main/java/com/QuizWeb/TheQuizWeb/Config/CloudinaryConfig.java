package com.QuizWeb.TheQuizWeb.Config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;

@Configuration
public class CloudinaryConfig {
    
    @Bean
    public Cloudinary configKey() {
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", "dgkkdyrug");
        config.put("api_key", "919918947212721");
        config.put("api_secret", "lo1SodWru4UXcmF1j4fYihIyzHg");
        return new Cloudinary(config);
    }
}
