const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  clerkUserId: { type: String },
  authenticationId: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { 
    type: String, 
    required: true,
    enum: [
      'IAS Super Administrator',
      'IAS Monitoring Officer',
      'IAS Management or Director',
      'Regional Administrator or IZN Focal Person',
      'Project Technical Staff',
      'Regional Director'
    ]
  },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
  position: { type: String },
  contactNumber: { type: String },
  accountStatus: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Suspended'], 
    default: 'Active' 
  },
  lastLogin: { type: Date }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password match verification
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
