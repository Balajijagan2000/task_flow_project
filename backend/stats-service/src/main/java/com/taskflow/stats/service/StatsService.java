package com.taskflow.stats.service;

import com.taskflow.stats.dto.TaskDto;
import com.taskflow.stats.dto.TaskSummaryResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

@Service
public class StatsService {

    private final RestClient restClient;
    
    @Autowired
    public StatsService(@Value("${task-service.base-url:http://localhost:8082}") String taskServiceBaseUrl) {
        this(RestClient.builder().baseUrl(taskServiceBaseUrl).build());
    }

    public StatsService(RestClient restClient) {
        this.restClient = restClient;
    }

    public TaskSummaryResponse getUserSummary(Long userId) {
        try {
            List<TaskDto> tasks = restClient.get()
                    .uri("/api/tasks/internal/user/{userId}", userId)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new IllegalStateException("Task service returned error: " + res.getStatusCode());
                    })
                    .body(new ParameterizedTypeReference<List<TaskDto>>() {});

            return aggregate(tasks);
        } catch (RestClientException e) {
            throw new IllegalStateException("Unable to reach Task Service: " + e.getMessage(), e);
        }
    }

    public TaskSummaryResponse getAdminSummary() {
        try {
            List<TaskDto> tasks = restClient.get()
                    .uri("/api/tasks/internal/all")
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new IllegalStateException("Task service returned error: " + res.getStatusCode());
                    })
                    .body(new ParameterizedTypeReference<List<TaskDto>>() {});

            return aggregate(tasks);
        } catch (RestClientException e) {
            throw new IllegalStateException("Unable to reach Task Service: " + e.getMessage(), e);
        }
    }

    private TaskSummaryResponse aggregate(List<TaskDto> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return new TaskSummaryResponse(0, 0, 0, 0);
        }

        long total = tasks.size();
        long pending = tasks.stream().filter(t -> "PENDING".equalsIgnoreCase(t.status())).count();
        long inProgress = tasks.stream().filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.status())).count();
        long completed = tasks.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.status())).count();

        return new TaskSummaryResponse(total, pending, inProgress, completed);
    }
}
