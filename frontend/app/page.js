'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

export default function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setErr('');
    try {
      const d = await api(`/api/auth/${mode}`, { method: 'POST', body: f });
      localStorage.setItem('token', d.token);
      router.push('/chat');
    } catch (e) { setErr(e.message); }
  };
  const input = 'w-full rounded-lg border border-mist bg-white px-3 py-2 dark:bg-ink dark:border-ink';
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-6 p-6">
      <h1 className="text-4xl font-bold">Talk to Aria</h1>
      <p>Ask anything. Replies arrive live and every conversation is saved.</p>
      <form onSubmit={submit} className="grid gap-3">
        {mode === 'signup' && <input className={input} placeholder="Your name" value={f.name} onChange={set('name')} required />}
        <input className={input} type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input className={input} type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} required />
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button className="rounded-lg bg-moss px-4 py-2 font-semibold text-white">{mode === 'login' ? 'Log in' : 'Create account'}</button>
      </form>
      <button className="text-left text-sm underline" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
      </button>
    </main>
  );
}
