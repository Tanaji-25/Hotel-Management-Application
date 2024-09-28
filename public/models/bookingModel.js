const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  dob: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  checkin: { type: String, required: true },
  checkout: { type: String, required: true },
  time: { type: String, required: true },
  hotelname: { type: String, required: true },
  image: { type: Buffer },
  imageType: { type: String },
  id: { type: Buffer },
  idType: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Register', required: true } // Add user reference
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
