const API_BASE = '/api/tasks';

const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const errorBanner = document.getElementById('error-banner');
const filterButtons = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';

function showError(message) {
    errorBanner.textContent = message;
    errorBanner.hidden = false;
}

function clearError() {
    errorBanner.textContent = '';
    errorBanner.hidden = true;
}

/**
 * Parses the ApiError JSON body our GlobalExceptionHandler returns and surfaces
 * its `message` (falling back to the first field error, or the HTTP status text,
 * for cases where `message` alone isn't specific enough).
 */
async function extractErrorMessage(response) {
    try {
        const body = await response.json();
        if (body.fieldErrors) {
            const firstField = Object.keys(body.fieldErrors)[0];
            return `${firstField}: ${body.fieldErrors[firstField]}`;
        }
        return body.message || `Request failed (${response.status})`;
    } catch {
        return `Request failed (${response.status})`;
    }
}

function filterQueryParam(filter) {
    if (filter === 'pending') return '?completed=false';
    if (filter === 'done') return '?completed=true';
    return '';
}

async function fetchTasks(filter) {
    try {
        const response = await fetch(`${API_BASE}${filterQueryParam(filter)}`);
        if (!response.ok) {
            showError(await extractErrorMessage(response));
            return;
        }
        clearError();
        const tasks = await response.json();
        renderTasks(tasks);
    } catch {
        showError('Could not reach the server. Is it running?');
    }
}

function renderTasks(tasks) {
    taskList.textContent = '';

    for (const task of tasks) {
        const item = document.createElement('li');
        item.className = 'task-item' + (task.completed ? ' completed' : '');
        item.dataset.id = task.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-toggle';
        checkbox.checked = task.completed;

        const content = document.createElement('div');
        content.className = 'task-content';

        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.title;
        content.appendChild(title);

        if (task.description) {
            const description = document.createElement('p');
            description.className = 'task-description';
            description.textContent = task.description;
            content.appendChild(description);
        }

        if (task.dueDate) {
            const due = document.createElement('div');
            due.className = 'task-due';
            due.textContent = `Due: ${task.dueDate}`;
            content.appendChild(due);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'task-delete';
        deleteBtn.textContent = 'Delete';

        item.append(checkbox, content, deleteBtn);
        taskList.appendChild(item);
    }
}

filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        fetchTasks(currentFilter);
    });
});

fetchTasks(currentFilter);
