const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    plan: {
      type: DataTypes.ENUM('free', 'pro', 'enterprise'),
      defaultValue: 'free'
    },
    apiKeys: {
      type: DataTypes.JSON,
      defaultValue: {
        geminiKey: null,
        googleKey: null
      }
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        fontSize: 16,
        theme: 'dark',
        language: 'th'
      }
    },
    prompts: {
      type: DataTypes.JSON,
      defaultValue: {
        adSpot: process.env.DEFAULT_AD_SPOT_PROMPT,
        liveSale: process.env.DEFAULT_LIVE_SALE_PROMPT,
        tiktok: process.env.DEFAULT_TIKTOK_PROMPT,
        custom: process.env.DEFAULT_CUSTOM_PROMPT,
        podcast: process.env.DEFAULT_PODCAST_PROMPT
      }
    }
  }, {
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  User.prototype.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  return User;
};