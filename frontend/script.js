/**
 * Shared frontend logic for the Student Management System.
 * Behavior branches on document.body.dataset.page ("login" | "dashboard" | "students").
 *
 * NOTE: these pages must be loaded through the backend server (e.g.
 * http://localhost:3000/) because /api/students is called with a relative
 * path. Opening the HTML files directly (file://) will not work.
 */

const STORAGE_KEY = 'studentSystemUser';
const API_BASE = '/api/students';

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'login') initLoginPage();
  if (page === 'dashboard') initDashboardPage();
  if (page === 'students') initStudentsPage();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrentUser() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

function setCurrentUser(name) {
  localStorage.setItem(STORAGE_KEY, name);
}

function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEY);
}

function setStatus(el, message, type) {
  if (!el) return;
  el.textContent = message || '';
  el.classList.remove('error', 'success');
  if (type) el.classList.add(type);
}

async function apiRequest(path, options) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }
  if (!response.ok) {
    const message = (data && data.error) || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Login page
// ---------------------------------------------------------------------------

function initLoginPage() {
  const form = document.getElementById('loginForm');
  const nameInput = document.getElementById('nameInput');
  const statusEl = document.getElementById('statusMessage');

  // If already logged in, offer a quick way back to the dashboard.
  const existingUser = getCurrentUser();
  if (existingUser) {
    setStatus(statusEl, `Already logged in as ${existingUser}. Redirecting...`, 'success');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();

    if (!name) {
      setStatus(statusEl, 'Please enter a name to continue.', 'error');
      return;
    }

    setCurrentUser(name);
    setStatus(statusEl, `Welcome, ${name}! Redirecting...`, 'success');
    window.location.href = 'dashboard.html';
  });
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

async function initDashboardPage() {
  const welcomeHeading = document.getElementById('welcomeHeading');
  const studentCountEl = document.getElementById('studentCount');
  const statusEl = document.getElementById('statusMessage');
  const logoutBtn = document.getElementById('logoutBtn');

  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  welcomeHeading.textContent = `Welcome, ${user}`;

  try {
    const students = await apiRequest(API_BASE, { method: 'GET' });
    studentCountEl.textContent = String(students.length);
  } catch (err) {
    setStatus(statusEl, `Could not load student count: ${err.message}`, 'error');
  }

  logoutBtn.addEventListener('click', () => {
    clearCurrentUser();
    window.location.href = 'login.html';
  });
}

// ---------------------------------------------------------------------------
// Students page
// ---------------------------------------------------------------------------

function initStudentsPage() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const form = document.getElementById('studentForm');
  const idInput = document.getElementById('studentId');
  const nameInput = document.getElementById('studentName');
  const emailInput = document.getElementById('studentEmail');
  const ageInput = document.getElementById('studentAge');
  const formTitle = document.getElementById('formTitle');
  const saveBtn = document.getElementById('saveBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const tableBody = document.getElementById('studentsTableBody');
  const statusEl = document.getElementById('statusMessage');

  function resetForm() {
    idInput.value = '';
    form.reset();
    formTitle.textContent = 'Add Student';
    saveBtn.textContent = 'Save';
    cancelEditBtn.hidden = true;
  }

  function fillFormForEdit(student) {
    idInput.value = student.id;
    nameInput.value = student.name || '';
    emailInput.value = student.email || '';
    ageInput.value = student.age ?? '';
    formTitle.textContent = `Edit Student #${student.id}`;
    saveBtn.textContent = 'Update';
    cancelEditBtn.hidden = false;
    nameInput.focus();
  }

  function renderStudents(students) {
    tableBody.innerHTML = '';

    if (!students.length) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="4">No students yet.</td>';
      tableBody.appendChild(emptyRow);
      return;
    }

    students.forEach((student) => {
      const row = document.createElement('tr');
      row.dataset.id = student.id;

      row.innerHTML = `
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.email || '')}</td>
        <td>${student.age ?? ''}</td>
        <td class="row-actions">
          <button type="button" class="secondary edit-btn">Edit</button>
          <button type="button" class="danger delete-btn">Delete</button>
        </td>
      `;

      row.querySelector('.edit-btn').addEventListener('click', () => fillFormForEdit(student));
      row.querySelector('.delete-btn').addEventListener('click', () => handleDelete(student));

      tableBody.appendChild(row);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function loadStudents() {
    try {
      const students = await apiRequest(API_BASE, { method: 'GET' });
      renderStudents(students);
      setStatus(statusEl, `Loaded ${students.length} student(s).`, 'success');
    } catch (err) {
      setStatus(statusEl, `Failed to load students: ${err.message}`, 'error');
    }
  }

  async function handleDelete(student) {
    const confirmed = window.confirm(`Delete ${student.name}?`);
    if (!confirmed) return;

    try {
      await apiRequest(`${API_BASE}/${student.id}`, { method: 'DELETE' });
      setStatus(statusEl, `Deleted ${student.name}.`, 'success');
      await loadStudents();
      if (idInput.value === String(student.id)) resetForm();
    } catch (err) {
      setStatus(statusEl, `Failed to delete student: ${err.message}`, 'error');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    if (!name) {
      setStatus(statusEl, 'Name is required.', 'error');
      return;
    }

    const payload = {
      name,
      email: emailInput.value.trim(),
      age: ageInput.value ? Number(ageInput.value) : null,
    };

    const editingId = idInput.value;

    try {
      if (editingId) {
        await apiRequest(`${API_BASE}/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setStatus(statusEl, `Updated ${name}.`, 'success');
      } else {
        await apiRequest(API_BASE, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setStatus(statusEl, `Added ${name}.`, 'success');
      }
      resetForm();
      await loadStudents();
    } catch (err) {
      setStatus(statusEl, `Save failed: ${err.message}`, 'error');
    }
  });

  cancelEditBtn.addEventListener('click', () => resetForm());
  refreshBtn.addEventListener('click', () => loadStudents());

  loadStudents();
}
