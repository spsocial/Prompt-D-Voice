const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const router = express.Router();
  const Script = sequelize.models.Script;
  const Usage = sequelize.models.Usage;
  const authMiddleware = require('../middleware/auth')(sequelize);
  const usageLimitsMiddleware = require('../middleware/usageLimits')(sequelize, 'tts_conversion');

  // Available voices
  const voices = {
    edge: {
      thai: [
        { id: 'th-TH-PremwadeeNeural', name: 'Premwadee (หญิง)', gender: 'female' },
        { id: 'th-TH-NiwatNeural', name: 'Niwat (ชาย)', gender: 'male' }
      ],
      english: [
        { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'female' },
        { id: 'en-US-GuyNeural', name: 'Guy', gender: 'male' },
        { id: 'en-US-AriaNeural', name: 'Aria', gender: 'female' },
        { id: 'en-US-DavisNeural', name: 'Davis', gender: 'male' }
      ]
    },
    google: {
      thai: [
        { id: 'th-TH-Standard-A', name: 'Thai Female', gender: 'female' },
        { id: 'th-TH-Wavenet-A', name: 'Thai Female Wavenet', gender: 'female' },
        { id: 'th-TH-Wavenet-B', name: 'Thai Male Wavenet', gender: 'male' }
      ],
      english: [
        { id: 'en-US-Wavenet-F', name: 'US Female Wavenet', gender: 'female' },
        { id: 'en-US-Wavenet-D', name: 'US Male Wavenet', gender: 'male' }
      ]
    }
  };

  // Get available voices
  router.get('/voices', authMiddleware, (req, res) => {
    const provider = req.query.provider || 'edge';
    res.json({ voices: voices[provider] || voices.edge });
  });

  // Generate TTS
  router.post('/generate', authMiddleware, usageLimitsMiddleware, async (req, res) => {
    try {
      const { text, scriptId, voice, provider = 'edge', speed = 1.0, pitch = 1.0 } = req.body;
      const user = req.user;

      if (!text && !scriptId) {
        return res.status(400).json({ message: 'กรุณาใส่ข้อความหรือเลือกสคริปต์' });
      }

      if (!voice) {
        return res.status(400).json({ message: 'กรุณาเลือกเสียง' });
      }

      // Get text from script if scriptId provided
      let contentToConvert = text;
      if (scriptId) {
        const script = await Script.findOne({
          where: {
            id: scriptId,
            UserId: user.id
          }
        });
        if (!script) {
          return res.status(404).json({ message: 'ไม่พบสคริปต์' });
        }
        contentToConvert = script.content;
      }

      // Check duration limit (estimate 150 chars per minute)
      const estimatedMinutes = Math.ceil(contentToConvert.length / 150);
      const limits = Usage.getLimits(user.plan);
      const currentMonth = new Date().toISOString().slice(0, 7);

      const currentUsage = await Usage.findOne({
        where: {
          UserId: user.id,
          type: 'tts_conversion',
          month: currentMonth
        }
      });

      if (limits.tts_conversion !== -1 &&
          currentUsage &&
          (currentUsage.count + estimatedMinutes) > limits.tts_conversion) {
        return res.status(429).json({
          message: 'เกินขีดจำกัดการใช้งาน TTS',
          limit: limits.tts_conversion,
          used: currentUsage.count,
          requested: estimatedMinutes
        });
      }

      // Generate audio file
      const filename = `${uuidv4()}.mp3`;
      const filepath = path.join(__dirname, '..', '..', 'uploads', 'audio', filename);

      if (provider === 'edge') {
        // Simulated Edge TTS (in real implementation, use edge-tts library)
        // For now, create a placeholder file
        await fs.writeFile(filepath, Buffer.from('placeholder audio data'));
      } else if (provider === 'google' && user.apiKeys?.googleKey) {
        // Google TTS implementation would go here
        return res.status(501).json({ message: 'Google TTS ยังไม่พร้อมใช้งาน' });
      } else {
        return res.status(400).json({ message: 'ไม่พบระบบ TTS provider ที่ระบุ' });
      }

      // Update script with audio file if scriptId provided
      if (scriptId) {
        const script = await Script.findByPk(scriptId);
        const audioFiles = script.audioFiles || [];
        audioFiles.push({
          filename,
          voice,
          provider,
          createdAt: new Date(),
          duration: estimatedMinutes
        });
        await script.update({ audioFiles });
      }

      // Update usage
      await Usage.increment('count', {
        by: estimatedMinutes,
        where: {
          UserId: user.id,
          type: 'tts_conversion',
          month: currentMonth
        }
      });

      res.json({
        message: 'สร้างไฟล์เสียงสำเร็จ',
        file: {
          filename,
          url: `/uploads/audio/${filename}`,
          duration: estimatedMinutes,
          voice,
          provider
        }
      });
    } catch (error) {
      console.error('TTS generation error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างไฟล์เสียง' });
    }
  });

  return router;
};