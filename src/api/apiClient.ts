import { apiFetch, API_BASE } from "../api";
import { login, register, logout, checkSession } from "../auth";
import { saveUser, clearUser } from "../utils/session";
import { Block, TextContent, CodeContent } from "../components/block";

interface User {
  id?: number;
  username?: string;
  password?: string;
  email?: string;
  avatar_file_id?: number;
}

interface AuthResponse {
  user: User;
}

export interface UploadedFile {
  id: number;
  url: string;
  mime_type: string;
  size_bytes: number;
}

export interface Ticket {
  id?: number;
  email: string;
  full_name: string;
  category: string;
  status?: string;
  title: string;
  description: string;
  file_id?: number;
}

export interface StatisticForCategory {
  category: string;
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  in_progress_tickets: number;
}

export interface Statistics {
  statistics: StatisticForCategory[];
}

export const apiClient = {
  async login(creds: User): Promise<AuthResponse> {
    const response = await login(creds);
    saveUser(response.user);
    return response;
  },

  async register(data: Object): Promise<AuthResponse> {
    const response = await register(data);
    return response;
  },

  async logout(): Promise<void> {
    await logout();
    clearUser();
  },

  async me(): Promise<User | null> {
    return await checkSession();
  },

  async updateUser(data: {
    username?: string;
    avatar_file_id?: number;
  }): Promise<User> {
    return apiFetch(`/api/profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteUser(): Promise<void> {
    return apiFetch(`/api/profile`, { method: "DELETE" });
  },

  async getFile(fileId: number): Promise<UploadedFile> {
    return apiFetch(`/api/files/${fileId}`, { method: "GET" });
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
    payload: { type: string; content: Partial<TextContent | CodeContent> }
  ): Promise<Block> {
    return apiFetch(`/api/blocks/${blockId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async updateBlockPosition(
    blockId: string | number,
    data: { before_block_id?: string | number }
  ): Promise<Block> {
    return apiFetch(`/api/blocks/${blockId}/position`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteBlock(blockId: string | number): Promise<void> {
    return apiFetch(`/api/blocks/${blockId}`, { method: "DELETE" });
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

  async createTicket(ticketData: Ticket): Promise<Ticket> {
    return apiFetch(`/api/tickets`, {
      method: "POST",
      body: JSON.stringify(ticketData),
    });
  },

  async getMyTickets(): Promise<Ticket[]> {
    return apiFetch(`/api/tickets`, { method: "GET" });
  },

  async getTicketStatistics(): Promise<Statistics> {
    return apiFetch(`/api/admin/statistics`, { method: "GET" });
  },
};