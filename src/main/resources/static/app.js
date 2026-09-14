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

taskForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(taskForm);
    const payload = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim() || null,
        completed: false,
        dueDate: formData.get('dueDate') || null,
    };

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            showError(await extractErrorMessage(response));
            return;
        }

        clearError();
        taskForm.reset();
        fetchTasks(currentFilter);
    } catch {
        showError('Could not reach the server. Is it running?');
    }
});

filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        fetchTasks(currentFilter);
    });
});

taskList.addEventListener('click', async (event) => {
    const item = event.target.closest('.task-item');
    if (!item) return;
    const id = item.dataset.id;

    if (event.target.classList.contains('task-toggle')) {
        try {
            const response = await fetch(`${API_BASE}/${id}/complete`, { method: 'PATCH' });
            if (!response.ok) {
                showError(await extractErrorMessage(response));
                return;
            }
            clearError();
            fetchTasks(currentFilter);
        } catch {
            showError('Could not reach the server. Is it running?');
        }
        return;
    }

    if (event.target.classList.contains('task-delete')) {
        try {
            const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                showError(await extractErrorMessage(response));
                return;
            }
            clearError();
            fetchTasks(currentFilter);
        } catch {
            showError('Could not reach the server. Is it running?');
        }
    }
});

fetchTasks(currentFilter);
