/**
 * Student Management System - Backend
 *
 * Plain Node.js HTTP server (no Express). Responsibilities:
 *  - Serve the static frontend (login, dashboard, students pages + shared JS/CSS)
 *  - Provide a JSON CRUD API for students backed by students.json
 *
 * Start with: npm start (from the backend/ directory)
 * Listens on process.env.PORT || 3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const BACKEND_DIR = __dirname;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const DATA_FILE = path.join(BACKEND_DIR, 'students.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// ---------------------------------------------------------------------------
// Data store helpers
// ---------------------------------------------------------------------------

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
}

function readStudents() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function writeStudents(students) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf-8');
}

function nextId(students) {
  const ids = students
    .map((s) => Number(s.id))
    .filter((n) => Number.isFinite(n));
  return ids.length ? Math.max(...ids) + 1 : 1;
}

// ---------------------------------------------------------------------------
// Request body helpers
// ---------------------------------------------------------------------------

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      // Basic guard against runaway payloads.
      if (data.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// ---------------------------------------------------------------------------
// Static file serving
// ---------------------------------------------------------------------------

function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

// Resolve a request path to a safe file inside FRONTEND_DIR.
function resolveFrontendPath(pathname) {
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  return path.join(FRONTEND_DIR, safePath);
}

// ---------------------------------------------------------------------------
// API route handlers
// ---------------------------------------------------------------------------

async function handleStudentsApi(req, res, pathname) {
  const parts = pathname.split('/').filter(Boolean); // ['api', 'students', ':id'?]
  const idPart = parts[2];

  // GET /api/students
  if (req.method === 'GET' && !idPart) {
    const students = readStudents();
    return sendJson(res, 200, students);
  }

  // POST /api/students
  if (req.method === 'POST' && !idPart) {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }

    if (!body || typeof body.name !== 'string' || !body.name.trim()) {
      return sendJson(res, 400, { error: 'A non-empty "name" field is required.' });
    }

    const students = readStudents();
    const newStudent = {
      id: nextId(students),
      name: body.name.trim(),
      email: typeof body.email === 'string' ? body.email.trim() : '',
      age: body.age !== undefined && body.age !== '' ? Number(body.age) : null,
    };
    students.push(newStudent);
    writeStudents(students);
    return sendJson(res, 201, newStudent);
  }

  // PUT /api/students/:id
  if (req.method === 'PUT' && idPart) {
    const id = Number(idPart);
    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }

    const students = readStudents();
    const index = students.findIndex((s) => Number(s.id) === id);
    if (index === -1) {
      return sendJson(res, 404, { error: `Student ${id} not found.` });
    }

    const existing = students[index];
    const updated = {
      ...existing,
      ...body,
      id: existing.id, // id is preserved regardless of body content
    };
    students[index] = updated;
    writeStudents(students);
    return sendJson(res, 200, updated);
  }

  // DELETE /api/students/:id
  if (req.method === 'DELETE' && idPart) {
    const id = Number(idPart);
    const students = readStudents();
    const index = students.findIndex((s) => Number(s.id) === id);
    if (index === -1) {
      return sendJson(res, 404, { error: `Student ${id} not found.` });
    }
    const [deleted] = students.splice(index, 1);
    writeStudents(students);
    return sendJson(res, 200, deleted);
  }

  return sendJson(res, 405, { error: 'Method not allowed.' });
}

// ---------------------------------------------------------------------------
// Main request handler
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  const pathname = decodeURIComponent(parsed.pathname);

  try {
    // Health check
    if (pathname === '/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true });
    }

    // Students API
    if (pathname.startsWith('/api/students')) {
      return await handleStudentsApi(req, res, pathname);
    }

    // Root -> login page
    if (pathname === '/' && req.method === 'GET') {
      return serveStaticFile(res, path.join(FRONTEND_DIR, 'login.html'));
    }

    // Static frontend assets (html/css/js)
    if (req.method === 'GET') {
      const filePath = resolveFrontendPath(pathname);
      return serveStaticFile(res, filePath);
    }

    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('405 Method Not Allowed');
  } catch (err) {
    sendJson(res, 500, { error: 'Internal server error', details: err.message });
  }
});

ensureDataFile();

server.listen(PORT, () => {
  console.log(`Student Management System backend running at http://localhost:${PORT}`);
});

module.exports = server;
