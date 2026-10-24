package com.taskflow.stats.dto;

public record TaskSummaryResponse(
    long totalTasks,
    long pendingTasks,
    long inProgressTasks,
    long completedTasks
) {}
