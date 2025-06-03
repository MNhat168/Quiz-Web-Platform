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
        config.put("cloud_name", "daayxb5al");
        config.put("api_key", "226131283968485");
        config.put("api_secret", "--j4yAxoZHsAY6cZoadHEESLoO0");
        return new Cloudinary(config);
    }
}
