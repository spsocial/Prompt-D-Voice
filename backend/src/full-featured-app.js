const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Initialize Gemini AI (Use your API key)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyBvz3MN-FZShNvDfkzhOLvbRpDc6gCCPP0');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Import fs for file storage
const fs = require('fs');
const path = require('path');

// Database file paths
const dbPath = path.join(__dirname, '..', 'data');
const usersFile = path.join(dbPath, 'users.json');
const scriptsFile = path.join(dbPath, 'scripts.json');
const ttsFile = path.join(dbPath, 'tts.json');

// Create data directory if not exists
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

// Load or initialize database
const loadDB = (file, defaultValue) => {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.log('Creating new database file:', file);
  }
  return defaultValue;
};

// Save database
const saveDB = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Simple database with persistence
const db = {
  users: loadDB(usersFile, []),
  scripts: loadDB(scriptsFile, []),
  ttsHistory: loadDB(ttsFile, [])
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-2024';

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

// Script Templates
const scriptTemplates = {
  adSpot30: {
    name: 'โฆษณา 30 วินาที',
    prompt: 'สร้างสคริปต์โฆษณาสินค้า 30 วินาที ที่น่าสนใจและจดจำง่าย สำหรับ: '
  },
  liveSale: {
    name: 'ขายสดไลฟ์สตรีม',
    prompt: 'สร้างบทพูดขายสินค้าแบบไลฟ์สด ที่สร้างความตื่นเต้น โน้มน้าวใจ และกระตุ้นให้ซื้อทันที สำหรับ: '
  },
  tiktok: {
    name: 'TikTok 15 วินาที',
    prompt: 'สร้างสคริปต์วิดีโอ TikTok 15 วินาที ที่ดึงดูดความสนใจตั้งแต่วินาทีแรก มีจุด hook ที่แรง สำหรับ: '
  },
  review: {
    name: 'รีวิวสินค้า',
    prompt: 'สร้างบทรีวิวสินค้าที่ดูน่าเชื่อถือ พูดถึงข้อดีข้อเสีย และประสบการณ์การใช้งานจริง สำหรับ: '
  },
  podcast: {
    name: 'Podcast แนะนำสินค้า',
    prompt: 'สร้างบทพูด podcast แนะนำสินค้าแบบเป็นกันเอง ให้ข้อมูลที่เป็นประโยชน์ สำหรับ: '
  },
  storytelling: {
    name: 'เล่าเรื่องขายของ',
    prompt: 'สร้างเรื่องเล่าที่สอดแทรกการขายสินค้าอย่างแนบเนียน สร้างอารมณ์ร่วม สำหรับ: '
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Full-featured backend with AI is running!',
    features: ['AI Script Generation', 'Text-to-Speech', 'Multiple Templates']
  });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      email,
      name,
      password: hashedPassword,
      credits: 100, // Free credits for new users
      createdAt: new Date()
    };

    db.users.push(user);
    saveDB(usersFile, db.users); // Save to file
    const token = generateToken(user.id);

    res.json({
      message: 'Registration successful!',
      token,
      user: { id: user.id, email: user.email, name: user.name, credits: user.credits }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, email: user.email, name: user.name, credits: user.credits }
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
    user: { id: user.id, email: user.email, name: user.name, credits: user.credits }
  });
});

