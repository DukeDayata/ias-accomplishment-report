const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/auditlogs
// @desc    Get all audit logs
// @access  Private (IAS only)
router.get('/', protect, authorize('IAS Super Administrator', 'IAS Director', 'IAS Staff'), async (req, res) => {
  try {
    const { userId, action, entityType, limit = 100 } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .populate('regionId', 'regionName regionCode')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching audit logs' });
  }
});

module.exports = router;
