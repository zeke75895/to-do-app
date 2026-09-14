package com.example.todo.controller;

import com.example.todo.dto.TaskRequestDto;
import com.example.todo.dto.TaskResponseDto;
import com.example.todo.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponseDto> create(@Valid @RequestBody TaskRequestDto request) {
        TaskResponseDto created = taskService.create(request);
        return ResponseEntity.created(URI.create("/api/tasks/" + created.id())).body(created);
    }

    @GetMapping
    public ResponseEntity<List<TaskResponseDto>> getAll(
            @RequestParam(required = false) Boolean completed,
            @RequestParam(required = false) LocalDate dueBefore,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(taskService.getAll(completed, dueBefore, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponseDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponseDto> update(
            @PathVariable Long id, @Valid @RequestBody TaskRequestDto request) {
        return ResponseEntity.ok(taskService.update(id, request));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<TaskResponseDto> toggleComplete(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.toggleComplete(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
