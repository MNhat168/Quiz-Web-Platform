package com.QuizWeb.TheQuizWeb.Controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.QuizWeb.TheQuizWeb.Service.UploadImageFile;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.PostMapping;

import java.io.IOException;


@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UploadFileController {

    private final UploadImageFile uploadImageFile;

    @PostMapping("/image")
    public String uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        return uploadImageFile.uploadImage(file);
    }
}
