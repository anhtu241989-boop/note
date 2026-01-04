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

// ==============================
// Initialize data directory and files
// ==============================
async function initializeDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch (err) {
    console.log(`Data directory not found, creating: ${DATA_DIR}`);
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err2) {
      console.error('Failed to create data directory:', err2);
      throw err2;
    }
  }

  // Initialize notes file
  try {
    await fs.access(NOTES_FILE);
  } catch {
    console.log('Notes file not found, creating empty notes.json');
    try {
      await fs.writeFile(NOTES_FILE, JSON.stringify([], null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to create notes.json:', err);
      throw err;
    }
  }

  // Initialize sessions file
  try {
    await fs.access(SESSIONS_FILE);
  } catch {
    console.log('Sessions file not found, creating empty sessions.json');
    try {
      await fs.writeFile(SESSIONS_FILE, JSON.stringify({}, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to create sessions.json:', err);
      throw err;
    }
  }
}

// ==============================
// Helper functions
// ==============================
async function readJSON(filePath, defaultValue) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

async function writeJSON(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

const readNotes = () => readJSON(NOTES_FILE, []);
const writeNotes = (notes) => writeJSON(NOTES_FILE, notes);
const readSessions = () => readJSON(SESSIONS_FILE, {});
const writeSessions = (sessions) => writeJSON(SESSIONS_FILE, sessions);

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ==============================
// API Routes
// ==============================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'anhtu 🌈💕 API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all notes
app.get('/api/notes', async (req, res) => {
  const notes = await readNotes();
  res.json({ success: true, notes, count: notes.length });
});

// Get single note by ID
app.get('/api/notes/:id', async (req, res) => {
  const notes = await readNotes();
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
  res.json({ success: true, note });
});

// Create new note
app.post('/api/notes', async (req, res) => {
  const { content, title, encrypted, passwordHash, metadata } = req.body;
  const newNote = {
    id: generateId(),
    title: title || 'Untitled Note',
    content: content || '',
    encrypted: encrypted || false,
    passwordHash: passwordHash || null,
    metadata: metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };
  const notes = await readNotes();
  notes.push(newNote);
  const success = await writeNotes(notes);
  if (!success) return res.status(500).json({ success: false, error: 'Failed to save note' });
  res.status(201).json({ success: true, note: newNote, message: 'Note created successfully' });
});

// Update note
app.put('/api/notes/:id', async (req, res) => {
  const { content, title, encrypted, passwordHash, metadata } = req.body;
  const notes = await readNotes();
  const noteIndex = notes.findIndex(n => n.id === req.params.id);
  if (noteIndex === -1) return res.status(404).json({ success: false, error: 'Note not found' });

  notes[noteIndex] = {
    ...notes[noteIndex],
    title: title ?? notes[noteIndex].title,
    content: content ?? notes[noteIndex].content,
    encrypted: encrypted ?? notes[noteIndex].encrypted,
    passwordHash: passwordHash ?? notes[noteIndex].passwordHash,
    metadata: metadata ? { ...notes[noteIndex].metadata, ...metadata } : notes[noteIndex].metadata,
    updatedAt: new Date().toISOString(),
    version: notes[noteIndex].version + 1
  };

  const success = await writeNotes(notes);
  if (!success) return res.status(500).json({ success: false, error: 'Failed to update note' });
  res.json({ success: true, note: notes[noteIndex], message: 'Note updated successfully' });
});

// Delete note
app.delete('/api/notes/:id', async (req, res) => {
  const notes = await readNotes();
  const filteredNotes = notes.filter(n => n.id !== req.params.id);
  if (notes.length === filteredNotes.length) return res.status(404).json({ success: false, error: 'Note not found' });
  const success = await writeNotes(filteredNotes);
  if (!success) return res.status(500).json({ success: false, error: 'Failed to delete note' });
  res.json({ success: true, message: 'Note deleted successfully' });
});

// Verify password for encrypted note
app.post('/api/notes/:id/verify', async (req, res) => {
  const { passwordHash } = req.body;
  const notes = await readNotes();
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
  if (!note.encrypted || !note.passwordHash) return res.status(400).json({ success: false, error: 'Note is not password protected' });
  const isValid = note.passwordHash === passwordHash;
  res.json({ success: true, valid: isValid, note: isValid ? note : null });
});

// Create session
app.post('/api/sessions', async (req, res) => {
  const { noteId } = req.body;
  const token = generateSessionToken();
  const sessions = await readSessions();
  sessions[token] = {
    noteId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
  const success = await writeSessions(sessions);
  if (!success) return res.status(500).json({ success: false, error: 'Failed to create session' });
  res.json({ success: true, token, expiresAt: sessions[token].expiresAt });
});

// Validate session
app.get('/api/sessions/:token', async (req, res) => {
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
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  const notes = await readNotes();
  const stats = {
    totalNotes: notes.length,
    encryptedNotes: notes.filter(n => n.encrypted).length,
    totalCharacters: notes.reduce((sum, n) => sum + (n.content?.length || 0), 0),
    totalWords: notes.reduce((sum, n) => sum + ((n.content?.trim().split(/\s+/).filter(w => w.length > 0).length) || 0), 0),
    lastUpdated: notes.length ? notes.reduce((latest, n) => new Date(n.updatedAt) > new Date(latest) ? n.updatedAt : latest, notes[0].updatedAt) : null
  };
  res.json({ success: true, stats });
});

// Export notes
app.get('/api/export', async (req, res) => {
  const notes = await readNotes();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=anhtu-notes-backup-${Date.now()}.json`);
  res.json({ exportedAt: new Date().toISOString(), notesCount: notes.length, notes });
});

// Import notes
app.post('/api/import', async (req, res) => {
  const { notes: importedNotes, merge } = req.body;
  if (!Array.isArray(importedNotes)) return res.status(400).json({ success: false, error: 'Invalid notes format' });
  let notes = merge ? await readNotes() : [];
  importedNotes.forEach(note => {
    notes.push({ ...note, id: merge ? generateId() : note.id, importedAt: new Date().toISOString() });
  });
  const success = await writeNotes(notes);
  if (!success) return res.status(500).json({ success: false, error: 'Failed to import notes' });
  res.json({ success: true, message: 'Notes imported successfully', count: importedNotes.length, totalNotes: notes.length });
});

// Serve frontend SPA
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error middleware
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
      console.log(`🌈 API Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

startServer();
