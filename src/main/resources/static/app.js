const API_BASE = '/api/tasks';

const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const errorBanner = document.getElementById('error-banner');
const filterButtons = document.querySelectorAll('.filter-btn');
const emptyState = document.getElementById('empty-state');
const listCount = document.getElementById('list-count');
const purgeBtn = document.getElementById('purge-btn');
const clockEl = document.getElementById('clock');

const progressFill = document.getElementById('progress-fill');
const progressPercent = document.getElementById('progress-percent');
const statTotalInline = document.getElementById('stat-total-inline');
const statDoneInline = document.getElementById('stat-done-inline');
const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statDone = document.getElementById('stat-done');
const statOverdue = document.getElementById('stat-overdue');
const statDue = document.getElementById('stat-due');
const statCompletion = document.getElementById('stat-completion');

let currentFilter = 'all';
let currentTasks = [];

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

function applyFilter(tasks, filter) {
    if (filter === 'pending') return tasks.filter((t) => !t.completed);
    if (filter === 'done') return tasks.filter((t) => t.completed);
    return tasks;
}

function updateClock() {
    clockEl.textContent = new Date().toTimeString().slice(0, 8);
}

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

async function fetchTasks(filter) {
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) {
            showError(await extractErrorMessage(response));
            return;
        }
        clearError();
        currentTasks = await response.json();
        renderStats(currentTasks);
        renderTasks(applyFilter(currentTasks, filter));
    } catch {
        showError('Could not reach the server. Is it running?');
    }
}

function renderStats(tasks) {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const active = total - done;
    const today = todayIsoDate();
    const overdue = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length;
    const withDueDate = tasks.filter((t) => t.dueDate).length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    statTotalInline.textContent = total;
    statDoneInline.textContent = done;
    progressFill.style.width = `${progress}%`;
    progressPercent.textContent = `${progress}%`;
    statTotal.textContent = total;
    statActive.textContent = active;
    statDone.textContent = done;
    statOverdue.textContent = overdue;
    statDue.textContent = withDueDate;
    statCompletion.textContent = `${progress}%`;

    purgeBtn.hidden = done === 0;
}

function buildTag(text, className) {
    const span = document.createElement('span');
    span.className = `tag ${className}`;
    span.textContent = text;
    return span;
}

function renderTasks(tasks) {
    taskList.textContent = '';
    listCount.textContent = `RECORD LIST — ${tasks.length} ITEM(S)`;
    emptyState.hidden = tasks.length !== 0;

    const today = todayIsoDate();

    for (const task of tasks) {
        const item = document.createElement('li');
        item.className = 'task-item' + (task.completed ? ' completed' : '');
        item.dataset.id = task.id;

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'task-toggle';
        toggle.title = 'Toggle complete';
        toggle.textContent = task.completed ? 'X' : ' ';

        const content = document.createElement('div');
        content.className = 'task-content';

        const title = document.createElement('span');
        title.className = 'task-title';
        title.textContent = task.title;
        title.title = 'Double-click to edit';
        content.appendChild(title);

        if (task.description) {
            const description = document.createElement('p');
            description.className = 'task-description';
            description.textContent = task.description;
            content.appendChild(description);
        }

        const tags = document.createElement('div');
        tags.className = 'task-tags';
        if (task.dueDate) {
            const overdue = !task.completed && task.dueDate < today;
            tags.appendChild(buildTag(`DUE: ${task.dueDate}`, overdue ? 'tag-overdue' : 'tag-due'));
        }
        if (task.createdAt) {
            tags.appendChild(buildTag(`CREATED: ${task.createdAt.slice(0, 10)}`, 'tag-created'));
        }
        content.appendChild(tags);

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'retro-btn task-edit-btn';
        editBtn.title = 'Edit';
        editBtn.textContent = '[EDIT]';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'retro-btn task-delete-btn';
        deleteBtn.title = 'Delete';
        deleteBtn.textContent = '[DEL]';

        actions.append(editBtn, deleteBtn);
        item.append(toggle, content, actions);
        taskList.appendChild(item);
    }
}

function startEditingTitle(item, task) {
    const content = item.querySelector('.task-content');
    const titleEl = content.querySelector('.task-title');
    if (!titleEl) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'retro-input task-title-input';
    input.value = task.title;
    input.maxLength = 100;

    const commit = async () => {
        const trimmed = input.value.trim();
        if (!trimmed || trimmed === task.title) {
            fetchTasks(currentFilter);
            return;
        }
        await updateTask(task, { title: trimmed });
    };

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            input.blur();
        }
        if (event.key === 'Escape') {
            fetchTasks(currentFilter);
        }
    });
    input.addEventListener('blur', commit, { once: true });

    titleEl.replaceWith(input);
    input.focus();
    input.select();
}

async function updateTask(task, changes) {
    const payload = {
        title: task.title,
        description: task.description || null,
        completed: task.completed,
        dueDate: task.dueDate || null,
        ...changes,
    };

    try {
        const response = await fetch(`${API_BASE}/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

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
        document.getElementById('title').focus();
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

purgeBtn.addEventListener('click', async () => {
    const completedTasks = currentTasks.filter((t) => t.completed);
    try {
        await Promise.all(
            completedTasks.map((t) => fetch(`${API_BASE}/${t.id}`, { method: 'DELETE' }))
        );
        clearError();
        fetchTasks(currentFilter);
    } catch {
        showError('Could not reach the server. Is it running?');
    }
});

taskList.addEventListener('click', async (event) => {
    const item = event.target.closest('.task-item');
    if (!item) return;
    const id = Number(item.dataset.id);
    const task = currentTasks.find((t) => t.id === id);
    if (!task) return;

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

    if (event.target.classList.contains('task-delete-btn')) {
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
        return;
    }

    if (event.target.classList.contains('task-edit-btn')) {
        startEditingTitle(item, task);
    }
});

taskList.addEventListener('dblclick', (event) => {
    const titleEl = event.target.closest('.task-title');
    if (!titleEl) return;
    const item = event.target.closest('.task-item');
    const id = Number(item.dataset.id);
    const task = currentTasks.find((t) => t.id === id);
    if (!task) return;
    startEditingTitle(item, task);
});

updateClock();
setInterval(updateClock, 1000);
fetchTasks(currentFilter);
