'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { api, API, getToken } from '../../lib/api';

export default function Chat() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('casual');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const socket = useRef(null), activeRef = useRef(null), end = useRef(null);
  activeRef.current = active;

  const loadConvos = () => api('/api/chat/conversations').then(setConvos);
  useEffect(() => {
    if (!getToken()) return router.replace('/');
    api('/api/auth/me').then(d => setUser(d.user)).catch(() => router.replace('/'));
    loadConvos();
    const s = io(API, { auth: { token: getToken() } });
    socket.current = s;
    s.on('typing', () => setTyping(true));
    s.on('reply', ({ conversationId, message }) => {
      setTyping(false);
      if (!activeRef.current) setActive(conversationId);
      if (!activeRef.current || activeRef.current === conversationId) setMsgs(m => [...m, message]);
      loadConvos();
    });
    s.on('chat_error', d => { setTyping(false); setError(d.error); });
    return () => s.disconnect();
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', user?.settings.theme === 'dark'); }, [user]);
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs, typing]);

  const open = async id => { setActive(id); setError(''); setMsgs((await api('/api/chat/conversations/' + id)).messages); };
  const fresh = () => { setActive(null); setMsgs([]); };
  const send = e => {
    e.preventDefault();
    if (!text.trim()) return;
    setError(''); setMsgs(m => [...m, { role: 'user', content: text }]);
    socket.current.emit('message', { conversationId: active, text, category });
    setText('');
  };
  const rate = async (m, rating) => {
    await api(`/api/chat/conversations/${active}/messages/${m._id}/rate`, { method: 'POST', body: { rating } });
    setMsgs(list => list.map(x => (x._id === m._id ? { ...x, rating } : x)));
  };
  const remove = async id => { await api('/api/chat/conversations/' + id, { method: 'DELETE' }); if (id === active) fresh(); loadConvos(); };
  const saveSettings = async patch => setUser((await api('/api/auth/settings', { method: 'PATCH', body: patch })).user);
  const logout = () => { localStorage.removeItem('token'); router.push('/'); };
  const bot = user?.settings.botName || 'Aria';

  return (
    <div className="grid h-screen grid-cols-1 md:grid-cols-[18rem_1fr]">
      <aside className="hidden flex-col gap-2 border-r border-mist p-3 dark:border-ink md:flex">
        <button onClick={fresh} className="rounded-lg bg-moss px-3 py-2 font-semibold text-white">New chat</button>
        <ul className="flex-1 overflow-y-auto">
          {convos.map(c => (
            <li key={c._id} className={`group flex items-center justify-between rounded-lg px-2 py-2 ${c._id === active ? 'bg-mist dark:bg-ink' : ''}`}>
              <button className="flex-1 truncate text-left" onClick={() => open(c._id)}>{c.title}</button>
              <button aria-label="Delete chat" className="px-1 opacity-0 group-hover:opacity-100" onClick={() => remove(c._id)}>✕</button>
            </li>
          ))}
          {!convos.length && <li className="p-2 text-sm opacity-70">No chats yet. Send your first message.</li>}
        </ul>
        <button onClick={() => setShowSettings(!showSettings)} className="rounded-lg border border-mist px-3 py-2 text-left dark:border-ink">Settings</button>
        {showSettings && user && (
          <div className="grid gap-2 text-sm">
            <label>Chatbot name
              <input defaultValue={bot} onBlur={e => saveSettings({ botName: e.target.value })} className="mt-1 w-full rounded border border-mist bg-transparent px-2 py-1 dark:border-ink" />
            </label>
            <button onClick={() => saveSettings({ theme: user.settings.theme === 'dark' ? 'light' : 'dark' })} className="rounded border border-mist px-2 py-1 text-left dark:border-ink">
              Switch to {user.settings.theme === 'dark' ? 'light' : 'dark'} mode
            </button>
          </div>
        )}
        <button onClick={logout} className="text-left text-sm underline">Log out {user?.name}</button>
      </aside>

      <main className="flex min-h-0 flex-col">
        <header className="flex items-center justify-between border-b border-mist p-3 dark:border-ink">
          <h1 className="font-bold">{bot}</h1>
          <select aria-label="Chat style" value={category} onChange={e => setCategory(e.target.value)} className="rounded border border-mist bg-transparent px-2 py-1 dark:border-ink">
            <option value="casual">Casual</option><option value="professional">Professional</option><option value="creative">Creative</option>
          </select>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!msgs.length && <p className="mt-16 text-center text-lg opacity-70">What do you want to work on today?</p>}
          {msgs.map((m, i) => (
            <div key={m._id || i} className={`flex ${m.role === 'user' ? 'justify-end' : ''}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 md:max-w-xl ${m.role === 'user' ? 'bg-moss text-white' : 'bg-mist dark:bg-ink'}`}>
                {m.content}
                {m.role === 'assistant' && m._id && (
                  <div className="mt-1 flex gap-2 text-sm">
                    <button aria-label="Good answer" onClick={() => rate(m, m.rating === 1 ? 0 : 1)} className={m.rating === 1 ? '' : 'opacity-40'}>👍</button>
                    <button aria-label="Bad answer" onClick={() => rate(m, m.rating === -1 ? 0 : -1)} className={m.rating === -1 ? '' : 'opacity-40'}>👎</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && <p className="text-sm opacity-70">{bot} is typing…</p>}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-mist p-3 dark:border-ink">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message" aria-label="Message"
            className="flex-1 rounded-lg border border-mist bg-white px-3 py-2 dark:border-ink dark:bg-ink" />
          <button className="rounded-lg bg-moss px-4 py-2 font-semibold text-white">Send</button>
        </form>
      </main>
    </div>
  );
}
