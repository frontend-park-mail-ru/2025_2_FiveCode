interface User {
  id?: number;
  username?: string;
  password?: string;
  email?: string;
}

export function saveUser(user: User) {
  let u: any = (user as any) ?? null;
  if (u && typeof u === "object" && "user" in u) {
    u = (u as any).user;
  }

  if (u && !u.username && typeof u.email === "string") {
    try {
      u.username = u.email.split("@")[0];
    } catch (e) {
      ;
    }
  }

  localStorage.setItem("user", JSON.stringify(u));
  (window as any).__APP_SESSION__ = { user: u };
}

export function loadUser() {
  const raw = localStorage.getItem("user");
  const parsed = raw ? JSON.parse(raw) : null;
  if (parsed && !parsed.username && typeof parsed.email === "string") {
    try {
      parsed.username = parsed.email.split("@")[0];
    } catch (e) {}
  }
  return parsed;
}

export function clearUser() {
  localStorage.removeItem("user");
}
