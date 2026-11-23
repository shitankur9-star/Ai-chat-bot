const r = require('express').Router();
const Conversation = require('../models/Conversation'), User = require('../models/User');
const { auth } = require('../middleware/auth');
r.use(auth);
r.get('/conversations', async (req, res) =>
  res.json(await Conversation.find({ user: req.userId }).select('title category updatedAt').sort('-updatedAt')));
r.get('/conversations/:id', async (req, res) => {
  const c = await Conversation.findOne({ _id: req.params.id, user: req.userId });
  c ? res.json(c) : res.status(404).json({ error: 'Conversation not found.' });
});
r.delete('/conversations/:id', async (req, res) => {
  await Conversation.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ ok: true });
});
r.post('/conversations/:id/messages/:mid/rate', async (req, res) => {
  const c = await Conversation.findOne({ _id: req.params.id, user: req.userId });
  const msg = c && c.messages.id(req.params.mid);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });
  msg.rating = [-1, 0, 1].includes(req.body.rating) ? req.body.rating : 0;
  if (req.body.feedback) msg.feedback = String(req.body.feedback).slice(0, 500);
  await c.save();
  res.json({ ok: true });
});
// Admin analytics (set role: "admin" on a user in MongoDB to use this)
r.get('/admin/stats', async (req, res) => {
  if ((await User.findById(req.userId)).role !== 'admin') return res.status(403).json({ error: 'Admins only.' });
  const [users, conversations, agg] = await Promise.all([
    User.countDocuments(), Conversation.countDocuments(),
    Conversation.aggregate([{ $unwind: '$messages' }, { $match: { 'messages.role': 'assistant' } },
      { $group: { _id: null, replies: { $sum: 1 }, avgRating: { $avg: '$messages.rating' } } }]),
  ]);
  res.json({ users, conversations, replies: agg[0]?.replies || 0, avgRating: agg[0]?.avgRating || 0 });
});
module.exports = r;
