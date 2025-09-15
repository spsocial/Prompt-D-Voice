const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Usage = sequelize.define('Usage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('script_generation', 'tts_conversion'),
      allowNull: false
    },
    count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    month: {
      type: DataTypes.STRING,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['UserId', 'type', 'month']
      }
    ]
  });

  Usage.getLimits = function(plan) {
    const limits = {
      free: {
        script_generation: 10,
        tts_conversion: 5
      },
      pro: {
        script_generation: 100,
        tts_conversion: 60
      },
      enterprise: {
        script_generation: -1,
        tts_conversion: -1
      }
    };
    return limits[plan] || limits.free;
  };

  return Usage;
};