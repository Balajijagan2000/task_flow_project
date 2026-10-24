package com.taskflow.task.service;

import com.taskflow.task.dto.CreateTaskRequest;
import com.taskflow.task.dto.TaskResponse;
import com.taskflow.task.dto.UpdateTaskRequest;
import com.taskflow.task.entity.Task;
import com.taskflow.task.entity.TaskStatus;
import com.taskflow.task.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    private TaskService taskService;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository);
    }

    @Test
    @DisplayName("Should create task assigned to specific user")
    void testCreateTask() {
        CreateTaskRequest request = new CreateTaskRequest("Write tests", "Add unit tests", TaskStatus.PENDING);

        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task t = invocation.getArgument(0);
            t.setId(10L);
            return t;
        });

        TaskResponse response = taskService.createTask(1L, request);

        assertNotNull(response);
        assertEquals(10L, response.id());
        assertEquals(1L, response.userId());
        assertEquals("Write tests", response.title());
        assertEquals(TaskStatus.PENDING, response.status());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    @DisplayName("Should retrieve tasks only for the authenticated user")
    void testGetTasksForUser() {
        Task t1 = new Task(1L, "Task 1", "Desc 1", TaskStatus.PENDING);
        t1.setId(101L);
        Task t2 = new Task(1L, "Task 2", "Desc 2", TaskStatus.IN_PROGRESS);
        t2.setId(102L);

        when(taskRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(t1, t2));

        List<TaskResponse> tasks = taskService.getTasksForUser(1L);

        assertEquals(2, tasks.size());
        assertEquals(101L, tasks.get(0).id());
        assertEquals(102L, tasks.get(1).id());
    }

    @Test
    @DisplayName("Should throw exception if task does not belong to user")
    void testGetTaskUnauthorized() {
        when(taskRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> taskService.getTaskById(1L, 99L));
    }

    @Test
    @DisplayName("Should update task status successfully")
    void testUpdateTask() {
        Task existing = new Task(1L, "Old Title", "Old Desc", TaskStatus.PENDING);
        existing.setId(5L);

        when(taskRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateTaskRequest updateReq = new UpdateTaskRequest("New Title", "New Desc", TaskStatus.COMPLETED);
        TaskResponse response = taskService.updateTask(1L, 5L, updateReq);

        assertEquals("New Title", response.title());
        assertEquals(TaskStatus.COMPLETED, response.status());
    }
}
