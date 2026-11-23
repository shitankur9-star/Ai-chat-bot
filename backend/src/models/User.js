const m = require('mongoose');
module.exports = m.model('User', new m.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  settings: { botName: { type: String, default: 'Aria' }, theme: { type: String, default: 'light' } },
}, { timestamps: true }));
