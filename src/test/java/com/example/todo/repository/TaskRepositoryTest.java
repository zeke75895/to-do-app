package com.example.todo.repository;

import com.example.todo.entity.Task;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * @DataJpaTest loads only the JPA slice of the application: the entities, Spring Data
 * repositories, and an embedded database (H2 here) - no web layer, no @Service or
 * @Controller beans. Each test method runs inside a transaction that's rolled back
 * automatically afterward, so tests can freely save() data without cleaning it up or
 * polluting other tests. This is the opposite slice from TaskControllerTest's
 * @WebMvcTest, which loads the web layer and explicitly excludes the database.
 */
@DataJpaTest
class TaskRepositoryTest {

    @Autowired
    private TaskRepository taskRepository;

    @Test
    void findByCompleted_returnsOnlyMatchingTasks() {
        taskRepository.save(Task.builder().title("Done task").completed(true).build());
        taskRepository.save(Task.builder().title("Pending task").completed(false).build());

        List<Task> completedTasks = taskRepository.findByCompleted(true);

        assertThat(completedTasks).hasSize(1);
        assertThat(completedTasks.get(0).getTitle()).isEqualTo("Done task");
    }

    @Test
    void findByDueDateBefore_returnsOnlyTasksDueBeforeGivenDate() {
        taskRepository.save(Task.builder()
                .title("Overdue").completed(false).dueDate(LocalDate.now().minusDays(1)).build());
        taskRepository.save(Task.builder()
                .title("Future").completed(false).dueDate(LocalDate.now().plusDays(5)).build());

        List<Task> overdue = taskRepository.findByDueDateBefore(LocalDate.now());

        assertThat(overdue).extracting(Task::getTitle).containsExactly("Overdue");
    }

    @Test
    void findByTitleContainingIgnoreCase_matchesRegardlessOfCase() {
        taskRepository.save(Task.builder().title("Write Spring Boot report").completed(false).build());
        taskRepository.save(Task.builder().title("Buy groceries").completed(false).build());

        List<Task> results = taskRepository.findByTitleContainingIgnoreCase("SPRING boot");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Write Spring Boot report");
    }
}
