import { config } from "./config/project.config";
export const API_BASE = config.API_BASE_URL;

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  path?: string;
  body?: BodyInit | null;
}

/**
 * Базовая обёртка fetch
 * Всегда включает credentials: 'include' для cookie-based сессии
 * @param {string} path
 * @param {object} options
 */
export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {}
): Promise<any> {
  const url = path.startsWith("http") ? path : API_BASE + path;
  const opts: RequestInit = {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
    ...options,
  };
  if (opts.body && typeof opts.body !== "string")
    opts.body = JSON.stringify(opts.body);

  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {}
  if (!res.ok) {
    const err = new Error(json?.message || res.statusText || "API Error");
    (err as any).status = res.status;
    (err as any).body = json;
    throw err;
  }
  return json;
}
