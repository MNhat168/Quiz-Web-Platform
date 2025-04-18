package com.QuizWeb.TheQuizWeb.Service;

import org.springframework.web.multipart.MultipartFile;

public interface UploadImageFile {
    String uploadImage(MultipartFile file) ;
}
