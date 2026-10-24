package com.taskflow.auth.dto;

import java.time.Instant;

public record UserResponse(
    Long id,
    String username,
    String email,
    String role,
    Instant createdAt
) {}
