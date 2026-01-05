import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Ensure data directory and files exist
async function initializeDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  try {
    await fs.access(NOTES_FILE);
  } catch {
    await fs.writeFile(NOTES_FILE, JSON.stringify([], null, 2));
  }

  try {
    await fs.access(SESSIONS_FILE);
  } catch {
    await fs.writeFile(SESSIONS_FILE, JSON.stringify({}, null, 2));
  }
}

// Helper functions for file I/O
async function readNotes() {
  try {
    const data = await fs.readFile(NOTES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading notes:', error);
    return [];
  }
}

async function writeNotes(notes) {
  try {
    await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing notes:', error);
    return false;
  }
}

async function readSessions() {
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading sessions:', error);
    return {};
  }
}

async function writeSessions(sessions) {
  try {
    await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing sessions:', error);
    return false;
  }
}

// ID generators
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

function generateShortId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Note helpers
async function noteExists(id) {
  const notes = await readNotes();
  return notes.some(note => note.id === id);
}

async function getNoteById(id) {
  const notes = await readNotes();
  return notes.find(note => note.id === id) || null;
}

async function createEmptyNote(id) {
  const newNote = {
    id,
    title: 'Untitled',
    content: '',
    encrypted: false,
    passwordHash: null,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };

  const notes = await readNotes();
  notes.push(newNote);
  return await writeNotes(notes);
}

async function updateNoteContent(id, content) {
  const notes = await readNotes();
  const noteIndex = notes.findIndex(n => n.id === id);
  if (noteIndex === -1) return false;

  notes[noteIndex] = {
    ...notes[noteIndex],
    content,
    updatedAt: new Date().toISOString(),
    version: (notes[noteIndex].version || 1) + 1
  };

  return await writeNotes(notes);
}

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'anhtu 🌈💕 API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ==================== PASTEBIN-LIKE FEATURES ====================

// Trang chủ → Tạo note mới và redirect
app.get('/', async (req, res) => {
  let id;
  let attempts = 0;
  const maxAttempts = 20;

  do {
    id = generateShortId();
    attempts++;
    if (attempts > maxAttempts) {
      return res.status(500).send('Không thể tạo ID mới - thử lại sau');
    }
  } while (await noteExists(id));

  await createEmptyNote(id);
  res.redirect(`/note/${id}`);
});

// Trang editor (SPA)
app.get('/note/:id', async (req, res) => {
  const id = req.params.id;

  if (!(await getNoteById(id))) {
    await createEmptyNote(id);
  }

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath);
});

// API lưu content nhanh
app.post('/save/:id', async (req, res) => {
  const id = req.params.id;
  const { content } = req.body;

  if (typeof content !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid content - must be string'
    });
  }

  const updated = await updateNoteContent(id, content);

  if (!updated) {
    return res.status(404).json({
      success: false,
      error: 'Note not found'
    });
  }

  res.json({ success: true });
});

// API lấy note → /api/:id?raw=true
app.get('/api/:id', async (req, res) => {
  const id = req.params.id;
  const note = await getNoteById(id);

  if (!note) {
    return res.status(404).send('❌ Note không tồn tại');
  }

  if (req.query.raw === 'true') {
    res.type('text/plain').send(note.content || '');
  } else {
    res.json({ success: true, note });
  }
});

// ==================== CRUD API (cũ) ====================

// Get all notes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await readNotes();
    res.json({ success: true, notes, count: notes.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch notes' });
  }
});

// Get single note
app.get('/api/notes/:id', async (req, res) => {
  const note = await getNoteById(req.params.id);
  if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
  res.json({ success: true, note });
});

// Create new note
app.post('/api/notes', async (req, res) => {
  try {
    const { content = '', title, encrypted = false, passwordHash, metadata = {} } = req.body;

    const newNote = {
      id: generateId(),
      title: title || 'Untitled Note',
      content,
      encrypted,
      passwordHash: passwordHash || null,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const notes = await readNotes();
    notes.push(newNote);
    await writeNotes(notes);

    res.status(201).json({ success: true, note: newNote });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create note' });
  }
});

// Update note
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { content, title, encrypted, passwordHash, metadata } = req.body;
    const notes = await readNotes();
    const noteIndex = notes.findIndex(n => n.id === req.params.id);

    if (noteIndex === -1) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    notes[noteIndex] = {
      ...notes[noteIndex],
      title: title !== undefined ? title : notes[noteIndex].title,
      content: content !== undefined ? content : notes[noteIndex].content,
      encrypted: encrypted !== undefined ? encrypted : notes[noteIndex].encrypted,
      passwordHash: passwordHash !== undefined ? passwordHash : notes[noteIndex].passwordHash,
      metadata: metadata !== undefined ? { ...notes[noteIndex].metadata, ...metadata } : notes[noteIndex].metadata,
      updatedAt: new Date().toISOString(),
      version: notes[noteIndex].version + 1
    };

    await writeNotes(notes);
    res.json({ success: true, note: notes[noteIndex] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update note' });
  }
});

