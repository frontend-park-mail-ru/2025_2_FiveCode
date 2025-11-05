import { apiFetch, API_BASE } from "../api";
import { login, register, logout, checkSession } from "../auth";
import { saveUser, clearUser } from "../utils/session";
import { Block } from "../components/block";

interface User {
  id?: number;
  username?: string;
  password?: string;
  email?: string;
}

export interface UploadedFile {
  id: number;
  url: string;
  mime_type: string;
  size_bytes: number;
}

export const apiClient = {
  async login(creds: User): Promise<User> {
    const user = await login(creds);
    saveUser(user);
    return user;
  },

  async register(data: Object): Promise<User> {
    const user = await register(data);
    return user;
  },

  async logout(): Promise<void> {
    await logout();
    clearUser();
  },

  async me(): Promise<User | null> {
    return await checkSession();
  },

  async getNotesForUser(): Promise<Array<any>> {
    return apiFetch(`/api/notes`, { method: "GET" });
  },

  async getNote(noteId: string | number): Promise<any> {
    if (!noteId) throw new Error("noteId required");
    return apiFetch(`/api/notes/${noteId}`, { method: "GET" });
  },

  async updateNote(
    noteId: string | number,
    data: { title: string }
  ): Promise<any> {
    if (!noteId) throw new Error("noteId required");
    return apiFetch(`/api/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async createNote(): Promise<any> {
    return apiFetch(`/api/notes`, { method: "POST" });
  },

  async deleteNote(noteId: string | number): Promise<void> {
    if (!noteId) throw new Error("noteId required");
    return apiFetch(`/api/notes/${noteId}`, { method: "DELETE" });
  },

  async toggleFavorite(
    noteId: string | number,
    isFavorite: boolean
  ): Promise<void> {
    const method = isFavorite ? "POST" : "DELETE";
    return apiFetch(`/api/notes/${noteId}/favorite`, { method });
  },

  async getBlocksForNote(
    noteId: string | number
  ): Promise<{ blocks: Block[] }> {
    return apiFetch(`/api/notes/${noteId}/blocks`, { method: "GET" });
  },

  async createBlock(
    noteId: string | number,
    data: { type: string; before_block_id?: string | number; file_id?: number }
  ): Promise<Block> {
    return apiFetch(`/api/notes/${noteId}/blocks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateBlock(
    blockId: string | number,
    data: { text: string; formats: any[] }
  ): Promise<Block> {
    return apiFetch(`/api/blocks/${blockId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async uploadFile(file: File): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_BASE}/api/files/upload`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Upload failed: ${res.statusText} - ${errorBody}`);
    }

    return res.json();
  },
};
