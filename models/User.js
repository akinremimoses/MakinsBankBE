const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  accountNumber: {
    type: String,
    unique: true,
    default: () => 'MAK' + Math.floor(100000 + Math.random() * 900000)
  },
  balance: { type: Number, default: 10000 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
