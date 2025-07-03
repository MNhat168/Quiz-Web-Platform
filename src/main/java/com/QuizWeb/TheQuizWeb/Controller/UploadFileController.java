package com.QuizWeb.TheQuizWeb.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.QuizWeb.TheQuizWeb.Service.UploadImageFile;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.PostMapping;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;


@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@CrossOrigin(origins = "https://quiz-fe-q6sx.vercel.app", allowCredentials = "true")
public class UploadFileController {

    private final UploadImageFile uploadImageFile;

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String url = uploadImageFile.uploadImage(file);
        Map<String, String> response = new HashMap<>();
        response.put("imageUrl", url);
        return ResponseEntity.ok(response);
    }
}
