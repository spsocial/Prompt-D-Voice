const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_URL || './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch(err => {
    console.error('Unable to connect to database:', err);
  });

// Import models
const User = require('./models/User')(sequelize);
const Script = require('./models/Script')(sequelize);
const Usage = require('./models/Usage')(sequelize);

// Define associations
User.hasMany(Script, { foreignKey: 'UserId' });
Script.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(Usage, { foreignKey: 'UserId' });
Usage.belongsTo(User, { foreignKey: 'UserId' });

// Sync database
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced');
  })
  .catch(err => {
    console.error('Database sync error:', err);
  });

// Routes
app.use('/api/auth', require('./routes/auth')(sequelize));
app.use('/api/script', require('./routes/script')(sequelize));
app.use('/api/tts', require('./routes/tts')(sequelize));
app.use('/api/usage', require('./routes/usage')(sequelize));
app.use('/api/user', require('./routes/user')(sequelize));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', app: 'PromptD Voice API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`PromptD Voice server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;