const mongoose = require('mongoose');

const activityAccomplishmentSchema = new mongoose.Schema({
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  activityTitle: { type: String, required: true },
  activityCategory: { type: String },
  activityDate: { type: Date },
  startDate: { type: Date },
  endDate: { type: Date },
  venue: { type: String },
  deliveryMode: { type: String },
  description: { type: String },
  objectives: { type: String },
  participantCount: { type: Number, default: 0 },
  maleParticipants: { type: Number, default: 0 },
  femaleParticipants: { type: Number, default: 0 },
  heiCount: { type: Number, default: 0 },
  partnerInstitutions: [{ type: String }],
  outputs: { type: String },
  issues: { type: String },
  recommendations: { type: String },
  evidenceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  status: { type: String, default: 'Draft' }
}, {
  timestamps: true
});

module.exports = mongoose.model('ActivityAccomplishment', activityAccomplishmentSchema);
