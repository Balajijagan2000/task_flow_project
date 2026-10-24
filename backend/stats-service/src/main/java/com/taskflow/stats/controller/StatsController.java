package com.taskflow.stats.controller;

import com.taskflow.stats.dto.TaskSummaryResponse;
import com.taskflow.stats.security.UserPrincipal;
import com.taskflow.stats.service.StatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<TaskSummaryResponse> getSummary(@AuthenticationPrincipal UserPrincipal principal) {
        TaskSummaryResponse response = statsService.getUserSummary(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskSummaryResponse> getAdminSummary() {
        TaskSummaryResponse response = statsService.getAdminSummary();
        return ResponseEntity.ok(response);
    }
}
