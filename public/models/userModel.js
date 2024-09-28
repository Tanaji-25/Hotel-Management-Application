// user.js
const mongoose = require('../conn');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  address: { type: String },
  // Add more fields as needed
});

const User = mongoose.model('User', userSchema);

module.exports = User;
