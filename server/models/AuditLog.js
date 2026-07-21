const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
  action: { type: String, required: true },
  entityType: { type: String, required: true }, // e.g., 'AccomplishmentEntry', 'Report', 'User'
  entityId: { type: mongoose.Schema.Types.ObjectId },
  previousValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
