const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.static('public'));

// Initialize APIs
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Google Cloud TTS Client (requires service account key)
let ttsClient;
try {
  ttsClient = new textToSpeech.TextToSpeechClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account-key.json'
  });
} catch (error) {
  console.log('TTS Client initialization skipped - using fallback');
}

// Available voices (Thai and English)
const AVAILABLE_VOICES = [
  // Thai voices
  { code: 'th-TH-Standard-A', name: 'ภาษาไทย - หญิง A', language: 'th-TH', gender: 'FEMALE' },
  { code: 'th-TH-Neural2-C', name: 'ภาษาไทย - หญิง Neural', language: 'th-TH', gender: 'FEMALE' },

  // English voices
  { code: 'en-US-Standard-A', name: 'English - Male A', language: 'en-US', gender: 'MALE' },
  { code: 'en-US-Standard-B', name: 'English - Male B', language: 'en-US', gender: 'MALE' },
  { code: 'en-US-Standard-C', name: 'English - Female C', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Standard-D', name: 'English - Female D', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Standard-E', name: 'English - Female E', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Standard-F', name: 'English - Female F', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Standard-G', name: 'English - Female G', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Standard-H', name: 'English - Female H', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Standard-I', name: 'English - Male I', language: 'en-US', gender: 'MALE' },
  { code: 'en-US-Standard-J', name: 'English - Male J', language: 'en-US', gender: 'MALE' },

  // Neural2 voices (higher quality)
  { code: 'en-US-Neural2-A', name: 'English Neural - Female A', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Neural2-C', name: 'English Neural - Female C', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Neural2-D', name: 'English Neural - Male D', language: 'en-US', gender: 'MALE' },
  { code: 'en-US-Neural2-E', name: 'English Neural - Female E', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Neural2-F', name: 'English Neural - Female F', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Neural2-G', name: 'English Neural - Female G', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Neural2-H', name: 'English Neural - Female H', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Neural2-I', name: 'English Neural - Male I', language: 'en-US', gender: 'MALE' },
  { code: 'en-US-Neural2-J', name: 'English Neural - Male J', language: 'en-US', gender: 'MALE' },

  // Wavenet voices (most natural)
  { code: 'en-US-Wavenet-A', name: 'English Wavenet - Male A', language: 'en-US', gender: 'MALE' },
  { code: 'en-US-Wavenet-B', name: 'English Wavenet - Male B', language: 'en-US', gender: 'MALE' },
  { code: 'en-US-Wavenet-C', name: 'English Wavenet - Female C', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Wavenet-D', name: 'English Wavenet - Male D', language: 'en-US', gender: 'MALE' },
  { code: 'en-US-Wavenet-E', name: 'English Wavenet - Female E', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Wavenet-F', name: 'English Wavenet - Female F', language: 'en-US', gender: 'FEMALE' },

  // Studio voices
  { code: 'en-US-Studio-O', name: 'English Studio - Female O', language: 'en-US', gender: 'FEMALE' },
  { code: 'en-US-Studio-Q', name: 'English Studio - Male Q', language: 'en-US', gender: 'MALE' }
];

// Database setup
const dbPath = path.join(__dirname, '..', 'data');
const usersFile = path.join(dbPath, 'users.json');
const scriptsFile = path.join(dbPath, 'scripts.json');
const audioFile = path.join(dbPath, 'audio.json');

// Create directories
async function initDirectories() {
  try {
    await fs.mkdir(dbPath, { recursive: true });
    await fs.mkdir(path.join(__dirname, '..', 'public', 'audio'), { recursive: true });
  } catch (error) {
    console.log('Directories already exist');
  }
}

initDirectories();

// Database functions
async function loadDB(file, defaultValue) {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return defaultValue;
  }
}

async function saveDB(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// JWT functions
const JWT_SECRET = process.env.JWT_SECRET || 'professional-secret-key-2024';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
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

// Professional script templates
const SCRIPT_TEMPLATES = {
  advert30: {
    name: 'โฆษณา 30 วินาที',
    systemPrompt: 'คุณเป็นนักเขียนโฆษณามืออาชีพ สร้างสคริปต์โฆษณา 30 วินาที ที่กระชับ น่าสนใจ จดจำง่าย มี hook แรง call to action ชัดเจน',
    userPrompt: 'สร้างสคริปต์โฆษณา 30 วินาที สำหรับ: '
  },
  livestream: {
    name: 'ไลฟ์ขายของ',
    systemPrompt: 'คุณเป็นพิธีกรขายของออนไลน์ที่ประสบความสำเร็จ สร้างบทพูดที่สร้างความตื่นเต้น โน้มน้าวใจ สร้าง urgency และ scarcity',
    userPrompt: 'สร้างบทพูดขายสดไลฟ์สตรีม พูดแบบกระตุ้นยอดขาย สำหรับ: '
  },
  tiktok: {
    name: 'TikTok / Reels',
    systemPrompt: 'คุณเป็น content creator ยอดนิยม สร้างสคริปต์วิดีโอสั้น 15-30 วินาที ที่มี hook แรงใน 3 วินาทีแรก trending format',
    userPrompt: 'สร้างสคริปต์ TikTok/Reels ที่ viral ได้ สำหรับ: '
  },
  review: {
    name: 'รีวิวสินค้า',
    systemPrompt: 'คุณเป็นนักรีวิวที่น่าเชื่อถือ สร้างบทรีวิวที่ให้ข้อมูลครบถ้วน พูดถึงข้อดี-ข้อเสีย อย่างตรงไปตรงมา',
    userPrompt: 'สร้างบทรีวิวสินค้าแบบมืออาชีพ ครอบคลุมทุกแง่มุม สำหรับ: '
  },
  podcast: {
    name: 'Podcast / YouTube',
    systemPrompt: 'คุณเป็น podcaster มืออาชีพ สร้างบทพูดที่เป็นธรรมชาติ ให้ข้อมูลที่มีคุณค่า storytelling ดี',
    userPrompt: 'สร้างบท podcast แนะนำสินค้าแบบให้ความรู้และเป็นกันเอง สำหรับ: '
  },
  hardsell: {
    name: 'Hard Sell',
    systemPrompt: 'คุณเป็นนักขายที่เก่งที่สุด สร้างบทขายตรงๆ แรงๆ ปิดการขายได้จริง ใช้เทคนิคจิตวิทยาการขาย',
    userPrompt: 'สร้างบทขายแบบ hard sell ปิดการขายได้ทันที สำหรับ: '
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Professional Script & TTS System',
    features: [
      'Gemini Pro AI Integration',
      'Google Cloud Text-to-Speech',
      '30+ Professional Voices',
      'Multiple Script Templates'
    ]
  });
});

