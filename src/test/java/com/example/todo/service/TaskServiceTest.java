package com.example.todo.service;

import com.example.todo.dto.TaskRequestDto;
import com.example.todo.dto.TaskResponseDto;
import com.example.todo.entity.Task;
import com.example.todo.exception.TaskNotFoundException;
import com.example.todo.mapper.TaskMapper;
import com.example.todo.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Pure Mockito unit test: no Spring context is started at all. TaskRepository and
 * TaskMapper are mocks, so this only exercises TaskService's own logic (the not-found
 * branch, the fetch-then-mutate update flow, the toggle logic) in isolation and runs
 * in milliseconds. Contrast with TaskControllerTest (@WebMvcTest, loads the web layer)
 * and TaskRepositoryTest (@DataJpaTest, loads a real database) below.
 */
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskMapper taskMapper;

    @InjectMocks
    private TaskService taskService;

    @Test
    void create_savesEntityAndReturnsMappedResponse() {
        TaskRequestDto request = new TaskRequestDto("Write report", "desc", false, LocalDate.now());
        Task entityToSave = Task.builder().title("Write report").description("desc").build();
        Task savedEntity = Task.builder().id(1L).title("Write report").description("desc").build();
        TaskResponseDto expectedResponse =
                new TaskResponseDto(1L, "Write report", "desc", false, null, null, null);

        when(taskMapper.toEntity(request)).thenReturn(entityToSave);
        when(taskRepository.save(entityToSave)).thenReturn(savedEntity);
        when(taskMapper.toResponse(savedEntity)).thenReturn(expectedResponse);

        TaskResponseDto result = taskService.create(request);

        assertThat(result).isEqualTo(expectedResponse);
        verify(taskRepository).save(entityToSave);
    }

    @Test
    void getById_throwsTaskNotFoundException_whenTaskDoesNotExist() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getById(99L))
                .isInstanceOf(TaskNotFoundException.class)
                .hasMessageContaining("99");

        verifyNoInteractions(taskMapper);
    }

    @Test
    void toggleComplete_flipsCompletedFlagOnTheManagedEntity() {
        Task existing = Task.builder().id(1L).title("Task").completed(false).build();
        when(taskRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(existing)).thenReturn(existing);
        when(taskMapper.toResponse(existing))
                .thenReturn(new TaskResponseDto(1L, "Task", null, true, null, null, null));

        TaskResponseDto result = taskService.toggleComplete(1L);

        assertThat(existing.isCompleted()).isTrue();
        assertThat(result.completed()).isTrue();
    }

    @Test
    void delete_throwsTaskNotFoundException_whenTaskDoesNotExist() {
        when(taskRepository.existsById(42L)).thenReturn(false);

        assertThatThrownBy(() -> taskService.delete(42L))
                .isInstanceOf(TaskNotFoundException.class);

        verify(taskRepository, never()).deleteById(any());
    }

    @Test
    void delete_removesTask_whenTaskExists() {
        when(taskRepository.existsById(1L)).thenReturn(true);

        taskService.delete(1L);

        verify(taskRepository).deleteById(1L);
    }
}
