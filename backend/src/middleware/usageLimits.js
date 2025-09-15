const usageLimitsMiddleware = (sequelize, type) => {
  return async (req, res, next) => {
    try {
      const Usage = sequelize.models.Usage;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
      }

      if (user.plan === 'enterprise') {
        return next();
      }

      const currentMonth = new Date().toISOString().slice(0, 7);

      let usage = await Usage.findOne({
        where: {
          UserId: user.id,
          type: type,
          month: currentMonth
        }
      });

      if (!usage) {
        usage = await Usage.create({
          UserId: user.id,
          type: type,
          month: currentMonth,
          count: 0
        });
      }

      const limits = Usage.getLimits(user.plan);
      const limit = limits[type];

      if (limit !== -1 && usage.count >= limit) {
        return res.status(429).json({
          message: `คุณใช้งาน${type === 'script_generation' ? 'การสร้างสคริปต์' : 'การแปลงเสียง'}ถึงโควต้าแล้ว`,
          limit: limit,
          used: usage.count,
          plan: user.plan
        });
      }

      req.usage = usage;
      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบโควต้า' });
    }
  };
};

module.exports = usageLimitsMiddleware;