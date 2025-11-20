import { config } from "./config/project.config";
export const API_BASE = config.API_BASE_URL;

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  path?: string;
  body?: BodyInit | null;
}

let csrfToken: string | null = null;
let tokenFetchPromise: Promise<string> | null = null;

export function clearCsrfToken(): void {
  csrfToken = null;
  tokenFetchPromise = null;
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  if (!tokenFetchPromise) {
    tokenFetchPromise = fetch(`${API_BASE}/api/csrf-token`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch CSRF token");
        }
        return res.json();
      })
      .then((data) => {
        if (!data.token) {
          throw new Error("CSRF token not found in response");
        }
        csrfToken = data.token;
        return csrfToken!;
      })
      .catch((error) => {
        tokenFetchPromise = null;
        throw error;
      });
  }

  return tokenFetchPromise;
}

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

  const method = (opts.method || "GET").toUpperCase();
  const mutatingMethods = ["POST", "PUT", "DELETE", "PATCH"];

  if (mutatingMethods.includes(method)) {
    try {
      const token = await getCsrfToken();
      (opts.headers as Record<string, string>)["X-CSRF-Token"] = token;
    } catch (error) {
      console.error(
        "Could not obtain CSRF token, request will likely fail.",
        error
      );
    }
  }

  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {}
  if (!res.ok) {
    if (res.status === 403) {
      const errCode = json?.error_code;
      if (
        errCode === "csrf_token_expired" ||
        errCode === "csrf_token_invalid"
      ) {
        clearCsrfToken();
      }
    }
    const err = new Error(json?.error || res.statusText || "API Error");
    (err as any).status = res.status;
    (err as any).body = json;
    throw err;
  }
  return json;
}
