package com.QuizWeb.TheQuizWeb.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins("https://quiz-fe-q6sx.vercel.app")
            .allowedMethods("*")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}