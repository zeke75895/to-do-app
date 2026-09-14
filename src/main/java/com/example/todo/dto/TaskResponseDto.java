package com.example.todo.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponseDto(
        Long id,
        String title,
        String description,
        boolean completed,
        LocalDate dueDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
