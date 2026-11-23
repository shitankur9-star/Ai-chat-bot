# AI Chatbot (Next.js + Express + MongoDB + Socket.io)

## Run locally
**Backend**
```
cd backend && cp .env.example .env   # set MONGO_URI, JWT_SECRET, OPENAI_API_KEY
npm install && npm run dev
```
**Frontend**
```
cd frontend && cp .env.example .env.local
npm install && npm run dev            # http://localhost:3000
```
Without `OPENAI_API_KEY` the bot answers in demo mode.

## What's included
- Sign up / log in with JWT (bcrypt-hashed passwords, 7-day tokens)
- Real-time chat over authenticated Socket.io, typing indicator
- OpenAI replies with chat styles (casual / professional / creative), 30s timeout, error handling
- Chat history in MongoDB: list, reopen, delete
- Personalization: chatbot name, light/dark mode, thumbs up/down ratings
- Rate limiting (100 req/min on REST, 1 message/sec on sockets), CORS, input validation
- Admin stats: `GET /api/chat/admin/stats` (set `role: "admin"` on a user in MongoDB)

## Deploy
Frontend -> Vercel (`NEXT_PUBLIC_API_URL`), backend -> Render/Railway (env from `.env.example`, `CLIENT_URL` = Vercel URL), database -> MongoDB Atlas.
