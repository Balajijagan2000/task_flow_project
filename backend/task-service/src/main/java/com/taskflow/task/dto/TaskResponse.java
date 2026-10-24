package com.taskflow.task.dto;

import com.taskflow.task.entity.Task;
import com.taskflow.task.entity.TaskStatus;
import java.time.Instant;

public record TaskResponse(
    Long id,
    Long userId,
    String title,
    String description,
    TaskStatus status,
    Instant createdAt,
    Instant updatedAt
) {
    public static TaskResponse fromEntity(Task task) {
        return new TaskResponse(
            task.getId(),
            task.getUserId(),
            task.getTitle(),
            task.getDescription(),
            task.getStatus(),
            task.getCreatedAt(),
            task.getUpdatedAt()
        );
    }
}
