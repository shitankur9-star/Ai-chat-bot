const m = require('mongoose');
const Message = new m.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  rating: { type: Number, enum: [-1, 0, 1], default: 0 },
  feedback: String,
}, { timestamps: true });
module.exports = m.model('Conversation', new m.Schema({
  user: { type: m.Schema.Types.ObjectId, ref: 'User', index: true },
  title: String,
  category: { type: String, enum: ['casual', 'professional', 'creative'], default: 'casual' },
  messages: [Message],
}, { timestamps: true }));
