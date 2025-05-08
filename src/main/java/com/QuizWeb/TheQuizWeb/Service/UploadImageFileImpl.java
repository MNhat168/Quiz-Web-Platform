package com.QuizWeb.TheQuizWeb.Service;
import java.io.File;
import java.io.InputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

import org.apache.tomcat.util.buf.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UploadImageFileImpl implements UploadImageFile{

    private final Cloudinary cloudinary;

    @Override
    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Filename cannot be null or blank");
        }
        
        String[] fileNameParts = getFileName(originalFilename);
        if (fileNameParts.length < 2 || fileNameParts[1] == null) {
            throw new IllegalArgumentException("File must have an extension");
        }
        
        String publicValue = generatePublicValue(originalFilename);
        String extension = fileNameParts[1];
        
        try {
            File fileUpload = convert(file);
            log.info("Attempting to upload file: {}", fileUpload.getAbsolutePath());
            
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                fileUpload, 
                ObjectUtils.asMap("public_id", publicValue)
            );
            
            // 5. Kiểm tra kết quả upload
            if (uploadResult.get("url") == null) {
                throw new RuntimeException("Upload failed - no URL returned");
            }
            
            cleanDisk(fileUpload);
            String filePath = cloudinary.url().generate(publicValue + "." + extension);
            
            log.info("File uploaded successfully to: {}", filePath);
            return filePath;
            
        } catch (IOException e) {
            log.error("File upload failed", e);
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    private File convert(MultipartFile file) throws IOException {
        assert file.getOriginalFilename() != null;
        File convFile = new File(StringUtils.join(generatePublicValue(file.getOriginalFilename()), getFileName(file.getOriginalFilename())[1]));
        try(InputStream is = file.getInputStream()) {
            Files.copy(is, convFile.toPath());
        }
        return convFile;
    }

    private void cleanDisk(File file) {
        try {
            Path filePath = file.toPath();
            Files.delete(filePath);
        } catch (IOException e) {
            log.error("Error");
        }
    }

    public String generatePublicValue(String originalName){
        String fileName = getFileName(originalName)[0];
        return String.join(UUID.randomUUID().toString(), "_", fileName);
    }
    
    public String[] getFileName(String originalName){
        return originalName.split("\\.");
    }
}
