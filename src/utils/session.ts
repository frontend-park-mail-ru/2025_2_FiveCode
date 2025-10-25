interface User{
  id?: number;
  username?: string;
  password?: string;
  email?: string;
}


export function saveUser(user : User) {
  localStorage.setItem("user", JSON.stringify(user));
   window.__APP_SESSION__ = { user };
}

export function loadUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function clearUser() {
  localStorage.removeItem("user");
}