// Delete note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const notes = await readNotes();
    const filtered = notes.filter(n => n.id !== req.params.id);

    if (notes.length === filtered.length) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    await writeNotes(filtered);
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete note' });
  }
});

// Verify password
app.post('/api/notes/:id/verify', async (req, res) => {
  try {
    const { passwordHash } = req.body;
    const note = await getNoteById(req.params.id);

    if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
    if (!note.encrypted || !note.passwordHash) {
      return res.status(400).json({ success: false, error: 'Note is not password protected' });
    }

    const isValid = note.passwordHash === passwordHash;
    res.json({ success: true, valid: isValid, note: isValid ? note : null });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to verify password' });
  }
});

// Session management
app.post('/api/sessions', async (req, res) => {
  try {
    const { noteId } = req.body;
    const token = generateSessionToken();
    const sessions = await readSessions();

    sessions[token] = {
      noteId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    await writeSessions(sessions);
    res.json({ success: true, token, expiresAt: sessions[token].expiresAt });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
});

app.get('/api/sessions/:token', async (req, res) => {
  try {
    const sessions = await readSessions();
    const session = sessions[req.params.token];

    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const isExpired = new Date(session.expiresAt) < new Date();
    if (isExpired) {
      delete sessions[req.params.token];
      await writeSessions(sessions);
      return res.status(401).json({ success: false, error: 'Session expired' });
    }

    res.json({ success: true, session, valid: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to validate session' });
  }
});

// Stats
app.get('/api/stats', async (req, res) => {
  try {
    const notes = await readNotes();
    const stats = {
      totalNotes: notes.length,
      encryptedNotes: notes.filter(n => n.encrypted).length,
      totalCharacters: notes.reduce((sum, n) => sum + (n.content?.length || 0), 0),
      totalWords: notes.reduce((sum, n) => {
        const words = n.content?.trim().split(/\s+/).filter(w => w.length > 0).length || 0;
        return sum + words;
      }, 0),
      lastUpdated: notes.length > 0
        ? notes.reduce((latest, n) => new Date(n.updatedAt) > new Date(latest) ? n.updatedAt : latest, notes[0].updatedAt)
        : null
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

// Export & Import
app.get('/api/export', async (req, res) => {
  try {
    const notes = await readNotes();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=anhtu-notes-backup-${Date.now()}.json`);
    res.json({ exportedAt: new Date().toISOString(), notesCount: notes.length, notes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to export notes' });
  }
});

app.post('/api/import', async (req, res) => {
  try {
    const { notes: importedNotes, merge = true } = req.body;
    if (!Array.isArray(importedNotes)) {
      return res.status(400).json({ success: false, error: 'Invalid notes format' });
    }

    let notes = merge ? await readNotes() : [];
    importedNotes.forEach(note => {
      const newId = merge ? generateId() : (note.id || generateId());
      notes.push({ ...note, id: newId, importedAt: new Date().toISOString() });
    });

    await writeNotes(notes);
    res.json({ success: true, message: 'Notes imported successfully', count: importedNotes.length, totalNotes: notes.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to import notes' });
  }
});

// SPA fallback - tất cả các route khác trả về index.html
app.get('*', async (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  try {
    await fs.access(indexPath);
    res.sendFile(indexPath);
  } catch {
    res.status(404).send('Not found');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
async function startServer() {
  try {
    await initializeDataDir();

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║       🌈 anhtu 💕 API Server            ║
║                                          ║
║  ✨ Status: Running                      ║
║  🚀 Port: ${PORT}                              ║
║  📝 API: http://localhost:${PORT}/api         ║
║  💾 Data: ${DATA_DIR}                   ║
║                                          ║
║  Pastebin-like routes:                   ║
║  • GET  /                    → tạo mới & redirect    ║
║  • GET  /note/:id            → editor               ║
║  • POST /save/:id            → lưu nhanh            ║
║  • GET  /api/:id?raw=true    → raw text             ║
║                                          ║
╚══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down...');
  process.exit(0);
});

startServer();
