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

// Ensure data directory exists
async function initializeDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  // Initialize notes file if not exists
  try {
    await fs.access(NOTES_FILE);
  } catch {
    await fs.writeFile(NOTES_FILE, JSON.stringify([], null, 2));
  }

  // Initialize sessions file if not exists
  try {
    await fs.access(SESSIONS_FILE);
  } catch {
    await fs.writeFile(SESSIONS_FILE, JSON.stringify({}, null, 2));
  }
}

// Helper functions
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

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
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

// Get all notes (public/demo mode)
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await readNotes();
    res.json({ 
      success: true, 
      notes,
      count: notes.length 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notes',
      message: error.message 
    });
  }
});

// Get single note by ID
app.get('/api/notes/:id', async (req, res) => {
  try {
    const notes = await readNotes();
    const note = notes.find(n => n.id === req.params.id);
    
    if (!note) {
      return res.status(404).json({ 
        success: false, 
        error: 'Note not found' 
      });
    }

    res.json({ 
      success: true, 
      note 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch note',
      message: error.message 
    });
  }
});

// Create new note
app.post('/api/notes', async (req, res) => {
  try {
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
    
    if (success) {
      res.status(201).json({ 
        success: true, 
        note: newNote,
        message: 'Note created successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save note' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create note',
      message: error.message 
    });
  }
});

// Update note
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { content, title, encrypted, passwordHash, metadata } = req.body;
    const notes = await readNotes();
    const noteIndex = notes.findIndex(n => n.id === req.params.id);

    if (noteIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Note not found' 
      });
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

    const success = await writeNotes(notes);

    if (success) {
      res.json({ 
        success: true, 
        note: notes[noteIndex],
        message: 'Note updated successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update note' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update note',
      message: error.message 
    });
  }
});

// Delete note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const notes = await readNotes();
    const filteredNotes = notes.filter(n => n.id !== req.params.id);

    if (notes.length === filteredNotes.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Note not found' 
      });
    }

    const success = await writeNotes(filteredNotes);

    if (success) {
      res.json({ 
        success: true, 
        message: 'Note deleted successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete note' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete note',
      message: error.message 
    });
  }
});

// Verify password for encrypted note
app.post('/api/notes/:id/verify', async (req, res) => {
  try {
    const { passwordHash } = req.body;
    const notes = await readNotes();
    const note = notes.find(n => n.id === req.params.id);

    if (!note) {
      return res.status(404).json({ 
        success: false, 
        error: 'Note not found' 
      });
    }

    if (!note.encrypted || !note.passwordHash) {
      return res.status(400).json({ 
        success: false, 
        error: 'Note is not password protected' 
      });
    }

    const isValid = note.passwordHash === passwordHash;

    res.json({ 
      success: true, 
      valid: isValid,
      note: isValid ? note : null
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify password',
      message: error.message 
    });
  }
});

// Session management - Create session
app.post('/api/sessions', async (req, res) => {
  try {
    const { noteId } = req.body;
    const token = generateSessionToken();
    const sessions = await readSessions();

    sessions[token] = {
      noteId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    await writeSessions(sessions);

    res.json({ 
      success: true, 
      token,
      expiresAt: sessions[token].expiresAt
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create session',
      message: error.message 
    });
  }
});

// Validate session
app.get('/api/sessions/:token', async (req, res) => {
  try {
    const sessions = await readSessions();
    const session = sessions[req.params.token];

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      });
    }

    const isExpired = new Date(session.expiresAt) < new Date();

    if (isExpired) {
      delete sessions[req.params.token];
      await writeSessions(sessions);
      return res.status(401).json({ 
        success: false, 
        error: 'Session expired' 
      });
    }

    res.json({ 
      success: true, 
      session,
      valid: true
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to validate session',
      message: error.message 
    });
  }
});

// Statistics endpoint
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
        ? notes.reduce((latest, n) => {
            return new Date(n.updatedAt) > new Date(latest) ? n.updatedAt : latest;
          }, notes[0].updatedAt)
        : null
    };

    res.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

// Export all notes (backup)
app.get('/api/export', async (req, res) => {
  try {
    const notes = await readNotes();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=anhtu-notes-backup-${Date.now()}.json`);
    res.json({ 
      exportedAt: new Date().toISOString(),
      notesCount: notes.length,
      notes 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export notes',
      message: error.message 
    });
  }
});

// Import notes (restore from backup)
app.post('/api/import', async (req, res) => {
  try {
    const { notes: importedNotes, merge } = req.body;

    if (!Array.isArray(importedNotes)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid notes format' 
      });
    }

    let notes = merge ? await readNotes() : [];
    
    // Add imported notes with new IDs if merging
    importedNotes.forEach(note => {
      const newNote = {
        ...note,
        id: merge ? generateId() : note.id,
        importedAt: new Date().toISOString()
      };
      notes.push(newNote);
    });

    const success = await writeNotes(notes);

    if (success) {
      res.json({ 
        success: true, 
        message: 'Notes imported successfully',
        count: importedNotes.length,
        totalNotes: notes.length
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to import notes' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to import notes',
      message: error.message 
    });
  }
});

// Serve frontend for all other routes (SPA support)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next(); // cho API đi tiếp
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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

// Initialize and start server
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
║  🚀 Port: ${PORT}                         ║
║  📝 API: http://localhost:${PORT}/api    ║
║  💾 Data: ${DATA_DIR}              ║
║                                          ║
║  Endpoints:                              ║
║  • GET    /api/health                    ║
║  • GET    /api/notes                     ║
║  • POST   /api/notes                     ║
║  • PUT    /api/notes/:id                 ║
║  • DELETE /api/notes/:id                 ║
║  • POST   /api/notes/:id/verify          ║
║  • GET    /api/stats                     ║
║  • GET    /api/export                    ║
║  • POST   /api/import                    ║
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
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();
