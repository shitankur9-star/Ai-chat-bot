const tone = {
  casual: 'Be friendly and relaxed.',
  professional: 'Be concise, precise and formal.',
  creative: 'Be imaginative and playful.',
};
exports.reply = async (messages, category, botName) => {
  if (!process.env.OPENAI_API_KEY)
    return 'Demo mode: add OPENAI_API_KEY to backend/.env to get real AI answers.';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'system', content: `You are ${botName}, a helpful assistant. ${tone[category]}` },
          ...messages.slice(-20).map(({ role, content }) => ({ role, content }))],
      }),
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);
    return (await res.json()).choices[0].message.content;
  } finally { clearTimeout(timer); }
};
