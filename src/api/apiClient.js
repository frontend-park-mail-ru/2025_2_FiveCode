import { apiFetch } from "../api.js";
import { login, register, logout, checkSession } from "../auth.js";
import { saveUser, clearUser } from "../utils/session.js";


export const apiClient = {
  async login(creds) {
    const user = await login(creds);
    saveUser(user);
    return user;
  },

  async register(data) {
    const user = await register(data);
    return user;
  },

  async logout() {
    await logout();
    clearUser();
  },

  async me() {
    return await checkSession();
  },

  async getNotesForUser(userId) {
    if (!userId) throw new Error('userId required');
    return apiFetch(`/api/user/${userId}/notes`, { method: 'GET' });
  },
};
