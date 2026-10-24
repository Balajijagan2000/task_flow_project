package com.taskflow.task.repository;

import com.taskflow.task.entity.Task;
import com.taskflow.task.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Task> findByIdAndUserId(Long id, Long userId);
    long countByUserIdAndStatus(Long userId, TaskStatus status);
    long countByUserId(Long userId);
    long countByStatus(TaskStatus status);
}
