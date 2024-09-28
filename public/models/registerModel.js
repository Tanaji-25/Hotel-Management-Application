const mongoose = require('mongoose');

// Define the schema
const registerSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  dob: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  number: { type: String, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  password: { type: String, required: true }
});

// Create the model
const Register = mongoose.model('Register', registerSchema);

module.exports = Register;
