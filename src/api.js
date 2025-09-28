const API_BASE = 'http://89.208.210.115:8080';

/**
 * Базовая обёртка fetch.
 * Всегда включает credentials: 'include' для cookie-based сессии.
 * @param {string} path
 * @param {object} options
 */
export async function apiFetch(path, options = {}){
  const url = (path.startsWith('http')) ? path : API_BASE + path;
  const opts = {
    headers: { 'Content-Type':'application/json' },
    credentials: 'include', // очень важно для кросс-доменных cookies
    ...options
  };
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);

  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch(e){}
  if (!res.ok) {
    const err = new Error(json?.message || res.statusText || 'API Error');
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}
