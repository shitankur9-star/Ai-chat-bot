require('dotenv').config();
const express = require('express'), http = require('http'), cors = require('cors');
const mongoose = require('mongoose'), jwt = require('jsonwebtoken'), rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const Conversation = require('./models/Conversation'), User = require('./models/User');
const { reply } = require('./services/ai');

const origin = process.env.CLIENT_URL || 'http://localhost:3000';
const app = express();
app.use(cors({ origin }));
app.use(express.json({ limit: '50kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, max: 100 }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use((err, req, res, next) => res.status(500).json({ error: 'Something went wrong on the server.' }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin } });
io.use((socket, next) => {
  try { socket.userId = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET).id; next(); }
  catch { next(new Error('unauthorized')); }
});
const last = new Map(); // simple per-user throttle for AI calls
io.on('connection', socket => {
  socket.on('message', async ({ conversationId, text, category }) => {
    text = String(text || '').trim().slice(0, 4000);
    if (!text) return;
    if (Date.now() - (last.get(socket.userId) || 0) < 1000)
      return socket.emit('chat_error', { error: 'You are sending messages too fast.' });
    last.set(socket.userId, Date.now());
    try {
      const user = await User.findById(socket.userId);
      let c = conversationId && await Conversation.findOne({ _id: conversationId, user: socket.userId });
      if (!c) c = new Conversation({ user: socket.userId, title: text.slice(0, 40), category });
      c.messages.push({ role: 'user', content: text });
      socket.emit('typing', { conversationId: c.id });
      c.messages.push({ role: 'assistant', content: await reply(c.messages, c.category, user.settings.botName) });
      await c.save();
      socket.emit('reply', { conversationId: c.id, title: c.title, message: c.messages.at(-1) });
    } catch (e) {
      socket.emit('chat_error', { error: 'The AI could not answer. Try again in a moment.' });
    }
  });
});
mongoose.connect(process.env.MONGO_URI)
  .then(() => server.listen(process.env.PORT || 5000, () => console.log('API on :' + (process.env.PORT || 5000))))
  .catch(e => { console.error(e); process.exit(1); });
