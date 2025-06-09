package com.example.assignmentreminder.repository;

import com.example.assignmentreminder.model.Assignment;
import com.example.assignmentreminder.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByUser(AppUser user);
    Optional<Assignment> findByIdAndUser(Long id,AppUser user);
    void deleteByIdAndUser(Long id, AppUser user);
}
