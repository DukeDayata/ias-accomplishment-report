const AuditLog = require('../models/AuditLog');

/**
 * Log an audit action to the database.
 * @param {Object} user - The user object from req.user
 * @param {String} action - 'CREATE', 'UPDATE', 'DELETE', or 'BULK_UPLOAD'
 * @param {String} collectionName - E.g. 'WFP_ACTIVITY', 'BUDGET_TRANSACTION', 'USER'
 * @param {Mixed} documentId - The ID of the affected document (or null)
 * @param {Object} details - Additional contextual details
 */
const logAction = async (user, action, collectionName, documentId, details = {}) => {
  try {
    console.log(`logAction invoked for action: ${action}, collection: ${collectionName}`);
    console.log(`User: `, user ? user._id : 'undefined');
    if (!user) return; // Cannot log if no user context
    
    await AuditLog.create({
      action,
      collectionName,
      documentId,
      user: user._id,
      username: user.name || user.email,
      details
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

module.exports = { logAction };
