const jwt = require('jsonwebtoken');

const authMiddleware = (sequelize) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        throw new Error();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const User = sequelize.models.User;
      
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        throw new Error();
      }

      req.user = user;
      req.userId = user.id;
      next();
    } catch (error) {
      res.status(401).json({ message: '#82@I2*9H#0' });
    }
  };
};

module.exports = authMiddleware;