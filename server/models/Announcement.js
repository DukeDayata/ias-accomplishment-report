const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['General', 'Important', 'Urgent'], default: 'General' },
  audienceType: { type: String, enum: ['All', 'Selected Regions', 'Specific Roles'], default: 'All' },
  regionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Region' }],
  roleIds: [{ type: String }], // Store role names as strings based on the User model enum
  attachmentUrl: { type: String },
  publishDate: { type: Date, default: Date.now },
  expirationDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);
