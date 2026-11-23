const r = require('express').Router();
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const pub = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, settings: u.settings });
const token = u => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

r.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 6)
    return res.status(400).json({ error: 'Enter a name, a valid email and a password of 6+ characters.' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: 'That email is already registered.' });
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.json({ token: token(u), user: pub(u) });
});
r.post('/login', async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password)))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: token(u), user: pub(u) });
});
r.get('/me', auth, async (req, res) => res.json({ user: pub(await User.findById(req.userId)) }));
r.patch('/settings', auth, async (req, res) => {
  const { botName, theme } = req.body;
  const u = await User.findById(req.userId);
  if (botName) u.settings.botName = String(botName).slice(0, 30);
  if (['light', 'dark'].includes(theme)) u.settings.theme = theme;
  await u.save();
  res.json({ user: pub(u) });
});
module.exports = r;
