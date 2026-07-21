const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  accomplishmentEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccomplishmentEntry' },
  documentType: { type: String },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileKey: { type: String },
  mimeType: { type: String },
  fileSize: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
