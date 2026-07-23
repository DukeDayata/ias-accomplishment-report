const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

// Get all users
router.get('/', protect, authorize('IAS Super Administrator'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password').populate('regionId');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Create a new user
router.post('/', protect, authorize('IAS Super Administrator'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, regionId } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = new User({ firstName, lastName, email, password, role, regionId });
    const saved = await newUser.save();
    
    const userResponse = {
      _id: saved._id,
      firstName: saved.firstName,
      lastName: saved.lastName,
      email: saved.email,
      role: saved.role,
      regionId: saved.regionId,
      createdAt: saved.createdAt
    };
    
    await logAction(req, 'CREATE', 'User', saved._id, null, userResponse);
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// Update own profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const previousState = user.toObject();

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (password) user.password = password;

    const updated = await user.save();
    
    const userResponse = {
      _id: updated._id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      role: updated.role,
      regionId: updated.regionId,
      createdAt: updated.createdAt
    };
    
    await logAction(req, 'UPDATE', 'User', updated._id, {
      firstName: previousState.firstName,
      lastName: previousState.lastName,
      email: previousState.email
    }, userResponse);

    res.json(userResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Update an existing user
router.put('/:id', protect, authorize('IAS Super Administrator'), async (req, res) => {
  try {
    const { firstName, lastName, email, role, regionId, password } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const previousState = user.toObject();

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.role = role || user.role;
    
    if (user.role.startsWith('IAS')) {
      user.regionId = null;
    } else if (regionId !== undefined) {
      user.regionId = regionId;
    }
    
    if (password) {
      user.password = password;
    }

    const updated = await user.save();
    
    const userResponse = {
      _id: updated._id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      role: updated.role,
      regionId: updated.regionId,
      createdAt: updated.createdAt
    };
    
    await logAction(req, 'UPDATE', 'User', updated._id, {
      firstName: previousState.firstName,
      lastName: previousState.lastName,
      email: previousState.email,
      role: previousState.role,
      regionId: previousState.regionId
    }, userResponse);

    res.json(userResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating user' });
  }
});

// Delete a user
router.delete('/:id', protect, authorize('IAS Super Administrator'), async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    
    await logAction(req, 'DELETE', 'User', deleted._id, {
      firstName: deleted.firstName,
      lastName: deleted.lastName,
      email: deleted.email,
      role: deleted.role
    }, null);
    
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

module.exports = router;
