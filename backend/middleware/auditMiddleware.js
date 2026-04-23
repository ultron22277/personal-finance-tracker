const { AuditLog } = require('../models/index');
const logger = require('../utils/logger');

const audit = (action, resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async (data) => {
    if (res.statusCode < 400 && req.user) {
      try {
        await AuditLog.create({
          userId: req.user.id,
          action,
          resource,
          resourceId: data?.id || req.params?.id,
          details: {
            method: req.method,
            path: req.path,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      } catch (err) {
        logger.error('Audit log failed:', err.message);
      }
    }
    return originalJson(data);
  };

  next();
};

module.exports = audit;