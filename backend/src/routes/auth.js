const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const router = express.Router();
  const User = sequelize.models.User;
  const authMiddleware = require('../middleware/auth')(sequelize);

  // Register
  router.post('/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
      }

      const user = await User.create({
        email,
        password,
        name,
        prompts: {
          adSpot: process.env.DEFAULT_AD_SPOT_PROMPT,
          liveSale: process.env.DEFAULT_LIVE_SALE_PROMPT,
          tiktok: process.env.DEFAULT_TIKTOK_PROMPT,
          custom: process.env.DEFAULT_CUSTOM_PROMPT,
          podcast: process.env.DEFAULT_PODCAST_PROMPT
        }
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        message: 'สมัครสมาชิกสำเร็จ',
        token,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        message: 'เข้าสู่ระบบสำเร็จ',
        token,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
  });

  // Get current user
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const user = await User.findByPk(req.userId);
      res.json({ user: user.toJSON() });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
    }
  });

  return router;
};