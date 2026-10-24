package com.taskflow.task.service;

import com.taskflow.task.dto.CreateTaskRequest;
import com.taskflow.task.dto.TaskResponse;
import com.taskflow.task.dto.UpdateTaskRequest;
import com.taskflow.task.entity.Task;
import com.taskflow.task.entity.TaskStatus;
import com.taskflow.task.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Transactional
    public TaskResponse createTask(Long userId, CreateTaskRequest request) {
        TaskStatus status = request.status() != null ? request.status() : TaskStatus.PENDING;
        Task task = new Task(userId, request.title(), request.description(), status);
        Task saved = taskRepository.save(task);
        return TaskResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksForUser(Long userId) {
        return taskRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long userId, Long taskId) {
        Task task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found or access denied for ID: " + taskId));
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public TaskResponse updateTask(Long userId, Long taskId, UpdateTaskRequest request) {
        Task task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found or access denied for ID: " + taskId));

        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status());

        Task updated = taskRepository.save(task);
        return TaskResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteTask(Long userId, Long taskId) {
        Task task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found or access denied for ID: " + taskId));
        taskRepository.delete(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByUserIdInternal(Long userId) {
        return taskRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasksInternal() {
        return taskRepository.findAll()
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }
}
