const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const argon2 = require('@node-rs/argon2');

// ─── User ─────────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:          { type: DataTypes.STRING(100), allowNull: false,
                   validate: { len: [1, 100], notEmpty: true } },
  email:         { type: DataTypes.STRING(150), allowNull: false, unique: true,
                   validate: { isEmail: true } },
  // NEVER plain text — always Argon2id hash stored here
  password:      { type: DataTypes.STRING(255), allowNull: false },
  role:          { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' },
  currency:      { type: DataTypes.STRING(10), defaultValue: 'USD' },

  // Forgot-password: one-time token + expiry (never store plain OTP)
  resetToken:    { type: DataTypes.STRING(255), allowNull: true },
  resetExpiry:   { type: DataTypes.DATE, allowNull: true },

  // Account lockout after 5 failed attempts
  failedLogins:  { type: DataTypes.INTEGER, defaultValue: 0 },
  lockUntil:     { type: DataTypes.DATE, allowNull: true },

  // Refresh token stored as Argon2id hash (not plain)
  refreshTokenHash: { type: DataTypes.STRING(255), allowNull: true },

  isActive:      { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      // Argon2id with recommended parameters
      user.password = await argon2.hash(user.password, {
        algorithm: 2,        // Argon2id
        memoryCost: 65536,   // 64 MB
        timeCost: 3,
        parallelism: 4,
      });
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await argon2.hash(user.password, {
          algorithm: 2,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        });
      }
    },
  },
});

User.prototype.comparePassword = async function (candidate) {
  return argon2.verify(this.password, candidate);
};

User.prototype.isLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

// ─── Transaction ──────────────────────────────────────────────────────────────
const Transaction = sequelize.define('Transaction', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:      { type: DataTypes.INTEGER, allowNull: false },
  type:        { type: DataTypes.ENUM('income', 'expense'), allowNull: false },
  amount:      { type: DataTypes.DECIMAL(15, 2), allowNull: false,
                 validate: { min: 0.01 } },
  category:    { type: DataTypes.STRING(100), allowNull: false,
                 validate: { len: [1, 100] } },
  description: { type: DataTypes.STRING(255), allowNull: true },
  date:        { type: DataTypes.DATEONLY, allowNull: false },
  paymentMode: { type: DataTypes.ENUM('cash','card','bank_transfer','upi','other'), defaultValue: 'other' },
  notes:       { type: DataTypes.TEXT, allowNull: true },
  isAnomaly:   { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'transactions',
  indexes: [{ fields: ['userId','date'] }, { fields: ['userId','category'] }],
});

// ─── Budget ───────────────────────────────────────────────────────────────────
const Budget = sequelize.define('Budget', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:         { type: DataTypes.INTEGER, allowNull: false },
  category:       { type: DataTypes.STRING(100), allowNull: false },
  limitAmount:    { type: DataTypes.DECIMAL(15, 2), allowNull: false, validate: { min: 0.01 } },
  month:          { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 12 } },
  year:           { type: DataTypes.INTEGER, allowNull: false },
  alertThreshold: { type: DataTypes.INTEGER, defaultValue: 80 },
  spent:          { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  alertSent80:    { type: DataTypes.BOOLEAN, defaultValue: false },
  alertSent100:   { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'budgets',
  indexes: [{ unique: true, fields: ['userId','category','month','year'] }],
});

// ─── Goal ─────────────────────────────────────────────────────────────────────
const Goal = sequelize.define('Goal', {
  id:                          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:                      { type: DataTypes.INTEGER, allowNull: false },
  name:                        { type: DataTypes.STRING(150), allowNull: false },
  targetAmount:                { type: DataTypes.DECIMAL(15, 2), allowNull: false, validate: { min: 0.01 } },
  currentAmount:               { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  deadline:                    { type: DataTypes.DATEONLY, allowNull: true },
  category:                    { type: DataTypes.ENUM('emergency_fund','vacation','education','home','car','retirement','other'), defaultValue: 'other' },
  status:                      { type: DataTypes.ENUM('active','completed','paused'), defaultValue: 'active' },
  suggestedMonthlyContribution:{ type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
}, { tableName: 'goals' });

// ─── Notification ─────────────────────────────────────────────────────────────
const Notification = sequelize.define('Notification', {
  id:      { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:  { type: DataTypes.INTEGER, allowNull: false },
  type:    { type: DataTypes.ENUM('budget_alert','anomaly_warning','goal_milestone','goal_complete','info'), allowNull: false },
  title:   { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  isRead:  { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'notifications' });

// ─── AuditLog ─────────────────────────────────────────────────────────────────
const AuditLog = sequelize.define('AuditLog', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:     { type: DataTypes.INTEGER, allowNull: true },
  action:     { type: DataTypes.ENUM('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','FAILED_LOGIN','EXPORT','PASSWORD_RESET','ACCOUNT_LOCKED'), allowNull: false },
  resource:   { type: DataTypes.STRING(100), allowNull: false },
  resourceId: { type: DataTypes.INTEGER, allowNull: true },
  details:    { type: DataTypes.JSON, allowNull: true },
  ipAddress:  { type: DataTypes.STRING(60), allowNull: true },
  userAgent:  { type: DataTypes.TEXT, allowNull: true },
  checksum:   { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'audit_logs' });

// ─── Associations ─────────────────────────────────────────────────────────────
User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Budget, { foreignKey: 'userId', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Goal, { foreignKey: 'userId', onDelete: 'CASCADE' });
Goal.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Transaction, Budget, Goal, Notification, AuditLog };
