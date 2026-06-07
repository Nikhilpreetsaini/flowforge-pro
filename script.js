// FlowForge Pro Task Management
// Data structures
let tasks = JSON.parse(localStorage.getItem('ff_tasks') || '[]');
let categories = JSON.parse(localStorage.getItem('ff_categories') || '[]');
let currentCategory = null;
let editIndex = null;

// Ensure default category exists
if (categories.length === 0) {
  categories.push('General');
  saveCategories();
}

// DOM elements
const categoryListEl = document.getElementById('categories');
const taskListEl = document.getElementById('taskList');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
const taskDueDateInput = document.getElementById('taskDueDate');
const taskPrioritySelect = document.getElementById('taskPriority');
const taskCategorySelect = document.getElementById('taskCategory');
const modalTitle = document.getElementById('modalTitle');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');

const categoryModal = document.getElementById('categoryModal');
const categoryForm = document.getElementById('categoryForm');
const categoryNameInput = document.getElementById('categoryName');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');

const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const themeToggleBtn = document.getElementById('themeToggle');

// Initialize UI
renderCategories();
renderTasks();
populateCategorySelect();
loadTheme();
registerServiceWorker();

// Event listeners
document.getElementById('addTaskBtn').addEventListener('click', () => {
  editIndex = null;
  openTaskModal();
});

document.getElementById('addCategoryBtn').addEventListener('click', () => {
  openCategoryModal();
});

taskForm.addEventListener('submit', handleTaskSubmit);
cancelTaskBtn.addEventListener('click', () => closeModal(taskModal));

categoryForm.addEventListener('submit', handleCategorySubmit);
cancelCategoryBtn.addEventListener('click', () => closeModal(categoryModal));

searchInput.addEventListener('input', renderTasks);
sortSelect.addEventListener('change', renderTasks);
themeToggleBtn.addEventListener('click', toggleTheme);

// Functions
function saveTasks() {
  localStorage.setItem('ff_tasks', JSON.stringify(tasks));
}

function saveCategories() {
  localStorage.setItem('ff_categories', JSON.stringify(categories));
}

function renderCategories() {
  categoryListEl.innerHTML = '';
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.textContent = cat;
    if (cat === currentCategory) li.classList.add('selected');
    li.addEventListener('click', () => {
      currentCategory = cat === currentCategory ? null : cat;
      renderCategories();
      renderTasks();
    });
    categoryListEl.appendChild(li);
  });
}

function populateCategorySelect() {
  taskCategorySelect.innerHTML = '';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    taskCategorySelect.appendChild(option);
  });
}

function renderTasks() {
  const query = searchInput.value.toLowerCase();
  let filtered = tasks.slice();
  if (currentCategory) {
    filtered = filtered.filter(t => t.category === currentCategory);
  }
  if (query) {
    filtered = filtered.filter(t => t.title.toLowerCase().includes(query) || (t.description && t.description.toLowerCase().includes(query)));
  }
  // Sort
  const sortBy = sortSelect.value;
  filtered.sort((a, b) => {
    if (sortBy === 'dueDate') {
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    } else if (sortBy === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    } else if (sortBy === 'createdAt') {
      return a.createdAt - b.createdAt;
    }
    return 0;
  });
  // Render
  taskListEl.innerHTML = '';
  filtered.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    const left = document.createElement('div');
    left.className = 'info';
    const title = document.createElement('h3');
    title.textContent = task.title;
    if (task.completed) title.style.textDecoration = 'line-through';
    const desc = document.createElement('p');
    desc.textContent = task.description;
    const meta = document.createElement('div');
    meta.className = 'meta';
    const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
    meta.textContent = `${task.priority.toUpperCase()} • ${due} • ${task.category}`;
    left.appendChild(title);
    if (task.description) left.appendChild(desc);
    left.appendChild(meta);
    const actions = document.createElement('div');
    actions.className = 'actions';
    const completeBtn = document.createElement('button');
    completeBtn.textContent = task.completed ? 'Undo' : 'Done';
    completeBtn.addEventListener('click', () => toggleComplete(index));
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openTaskModal(index));
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(index));
    actions.appendChild(completeBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(left);
    li.appendChild(actions);
    taskListEl.appendChild(li);
  });
}

function openTaskModal(index) {
  editIndex = index;
  if (index != null) {
    const task = tasks[index];
    modalTitle.textContent = 'Edit Task';
    taskTitleInput.value = task.title;
    taskDescriptionInput.value = task.description || '';
    taskDueDateInput.value = task.dueDate || '';
    taskPrioritySelect.value = task.priority;
    taskCategorySelect.value = task.category;
  } else {
    modalTitle.textContent = 'Add Task';
    taskTitleInput.value = '';
    taskDescriptionInput.value = '';
    taskDueDateInput.value = '';
    taskPrioritySelect.value = 'medium';
    taskCategorySelect.value = categories[0];
  }
  taskModal.classList.add('show');
  taskModal.setAttribute('aria-hidden', 'false');
}

function openCategoryModal() {
  categoryNameInput.value = '';
  categoryModal.classList.add('show');
  categoryModal.setAttribute('aria-hidden', 'false');
}

function closeModal(modal) {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const newTask = {
    title: taskTitleInput.value.trim(),
    description: taskDescriptionInput.value.trim(),
    dueDate: taskDueDateInput.value || null,
    priority: taskPrioritySelect.value,
    category: taskCategorySelect.value,
    completed: false,
    createdAt: Date.now()
  };
  if (editIndex != null) {
    tasks[editIndex] = { ...tasks[editIndex], ...newTask };
  } else {
    tasks.push(newTask);
  }
  saveTasks();
  renderTasks();
  closeModal(taskModal);
}

function handleCategorySubmit(event) {
  event.preventDefault();
  const name = categoryNameInput.value.trim();
  if (name && !categories.includes(name)) {
    categories.push(name);
    saveCategories();
    renderCategories();
    populateCategorySelect();
  }
  closeModal(categoryModal);
}

function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  renderTasks();
}

function deleteTask(index) {
  if (confirm('Are you sure you want to delete this task?')) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? '' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('ff_theme', newTheme);
  themeToggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function loadTheme() {
  const saved = localStorage.getItem('ff_theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggleBtn.textContent = '☀️';
  }
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(err => console.error('SW reg failed', err));
  }
}