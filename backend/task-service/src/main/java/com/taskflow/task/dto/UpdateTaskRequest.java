package com.taskflow.task.dto;

import com.taskflow.task.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateTaskRequest(
    @NotBlank(message = "Task title is required")
    @Size(max = 200, message = "Task title cannot exceed 200 characters")
    String title,

    String description,

    @NotNull(message = "Task status is required")
    TaskStatus status
) {}
