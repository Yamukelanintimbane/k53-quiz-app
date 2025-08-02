const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Remove username field or use sparse index
  username: { type: String, unique: true, sparse: true }
});

module.exports = mongoose.model('User', userSchema);

