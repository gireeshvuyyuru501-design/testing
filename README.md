# Student Management System

A small student management system:

- **Backend**: Node's built-in `http` module (no Express), CRUD API, JSON file storage.
- **Frontend**: Static HTML/CSS/JS (login, dashboard, students pages sharing one script/stylesheet).
- **Automation**: Playwright tests covering login, navigation, and CRUD behavior.

## Project Structure

```
backend/server.js        HTTP server, static file hosting, student CRUD API
backend/students.json    Persistent JSON data store for students
frontend/login.html      Login screen
frontend/dashboard.html  Summary page with student count and navigation
frontend/students.html   CRUD UI for students
frontend/script.js       Shared browser logic (branches on body[data-page])
frontend/style.css       Visual styling for the static UI
automation/tests/*.js    Playwright tests
automation/pages/*.js    Page objects used by the tests
```

## Setup & Run

```bash
# 1. Install root dependencies (Playwright)
npm install

# 2. Install backend dependencies (uses Node built-ins only, but has its own package.json)
cd backend
npm install

# 3. Start the backend server
npm start
# -> http://localhost:3000
```

Then, in a browser, open **http://localhost:3000/** (do not double-click the HTML
files directly — the frontend calls the API with relative paths, so pages must be
loaded through the backend origin).

1. Enter a name and click **Continue** — this is saved to `localStorage` and you're
   taken to the dashboard.
2. The dashboard shows a welcome message and the current student count.
3. Click **Go to Students** to create, edit, delete, and refresh student records.

## Running the Automated Tests

With the backend running in one terminal, run Playwright from the project root in
another terminal:

```bash
npx playwright test

# with the interactive UI runner
npx playwright test --ui

# if browser binaries aren't installed yet
npx playwright install
```

## API Reference

| Method | Path                 | Description                                    |
|--------|----------------------|-------------------------------------------------|
| GET    | `/api/students`      | Returns the full list of students.               |
| POST   | `/api/students`      | Creates a student; auto-assigns a numeric `id`.  |
| PUT    | `/api/students/:id`  | Merges fields into the record; `id` is preserved.|
| DELETE | `/api/students/:id`  | Removes the record; returns the deleted student. |
| GET    | `/health`            | Returns `{ ok: true }`.                          |
