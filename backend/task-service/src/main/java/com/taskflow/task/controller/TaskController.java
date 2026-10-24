package com.taskflow.task.controller;

import com.taskflow.task.dto.CreateTaskRequest;
import com.taskflow.task.dto.TaskResponse;
import com.taskflow.task.dto.UpdateTaskRequest;
import com.taskflow.task.security.UserPrincipal;
import com.taskflow.task.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateTaskRequest request) {
        TaskResponse response = taskService.createTask(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(@AuthenticationPrincipal UserPrincipal principal) {
        List<TaskResponse> tasks = taskService.getTasksForUser(principal.getUserId());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        TaskResponse response = taskService.getTaskById(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request) {
        TaskResponse response = taskService.updateTask(principal.getUserId(), id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        taskService.deleteTask(principal.getUserId(), id);
        return ResponseEntity.noContent().build();
    }

    // Inter-service endpoint for Stats Service
    @GetMapping("/internal/user/{userId}")
    public ResponseEntity<List<TaskResponse>> getTasksForUserInternal(@PathVariable Long userId) {
        return ResponseEntity.ok(taskService.getTasksByUserIdInternal(userId));
    }

    @GetMapping("/internal/all")
    public ResponseEntity<List<TaskResponse>> getAllTasksInternal() {
        return ResponseEntity.ok(taskService.getAllTasksInternal());
    }
}