// Get available voices
app.get('/api/voices', (req, res) => {
  res.json({
    voices: AVAILABLE_VOICES,
    categories: {
      thai: AVAILABLE_VOICES.filter(v => v.language.startsWith('th')),
      standard: AVAILABLE_VOICES.filter(v => v.code.includes('Standard')),
      neural: AVAILABLE_VOICES.filter(v => v.code.includes('Neural')),
      wavenet: AVAILABLE_VOICES.filter(v => v.code.includes('Wavenet')),
      studio: AVAILABLE_VOICES.filter(v => v.code.includes('Studio'))
    }
  });
});

// Get script templates
app.get('/api/templates', (req, res) => {
  res.json(Object.keys(SCRIPT_TEMPLATES).map(key => ({
    id: key,
    ...SCRIPT_TEMPLATES[key]
  })));
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const users = await loadDB(usersFile, []);

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      email,
      name,
      password: hashedPassword,
      credits: 500, // Start with 500 credits
      plan: 'free',
      createdAt: new Date()
    };

    users.push(user);
    await saveDB(usersFile, users);

    const token = generateToken(user.id);

    res.json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await loadDB(usersFile, []);
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Generate script with Gemini
app.post('/api/scripts/generate', authMiddleware, async (req, res) => {
  try {
    const { templateId, productInfo, targetAudience, tone, keywords, length } = req.body;

    const users = await loadDB(usersFile, []);
    const user = users.find(u => u.id === req.userId);

    if (!user || user.credits < 10) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    const template = SCRIPT_TEMPLATES[templateId] || SCRIPT_TEMPLATES.advert30;

    // Build professional prompt
    let prompt = `${template.systemPrompt}\n\n`;
    prompt += `${template.userPrompt}${productInfo}\n\n`;
    prompt += `ข้อมูลเพิ่มเติม:\n`;
    if (targetAudience) prompt += `- กลุ่มเป้าหมาย: ${targetAudience}\n`;
    if (tone) prompt += `- โทนเสียง: ${tone}\n`;
    if (keywords) prompt += `- คีย์เวิร์ดสำคัญ: ${keywords}\n`;
    if (length) prompt += `- ความยาว: ${length}\n`;
    prompt += `\nกรุณาเขียนสคริปต์ที่:\n`;
    prompt += `1. เหมาะกับการอ่านออกเสียง\n`;
    prompt += `2. มีจังหวะที่ดี ไม่รวบรัด\n`;
    prompt += `3. ใช้ภาษาที่เข้าใจง่าย\n`;
    prompt += `4. มี emotional triggers\n`;
    prompt += `5. จบด้วย clear call to action`;

    // Generate with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const scriptContent = response.text();

    // Save script
    const scripts = await loadDB(scriptsFile, []);
    const script = {
      id: Date.now().toString(),
      userId: req.userId,
      templateId,
      productInfo,
      content: scriptContent,
      metadata: { targetAudience, tone, keywords, length },
      createdAt: new Date()
    };

    scripts.push(script);
    await saveDB(scriptsFile, scripts);

    // Deduct credits
    user.credits -= 10;
    await saveDB(usersFile, users);

    res.json({
      success: true,
      script: {
        id: script.id,
        content: scriptContent,
        template: template.name,
        createdAt: script.createdAt
      },
      creditsRemaining: user.credits
    });
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

// Text to Speech with Google Cloud
app.post('/api/tts/generate', authMiddleware, async (req, res) => {
  try {
    const { text, voiceCode, speed = 1.0, pitch = 0 } = req.body;

    const users = await loadDB(usersFile, []);
    const user = users.find(u => u.id === req.userId);

    if (!user || user.credits < 20) {
      return res.status(403).json({ error: 'Insufficient credits (need 20)' });
    }

    const voice = AVAILABLE_VOICES.find(v => v.code === voiceCode) || AVAILABLE_VOICES[0];

    if (!ttsClient) {
      // Fallback if TTS not configured
      return res.json({
        success: true,
        message: 'TTS demo mode - configure Google Cloud for real audio',
        audio: {
          url: '/api/tts/demo',
          voice: voice.name,
          duration: '0:30'
        },
        creditsRemaining: user.credits
      });
    }

    // Google Cloud TTS request
    const request = {
      input: { text },
      voice: {
        languageCode: voice.language,
        name: voice.code,
        ssmlGender: voice.gender
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speed,
        pitch: pitch
      }
    };

    const [response] = await ttsClient.synthesizeSpeech(request);

    // Save audio file
    const audioId = Date.now().toString();
    const audioPath = path.join(__dirname, '..', 'public', 'audio', `${audioId}.mp3`);
    await fs.writeFile(audioPath, response.audioContent, 'binary');

    // Save to database
    const audioRecords = await loadDB(audioFile, []);
    audioRecords.push({
      id: audioId,
      userId: req.userId,
      text: text.substring(0, 100),
      voice: voice.name,
      voiceCode: voice.code,
      createdAt: new Date()
    });
    await saveDB(audioFile, audioRecords);

    // Deduct credits
    user.credits -= 20;
    await saveDB(usersFile, users);

    res.json({
      success: true,
      audio: {
        id: audioId,
        url: `/audio/${audioId}.mp3`,
        voice: voice.name,
        duration: Math.ceil(text.length / 150) + ' mins'
      },
      creditsRemaining: user.credits
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

// Get user scripts
app.get('/api/scripts', authMiddleware, async (req, res) => {
  try {
    const scripts = await loadDB(scriptsFile, []);
    const userScripts = scripts.filter(s => s.userId === req.userId);
    res.json(userScripts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load scripts' });
  }
});

// Get user info
app.get('/api/user/info', authMiddleware, async (req, res) => {
  try {
    const users = await loadDB(usersFile, []);
    const user = users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      credits: user.credits,
      plan: user.plan,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Add credits
app.post('/api/credits/add', authMiddleware, async (req, res) => {
  try {
    const { amount = 100 } = req.body;

    const users = await loadDB(usersFile, []);
    const user = users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.credits += amount;
    await saveDB(usersFile, users);

    res.json({
      success: true,
      credits: user.credits,
      message: `Added ${amount} credits`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   🚀 Professional Script & TTS System      ║
║   Port: ${PORT}                            ║
║   AI: Gemini Pro                           ║
║   TTS: Google Cloud Text-to-Speech         ║
║   Voices: ${AVAILABLE_VOICES.length} professional voices      ║
╚════════════════════════════════════════════╝
  `);
});