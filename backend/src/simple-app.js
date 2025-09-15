const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// Simple in-memory database
const db = {
  users: [],
  scripts: [],
  usage: []
};

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper functions
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = decoded.userId;
  next();
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      name,
      password: hashedPassword,
      createdAt: new Date()
    };

    db.users.push(user);

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
});

// Script Routes
app.get('/api/scripts', authMiddleware, (req, res) => {
  const userScripts = db.scripts.filter(s => s.userId === req.userId);
  res.json(userScripts);
});

app.post('/api/scripts/generate', authMiddleware, (req, res) => {
  const { type, title, productInfo } = req.body;

  // Simple mock script generation
  const script = {
    id: Date.now().toString(),
    userId: req.userId,
    type,
    title,
    content: `Generated script for ${title}:\n\n${productInfo}\n\nThis is a demo script. In production, this would use AI to generate real content.`,
    createdAt: new Date()
  };

  db.scripts.push(script);
  res.json(script);
});

app.delete('/api/scripts/:id', authMiddleware, (req, res) => {
  const index = db.scripts.findIndex(s => s.id === req.params.id && s.userId === req.userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Script not found' });
  }

  db.scripts.splice(index, 1);
  res.json({ message: 'Script deleted successfully' });
});

// TTS Routes
app.post('/api/tts/generate', authMiddleware, (req, res) => {
  const { text, voice } = req.body;

  res.json({
    message: 'TTS generation simulated',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    text,
    voice
  });
});

// Usage Routes
app.get('/api/usage', authMiddleware, (req, res) => {
  const userUsage = db.usage.filter(u => u.userId === req.userId);

  const stats = {
    scriptsGenerated: userUsage.filter(u => u.type === 'script').length,
    ttsGenerated: userUsage.filter(u => u.type === 'tts').length,
    totalUsage: userUsage.length
  };

  res.json(stats);
});

// Start server
app.listen(PORT, () => {
  console.log(`Simple backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});