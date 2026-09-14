package com.example.todo.service;

import com.example.todo.dto.TaskRequestDto;
import com.example.todo.dto.TaskResponseDto;
import com.example.todo.entity.Task;
import com.example.todo.exception.TaskNotFoundException;
import com.example.todo.mapper.TaskMapper;
import com.example.todo.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;

    @Transactional
    public TaskResponseDto create(TaskRequestDto request) {
        Task task = taskMapper.toEntity(request);
        Task saved = taskRepository.save(task);
        return taskMapper.toResponse(saved);
    }

    public List<TaskResponseDto> getAll(Boolean completed, LocalDate dueBefore, String search) {
        return taskRepository.findAll().stream()
                .filter(task -> completed == null || task.isCompleted() == completed)
                .filter(task -> dueBefore == null
                        || (task.getDueDate() != null && task.getDueDate().isBefore(dueBefore)))
                .filter(task -> search == null || search.isBlank()
                        || task.getTitle().toLowerCase().contains(search.toLowerCase()))
                .map(taskMapper::toResponse)
                .toList();
    }

    public TaskResponseDto getById(Long id) {
        Task task = findTaskOrThrow(id);
        return taskMapper.toResponse(task);
    }

    @Transactional
    public TaskResponseDto update(Long id, TaskRequestDto request) {
        Task task = findTaskOrThrow(id);
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setCompleted(request.completed());
        task.setDueDate(request.dueDate());
        Task saved = taskRepository.save(task);
        return taskMapper.toResponse(saved);
    }

    @Transactional
    public TaskResponseDto toggleComplete(Long id) {
        Task task = findTaskOrThrow(id);
        task.setCompleted(!task.isCompleted());
        Task saved = taskRepository.save(task);
        return taskMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new TaskNotFoundException(id);
        }
        taskRepository.deleteById(id);
    }

    private Task findTaskOrThrow(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
    }
}
