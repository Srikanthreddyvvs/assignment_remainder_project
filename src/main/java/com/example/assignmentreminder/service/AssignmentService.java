package com.example.assignmentreminder.service;

import com.example.assignmentreminder.model.Assignment;
import com.example.assignmentreminder.model.AppUser;
import com.example.assignmentreminder.repository.AssignmentRepository;
import com.example.assignmentreminder.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    public AssignmentService(AssignmentRepository assignmentRepository, UserRepository userRepository, JavaMailSender mailSender) {
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    private AppUser getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new RuntimeException("No authenticated user found");
        }
        String username = auth.getName();
        Optional<AppUser> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        return userOpt.get();
    }

    public Assignment saveAssignment(Assignment assignment) {
        AppUser user = getCurrentUser();
        assignment.setUser(user);
        return assignmentRepository.save(assignment);
    }

    public List<Assignment> getAllAssignments() {
        AppUser user = getCurrentUser();
        return assignmentRepository.findByUser(user);
    }

    @Transactional
    public void deleteAssignmentById(Long id) {
        AppUser user = getCurrentUser();
        Optional<Assignment> assignmentOpt = assignmentRepository.findByIdAndUser(id, user);
        if (assignmentOpt.isEmpty()) {
            throw new RuntimeException("Assignment not found or unauthorized");
        }
        assignmentRepository.deleteById(id);
    }

    @Scheduled(cron = "0 0 9 * * ?") // daily at 9 AM
    public void sendReminders() {
        List<Assignment> allAssignments = assignmentRepository.findAll();
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Assignment> assignmentsToRemind = new ArrayList<>();

        // Filter assignments manually (no streams)
        for (Assignment a : allAssignments) {
            if (a.getDeadline() != null && a.getDeadline().equals(tomorrow) && a.getStudentEmail() != null) {
                assignmentsToRemind.add(a);
            }
        }

        // Send email reminders
        for (Assignment assignment : assignmentsToRemind) {
            sendEmailReminder(assignment);
        }
    }

    private void sendEmailReminder(Assignment assignment) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(assignment.getStudentEmail());
            message.setSubject("📢 Assignment Reminder: " + assignment.getTitle());

            String text = "Hello,\n\n" +
                    "Your assignment \"" + assignment.getTitle() + "\" is due tomorrow (" + assignment.getDeadline() + ").\n\n" +
                    "Description: " + assignment.getDescription() + "\n\n" +
                    "Please make sure to submit it on time!\n\n" +
                    "Best regards,\nAssignment Reminder Team";

            message.setText(text);
            mailSender.send(message);

            System.out.println("Email sent to: " + assignment.getStudentEmail());
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }
}
