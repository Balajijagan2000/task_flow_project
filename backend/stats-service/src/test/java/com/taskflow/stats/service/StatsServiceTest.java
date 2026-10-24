package com.taskflow.stats.service;

import com.taskflow.stats.dto.TaskDto;
import com.taskflow.stats.dto.TaskSummaryResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class StatsServiceTest {

    @Test
    @DisplayName("Should correctly aggregate tasks into status breakdown")
    void testAggregateTaskCounts() throws Exception {
        StatsService statsService = new StatsService("http://localhost:8082");

        List<TaskDto> mockTasks = List.of(
                new TaskDto(1L, 10L, "Task 1", "Desc", "PENDING"),
                new TaskDto(2L, 10L, "Task 2", "Desc", "IN_PROGRESS"),
                new TaskDto(3L, 10L, "Task 3", "Desc", "COMPLETED"),
                new TaskDto(4L, 10L, "Task 4", "Desc", "COMPLETED")
        );

        Method aggregateMethod = StatsService.class.getDeclaredMethod("aggregate", List.class);
        aggregateMethod.setAccessible(true);
        TaskSummaryResponse summary = (TaskSummaryResponse) aggregateMethod.invoke(statsService, mockTasks);

        assertNotNull(summary);
        assertEquals(4, summary.totalTasks());
        assertEquals(1, summary.pendingTasks());
        assertEquals(1, summary.inProgressTasks());
        assertEquals(2, summary.completedTasks());
    }

    @Test
    @DisplayName("Should return zeros when task list is empty")
    void testAggregateEmptyList() throws Exception {
        StatsService statsService = new StatsService("http://localhost:8082");

        Method aggregateMethod = StatsService.class.getDeclaredMethod("aggregate", List.class);
        aggregateMethod.setAccessible(true);
        TaskSummaryResponse summary = (TaskSummaryResponse) aggregateMethod.invoke(statsService, List.of());

        assertNotNull(summary);
        assertEquals(0, summary.totalTasks());
        assertEquals(0, summary.pendingTasks());
        assertEquals(0, summary.inProgressTasks());
        assertEquals(0, summary.completedTasks());
    }
}
