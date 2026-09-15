# Todo App

A simple task management web application. It provides a REST API for creating, updating, completing, and deleting tasks, along with a minimal HTML/CSS/JavaScript frontend for managing your to-do list in the browser.

## Features

- Create, view, update, and delete tasks
- Mark tasks as complete/incomplete
- Filter tasks by completion status, due date, or search text
- Field validation (e.g. required title, max lengths) with clear error messages
- Minimal, dependency-free frontend that talks to the REST API

## Technologies Used

- **Java 21**
- **Spring Boot 4** (Spring MVC, Spring Data JPA, Bean Validation)
- **H2 Database** — in-memory database used for local development
- **Lombok** — reduces boilerplate on entity/model classes
- **Maven** — build and dependency management
- **HTML, CSS, and vanilla JavaScript** — frontend, served as static resources

## Project Structure

```
src/main/java/com/example/todo/
├── controller/    REST endpoints (TaskController)
├── service/       Business logic
├── repository/    Spring Data JPA repository
├── entity/        JPA entity (Task)
├── dto/           Request/response DTOs
├── mapper/        Entity <-> DTO mapping
├── exception/      Custom exceptions and global error handling
└── config/        Application configuration (H2 console setup)

src/main/resources/
├── application.yml   Application configuration
└── static/            Frontend (index.html, style.css, app.js)
```

## API Endpoints

Base path: `/api/tasks`

| Method | Path                  | Description                                  |
|--------|-----------------------|-----------------------------------------------|
| POST   | `/api/tasks`           | Create a new task                             |
| GET    | `/api/tasks`           | List tasks (supports `completed`, `dueBefore`, `search` query params) |
| GET    | `/api/tasks/{id}`      | Get a single task by id                       |
| PUT    | `/api/tasks/{id}`      | Update a task                                 |
| PATCH  | `/api/tasks/{id}/complete` | Toggle a task's completed status         |
| DELETE | `/api/tasks/{id}`      | Delete a task                                 |

A task has the following fields: `title` (required, max 100 chars), `description` (optional, max 500 chars), `completed` (boolean), and `dueDate`.

## Local Setup

### Prerequisites

- Java 21 or later
- Maven Wrapper is included, so a separate Maven install is not required

### Running the app

Clone the repository and run it with the included Maven wrapper:

```bash
./mvnw spring-boot:run
```

On Windows:

```bash
mvnw.cmd spring-boot:run
```

The app starts on **http://localhost:8080**. Open that URL in a browser to use the frontend, or call the API directly (e.g. with `curl` or Postman).

### Database

This project uses an in-memory H2 database, so no external database setup is required — data resets each time the app restarts.

To inspect the database directly, the H2 web console runs on its own port:

1. Start the app.
2. Open **http://localhost:8082** in a browser.
3. Log in with:
   - **JDBC URL:** `jdbc:h2:mem:tododb`
   - **User Name:** `sa`
   - **Password:** (leave blank)

### Running tests

```bash
./mvnw test
```
