package com.QuizWeb.TheQuizWeb.Service;

import com.QuizWeb.TheQuizWeb.Model.Class;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Repository.ClassRepository;
import com.QuizWeb.TheQuizWeb.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ClassService {

    @Autowired
    private ClassRepository classRepository;

    @Autowired
    private UserRepository userRepository;

    public Class createClass(Class newClass, String classCode) {
        // Initialize empty lists if null
        if (newClass.getStudentIds() == null) {
            newClass.setStudentIds(new ArrayList<>());
        }
        if (newClass.getAssignedGameIds() == null) {
            newClass.setAssignedGameIds(new ArrayList<>());
        }
        if (newClass.getGameHistory() == null) {
            newClass.setGameHistory(new ArrayList<>());
        }
        if (newClass.getSubjectProgress() == null) {
            newClass.setSubjectProgress(new HashMap<>());
        }

        // Set the class code
        newClass.setClassCode(classCode);

        // Save class
        return classRepository.save(newClass);
    }

    public String generateClassCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        SecureRandom random = new SecureRandom();
        int codeLength = 6;

        String code;
        do {
            StringBuilder sb = new StringBuilder(codeLength);
            for (int i = 0; i < codeLength; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            code = sb.toString();
        } while (classRepository.findByClassCode(code).isPresent()); // Check against database

        return code;
    }

    public Class getClassByCode(String classCode) {
        return classRepository.findByClassCode(classCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid class code"));
    }

    public String regenerateClassCode(String classId) {
        Class classToUpdate = classRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found"));

        String newCode;
        do {
            newCode = generateClassCode();
        } while (classRepository.findByClassCode(newCode).isPresent());

        classToUpdate.setClassCode(newCode);
        classRepository.save(classToUpdate);

        return newCode;
    }
    /**
     * Add a student to a class
     */
    public void addStudentToClass(String studentId, String classId) {
        Class classToUpdate = classRepository.findById(classId)
            .orElseThrow(() -> new IllegalArgumentException("Class not found"));

        List<String> studentIds = classToUpdate.getStudentIds();
        if (studentIds == null) {
            studentIds = new ArrayList<>();
            classToUpdate.setStudentIds(studentIds);
        }

        if (!studentIds.contains(studentId)) {
            studentIds.add(studentId);
            classRepository.save(classToUpdate);
        }
    }

    /**
     * Remove a student from a class
     */
    public void removeStudentFromClass(String studentId, String classId) {
        Class classToUpdate = classRepository.findById(classId)
            .orElseThrow(() -> new IllegalArgumentException("Class not found"));

        List<String> studentIds = classToUpdate.getStudentIds();
        if (studentIds != null && studentIds.contains(studentId)) {
            studentIds.remove(studentId);
            classRepository.save(classToUpdate);
        }
    }

    /**
     * Check if a student is already in a class
     */
    public boolean isStudentInClass(String studentId, String classId) {
        Class classToCheck = classRepository.findById(classId)
            .orElseThrow(() -> new IllegalArgumentException("Class not found"));

        List<String> studentIds = classToCheck.getStudentIds();
        return studentIds != null && studentIds.contains(studentId);
    }


    /**
     * Get classes where user is teacher
     */
    public List<Class> getClassesByTeacherId(String teacherId) {
        return classRepository.findByTeacherId(teacherId);
    }

    /**
     * Get classes where user is student
     */
    public List<Class> getClassesByStudentId(String studentId) {
        return classRepository.findByStudentIdsContains(studentId);
    }

    /**
     * Get class by ID
     */
    public Class getClassById(String classId) {
        return classRepository.findById(classId).orElse(null);
    }

    /**
     * Check if user has access to class (either as teacher or student)
     */
    public boolean userHasAccessToClass(String userId, String classId) {
        Class foundClass = classRepository.findById(classId).orElse(null);
        if (foundClass == null) {
            return false;
        }

        // User is teacher of class
        if (foundClass.getTeacherId().equals(userId)) {
            return true;
        }

        // User is student in class
        List<String> studentIds = foundClass.getStudentIds();
        return studentIds != null && studentIds.contains(userId);
    }
}

