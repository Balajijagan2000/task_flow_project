package com.taskflow.stats.dto;

public record TaskDto(
    Long id,
    Long userId,
    String title,
    String description,
    String status
) {}
