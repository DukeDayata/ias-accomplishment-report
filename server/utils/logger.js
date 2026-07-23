const AuditLog = require('../models/AuditLog');

/**
 * Log an audit action to the database.
 * @param {Object} req - The Express request object
 * @param {String} action - E.g. 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
 * @param {String} entityType - E.g. 'User', 'Report', 'AccomplishmentEntry'
 * @param {String|ObjectId} entityId - The ID of the affected document (or null)
 * @param {Object} previousValue - The previous state of the document (optional)
 * @param {Object} newValue - The new state of the document (optional)
 */
const logAction = async (req, action, entityType, entityId = null, previousValue = null, newValue = null) => {
  try {
    if (!req || !req.user) return; // Cannot log if no user context

    const user = req.user;
    
    await AuditLog.create({
      userId: user._id || user.id,
      regionId: user.regionId || user.region || null,
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

module.exports = { logAction };
