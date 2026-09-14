package com.example.todo.controller;

import com.example.todo.dto.TaskRequestDto;
import com.example.todo.dto.TaskResponseDto;
import com.example.todo.service.TaskService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * @WebMvcTest loads only the web layer: DispatcherServlet, the named controller,
 * @ControllerAdvice beans, JSON message converters, and Bean Validation - no @Service
 * or @Repository beans, no database. TaskService is replaced with a Mockito mock via
 * @MockitoBean, so these tests verify HTTP concerns (status codes, headers, JSON
 * shape, validation wiring) in isolation from business logic. Contrast with
 * TaskRepositoryTest's @DataJpaTest, which loads a real database but no web layer,
 * and TaskServiceTest, which loads no Spring context at all.
 */
@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TaskService taskService;

    @Test
    void create_returns201WithLocationHeaderAndBody() throws Exception {
        TaskRequestDto request = new TaskRequestDto("Write report", "Q3 summary", false, LocalDate.of(2026, 12, 1));
        TaskResponseDto response = new TaskResponseDto(
                1L, "Write report", "Q3 summary", false, LocalDate.of(2026, 12, 1),
                LocalDateTime.now(), LocalDateTime.now());

        when(taskService.create(any(TaskRequestDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/tasks/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Write report"));
    }

    @Test
    void create_returns400WithFieldErrors_whenTitleIsBlank() throws Exception {
        TaskRequestDto invalidRequest = new TaskRequestDto("", "desc", false, null);

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.title").value("Title is required"));
    }
}
