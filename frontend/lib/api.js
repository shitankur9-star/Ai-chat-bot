export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(API + path, {
    method, body: body && JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
