package com.example.assignmentreminder.controller;

import com.example.assignmentreminder.model.Assignment;
import com.example.assignmentreminder.service.AssignmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assignments")
public class AssignmentController {
    private final AssignmentService service;

    public AssignmentController(AssignmentService service) {
        this.service = service;
    }

    @PostMapping("/add")
    public Assignment addAssignment(@RequestBody Assignment assignment) {
        return service.saveAssignment(assignment);
    }
    @GetMapping("/all")
    public List<Assignment> getAssignments() {
        return service.getAllAssignments();
    }
    @DeleteMapping("/delete/{id}")
    public String deleteAssignment(@PathVariable Long id) {
        service.deleteAssignmentById(id);
        return "Assignment with ID '" + id + "' has been deleted.";
    }
}