// Script Generation with Real AI
app.post('/api/scripts/generate', authMiddleware, async (req, res) => {
  try {
    const { type, productInfo, tone, targetAudience, duration } = req.body;
    const user = db.users.find(u => u.id === req.userId);

    if (!user || user.credits < 5) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    // Build AI prompt
    const template = scriptTemplates[type] || scriptTemplates.adSpot30;
    let prompt = template.prompt + productInfo;

    if (tone) prompt += `\n\nน้ำเสียง: ${tone}`;
    if (targetAudience) prompt += `\nกลุ่มเป้าหมาย: ${targetAudience}`;
    if (duration) prompt += `\nความยาว: ${duration}`;

    prompt += '\n\nกรุณาเขียนเป็นภาษาไทย ให้น่าสนใจ และเหมาะกับการอ่านออกเสียง';

    // Generate with Gemini AI
    let generatedContent;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      generatedContent = response.text();
    } catch (aiError) {
      console.error('AI Error:', aiError);
      // Fallback to template if AI fails
      generatedContent = `
🎯 ${template.name} - ${productInfo}

[เปิดด้วยคำถามที่น่าสนใจ]
คุณเคยประสบปัญหา... หรือไม่?

[แนะนำสินค้า]
${productInfo} คือคำตอบที่คุณตามหา!

[จุดเด่น 3 ข้อ]
✅ ประโยชน์ที่ 1: ช่วยแก้ปัญหา...
✅ ประโยชน์ที่ 2: ประหยัดเวลาและเงิน
✅ ประโยชน์ที่ 3: ใช้งานง่าย สะดวก

[Call to Action]
อย่ารอช้า! สั่งซื้อวันนี้ รับส่วนลดพิเศษ
📞 โทร: 099-999-9999
🛒 สั่งซื้อออนไลน์: www.example.com

#${productInfo.replace(/\s+/g, '')} #โปรโมชั่นพิเศษ
      `;
    }

    // Save script
    const script = {
      id: Date.now().toString(),
      userId: req.userId,
      type,
      productInfo,
      content: generatedContent,
      metadata: { tone, targetAudience, duration },
      createdAt: new Date()
    };

    db.scripts.push(script);
    saveDB(scriptsFile, db.scripts); // Save scripts

    // Deduct credits
    user.credits -= 5;
    saveDB(usersFile, db.users); // Save updated user credits

    res.json({
      message: 'Script generated successfully!',
      script,
      creditsRemaining: user.credits
    });
  } catch (error) {
    console.error('Generate Error:', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

// Get all scripts
app.get('/api/scripts', authMiddleware, (req, res) => {
  const userScripts = db.scripts.filter(s => s.userId === req.userId);
  res.json(userScripts);
});

// Delete script
app.delete('/api/scripts/:id', authMiddleware, (req, res) => {
  const index = db.scripts.findIndex(s => s.id === req.params.id && s.userId === req.userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Script not found' });
  }

  db.scripts.splice(index, 1);
  res.json({ message: 'Script deleted successfully' });
});

// Text-to-Speech Routes
app.post('/api/tts/generate', authMiddleware, async (req, res) => {
  try {
    const { text, voice, speed } = req.body;
    const user = db.users.find(u => u.id === req.userId);

    if (!user || user.credits < 10) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    // For demo, we'll use browser TTS or return a sample
    const ttsRecord = {
      id: Date.now().toString(),
      userId: req.userId,
      text: text.substring(0, 500), // Limit text length
      voice: voice || 'th-TH',
      speed: speed || 1.0,
      audioUrl: 'data:audio/mp3;base64,SUQzAwAAAAA...', // In real app, generate actual audio
      createdAt: new Date()
    };

    db.ttsHistory.push(ttsRecord);
    user.credits -= 10;

    res.json({
      message: 'Audio generated successfully!',
      audio: {
        id: ttsRecord.id,
        text: ttsRecord.text,
        audioUrl: ttsRecord.audioUrl,
        downloadUrl: `/api/tts/download/${ttsRecord.id}`
      },
      creditsRemaining: user.credits
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

// Get TTS history
app.get('/api/tts/history', authMiddleware, (req, res) => {
  const userTTS = db.ttsHistory.filter(t => t.userId === req.userId);
  res.json(userTTS);
});

// Get available templates
app.get('/api/templates', (req, res) => {
  res.json(Object.keys(scriptTemplates).map(key => ({
    id: key,
    ...scriptTemplates[key]
  })));
});

// Get user credits
app.get('/api/credits', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    credits: user.credits,
    history: {
      scriptsGenerated: db.scripts.filter(s => s.userId === req.userId).length,
      ttsGenerated: db.ttsHistory.filter(t => t.userId === req.userId).length
    }
  });
});

// Add credits (for demo)
app.post('/api/credits/add', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.credits += 100; // Add 100 free credits
  res.json({
    message: 'Credits added successfully!',
    credits: user.credits
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Full-Featured AI Backend running on port ${PORT}`);
  console.log(`📝 Script Templates: ${Object.keys(scriptTemplates).length} available`);
  console.log(`🤖 AI: Gemini Pro integrated`);
  console.log(`🔊 TTS: Ready for audio generation`);
});