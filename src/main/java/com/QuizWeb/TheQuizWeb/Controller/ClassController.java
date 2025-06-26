package com.QuizWeb.TheQuizWeb.Controller;

import com.QuizWeb.TheQuizWeb.Model.Class;
import com.QuizWeb.TheQuizWeb.Model.Class.ClassGameHistory;
import com.QuizWeb.TheQuizWeb.Model.Class.SubjectProgress;
import com.QuizWeb.TheQuizWeb.Model.GameSession;
import com.QuizWeb.TheQuizWeb.Model.User;
import com.QuizWeb.TheQuizWeb.Repository.GameSessionRepository;
import com.QuizWeb.TheQuizWeb.Service.ClassService;
import com.QuizWeb.TheQuizWeb.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(origins = "https://quiz-fe-q6sx.vercel.app", allowCredentials = "true")
public class ClassController {

    @Autowired
    private ClassService classService;

    @Autowired
    private UserService userService;

    @Autowired
    public GameSessionRepository gameSessionRepository;

    /**
     * Create a new class (Teacher only)
     */

     @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable String userId) {
        User user = userService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        return ResponseEntity.ok(user);
    }


    @PostMapping
    public ResponseEntity<?> createClass(@RequestBody ClassCreateRequest request, Authentication authentication) {
        User teacher = userService.getCurrentUser(authentication);

        // Verify user is a teacher
        if (teacher.getRole() != User.UserRole.TEACHER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only teachers can create classes");
        }

        // Create new class
        Class newClass = new Class();
        newClass.setName(request.getName());
        newClass.setDescription(request.getDescription());
        newClass.setTeacherId(teacher.getId());
        newClass.setCreatedAt(new Date());
        newClass.setActive(true);

        // Generate class code (handled by service)
        String classCode = classService.generateClassCode();

        // Save class with code
        Class savedClass = classService.createClass(newClass, classCode);

        // Add class to teacher's classes
        userService.addClassToUser(teacher.getId(), savedClass.getId());

        // Return class with code
        Map<String, Object> response = new HashMap<>();
        response.put("class", savedClass);
        response.put("classCode", classCode);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all classes for the authenticated teacher
     */
    @GetMapping("/teacher")
    public ResponseEntity<?> getTeacherClasses(Authentication authentication) {
        User teacher = userService.getCurrentUser(authentication);

        // Verify user is a teacher
        if (teacher.getRole() != User.UserRole.TEACHER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only teachers can access this endpoint");
        }

        List<Class> classes = classService.getClassesByTeacherId(teacher.getId());
        return ResponseEntity.ok(classes);
    }

    /**
     * Get all classes for the authenticated student
     */
    @GetMapping("/student")
    public ResponseEntity<?> getStudentClasses(Authentication authentication) {
        User student = userService.getCurrentUser(authentication);

        // Verify user is a student
        if (student.getRole() != User.UserRole.STUDENT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only students can access this endpoint");
        }

        List<Class> classes = classService.getClassesByStudentId(student.getId());
        return ResponseEntity.ok(classes);
    }

    /**
     * Get details for a specific class
     */
    @GetMapping("/{classId}")
    public ResponseEntity<?> getClassDetails(@PathVariable String classId, Authentication authentication) {
        User user = userService.getCurrentUser(authentication);

        // Check if user is allowed to access this class
        if (!classService.userHasAccessToClass(user.getId(), classId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have access to this class");
        }

        Class classDetails = classService.getClassById(classId);
        if (classDetails == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Class not found");
        }

        return ResponseEntity.ok(classDetails);
    }

    /**
     * Join a class (Student only)
     */
    @PostMapping("/join")
    public ResponseEntity<?> joinClass(@RequestBody JoinClassRequest request, Authentication authentication) {
        User student = userService.getCurrentUser(authentication);

        // Verify user is a student
        if (student.getRole() != User.UserRole.STUDENT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only students can join classes");
        }

        try {
            // Find class by code
            Class classToJoin = classService.getClassByCode(request.getClassCode());

            // Check if student is already in class
            if (classService.isStudentInClass(student.getId(), classToJoin.getId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("You're already enrolled in this class");
            }

            // Add student to class and class to student
            classService.addStudentToClass(student.getId(), classToJoin.getId());
            userService.addClassToUser(student.getId(), classToJoin.getId());

            return ResponseEntity.ok("Successfully joined class: " + classToJoin.getName());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid class code");
        }
    }

    /**
     * Remove a student from a class (Teacher only)
     */
    @DeleteMapping("/{classId}/students/{studentId}")
    public ResponseEntity<?> removeStudentFromClass(
            @PathVariable String classId,
            @PathVariable String studentId,
            Authentication authentication) {

        User teacher = userService.getCurrentUser(authentication);

        // Verify user is a teacher
        if (teacher.getRole() != User.UserRole.TEACHER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only teachers can remove students");
        }

        // Verify teacher owns this class
        Class classToUpdate = classService.getClassById(classId);
        if (classToUpdate == null || !classToUpdate.getTeacherId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have permission to modify this class");
        }

        // Remove student from class and class from student
        classService.removeStudentFromClass(studentId, classId);
        userService.removeClassFromUser(studentId, classId);

        return ResponseEntity.ok("Student removed from class");
    }

    /**
     * Generate a new class code (Teacher only)
     */
    @PostMapping("/{classId}/generate-code")
    public ResponseEntity<?> generateNewClassCode(@PathVariable String classId, Authentication authentication) {
        User teacher = userService.getCurrentUser(authentication);

        // Verify user is a teacher
        if (teacher.getRole() != User.UserRole.TEACHER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only teachers can generate class codes");
        }

        // Verify teacher owns this class
        Class classToUpdate = classService.getClassById(classId);
        if (classToUpdate == null || !classToUpdate.getTeacherId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have permission to modify this class");
        }

        // Generate and save new code
        String newCode = classService.regenerateClassCode(classId);

        Map<String, String> response = new HashMap<>();
        response.put("classCode", newCode);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{classId}/game-session")
    public ResponseEntity<List<GameSession>> getGameSessionsByClassId(@PathVariable String classId) {
        List<GameSession> sessions = gameSessionRepository.findByClassId(classId);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/class-game-history/{id}")
    public ResponseEntity<ClassGameHistory> getClassGameHistory(@PathVariable String id) {
        Optional<GameSession> sessionOpt = gameSessionRepository.findById(id);

        if (sessionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ClassGameHistory history = classService.analyzeGameSession(sessionOpt.get());

        return ResponseEntity.ok(history);
    }

    @GetMapping("/subject-progress/{id}")
    public ResponseEntity<SubjectProgress> getSubjectProgress(@PathVariable String id) {
        Optional<GameSession> sessionOpt = gameSessionRepository.findById(id);

        if (sessionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        SubjectProgress progress = classService.calculateSubjectProgress(sessionOpt.get());
        if (progress == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(progress);
    }
}

// Request/Response DTOs

class ClassCreateRequest {
    private String name;
    private String description;

    // Getters and setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}

class JoinClassRequest {
    private String classCode;

    // Getters and setters
    public String getClassCode() {
        return classCode;
    }

    public void setClassCode(String classCode) {
        this.classCode = classCode;
    }
}
