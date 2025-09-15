const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false,
  dialectModule: require('better-sqlite3')  // <-- เพิ่มบรรทัดนี้
});