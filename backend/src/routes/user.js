const express = require('express');

module.exports = (sequelize) => {
  const router = express.Router();
  const User = sequelize.models.User;
  const authMiddleware = require('../middleware/auth')(sequelize);

  // Update API keys
  router.post('/update-api-keys', authMiddleware, async (req, res) => {
    try {
      const { geminiKey, googleKey } = req.body;
      const user = await User.findByPk(req.userId);

      const apiKeys = {
        ...user.apiKeys,
        ...(geminiKey !== undefined && { geminiKey }),
        ...(googleKey !== undefined && { googleKey })
      };

      await user.update({ apiKeys });

      res.json({
        message: 'อัพเดท API Keys สำเร็จ',
        apiKeys: {
          geminiKey: apiKeys.geminiKey ? '***' + apiKeys.geminiKey.slice(-4) : null,
          googleKey: apiKeys.googleKey ? '***' + apiKeys.googleKey.slice(-4) : null
        }
      });
    } catch (error) {
      console.error('Update API keys error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดท API Keys' });
    }
  });

  // Update prompts
  router.post('/update-prompts', authMiddleware, async (req, res) => {
    try {
      const { prompts } = req.body;
      const user = await User.findByPk(req.userId);

      if (!prompts || typeof prompts !== 'object') {
        return res.status(400).json({ message: 'ข้อมูล prompts ไม่ถูกต้อง' });
      }

      const updatedPrompts = {
        ...user.prompts,
        ...prompts
      };

      await user.update({ prompts: updatedPrompts });

      res.json({
        message: 'อัพเดท prompts สำเร็จ',
        prompts: updatedPrompts
      });
    } catch (error) {
      console.error('Update prompts error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดท prompts' });
    }
  });

  // Update settings
  router.post('/update-settings', authMiddleware, async (req, res) => {
    try {
      const { settings } = req.body;
      const user = await User.findByPk(req.userId);

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ message: 'ข้อมูล settings ไม่ถูกต้อง' });
      }

      const updatedSettings = {
        ...user.settings,
        ...settings
      };

      await user.update({ settings: updatedSettings });

      res.json({
        message: 'อัพเดท settings สำเร็จ',
        settings: updatedSettings
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดท settings' });
    }
  });

  // Upgrade plan
  router.post('/upgrade-plan', authMiddleware, async (req, res) => {
    try {
      const { plan } = req.body;
      const validPlans = ['free', 'pro', 'enterprise'];

      if (!validPlans.includes(plan)) {
        return res.status(400).json({ message: 'แพลนไม่ถูกต้อง' });
      }

      const user = await User.findByPk(req.userId);
      await user.update({ plan });

      res.json({
        message: `อัพเกรดเป็นแพลน ${plan} สำเร็จ`,
        plan
      });
    } catch (error) {
      console.error('Upgrade plan error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเกรดแพลน' });
    }
  });

  return router;
};