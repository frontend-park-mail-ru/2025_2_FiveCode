import { apiFetch, API_BASE, clearCsrfToken } from "../api";
import { login, register, logout as authLogout, checkSession } from "../auth";
import { saveUser, clearUser } from "../utils/session";
import { Block, TextContent, CodeContent } from "../components/block";

interface User {
  id?: number;
  username?: string;
  password?: string;
  email?: string;
  avatar_file_id?: number;
  is_admin?: boolean;
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
  file_id?: number | null;
  created_at?: string;
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

export interface Message {
  text: string;
  sender: User;
  created_at: number;
}

export interface Messages {
  messages: Messages[];
}

export interface Note {
  parentId?: number | null;
}

export interface Collaborator {
  permission_id: number;
  user_id: number;
  email?: string;
  username?: string;
  role: "editor" | "viewer" | "commenter";
}

export interface CollaboratorsResponse {
  collaborators: Collaborator[];
  owner_id: number;
  total_collaborators: number;
}

export interface SharingSettingsResponse {
  note_id: number;
  owner_id: number;
  public_access: {
    note_id: number;
    access_level: "editor" | "viewer" | "commenter" | null;
    share_url: string;
  };
  collaborators: Collaborator[];
  total_collaborators: number;
  is_owner: boolean;
}

export interface ActivateAccessResponse {
  note_id: number;
  access_granted: boolean;
  access_info: {
    role: string;
    can_edit: boolean;
    is_owner: boolean;
    has_access: boolean;
  };
}

interface Icon {
  id?: number;
  name?: string;
  url: string;
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
    await authLogout();
    clearUser();
    clearCsrfToken();
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

  async createNote(parentId?: number): Promise<any> {
    return apiFetch(`/api/notes`, {
      method: "POST",
      body: JSON.stringify({ parent_note_id: parentId }),
    });
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

    return apiFetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
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

  async getTicketById(ticketId: number): Promise<Ticket> {
    return apiFetch(`/api/tickets/${ticketId}`, { method: "GET" });
  },

  async updateTicket(
    ticketId: number,
    data: { title?: string; description?: string }
  ): Promise<Ticket> {
    const payload = {
      title: data.title,
      description: data.description,
    };
    return apiFetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async getTicketStatistics(): Promise<Statistics> {
    return apiFetch(`/api/admin/statistics`, { method: "GET" });
  },
  async getAllTickets(): Promise<Ticket[]> {
    return apiFetch(`/api/admin/tickets`, { method: "GET" });
  },

  async updateTicketStatus(ticketId: number, status: string): Promise<Ticket> {
    return apiFetch(`/api/admin/tickets/${ticketId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  async sendChatMessage(
    ticketId: number,
    messageText: string
  ): Promise<Message> {
    return apiFetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: messageText }),
    });
  },

  async getChatMessages(ticketId: number): Promise<Messages> {
    return apiFetch(`/api/tickets/${ticketId}/messages`, { method: "GET" });
  },

  async getCollaborators(
    noteId: number | string
  ): Promise<CollaboratorsResponse> {
    return apiFetch(`/api/notes/${noteId}/collaborators`, { method: "GET" });
  },

  async addCollaborator(
    noteId: number | string,
    email: string,
    role: "editor" | "viewer" | "commenter" = "editor"
  ): Promise<any> {
    return apiFetch(`/api/notes/${noteId}/collaborators`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  },

  async updateCollaboratorRole(
    noteId: number | string,
    permissionId: number | string,
    role: "editor" | "viewer" | "commenter"
  ): Promise<any> {
    return apiFetch(`/api/notes/${noteId}/collaborators/${permissionId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  async removeCollaborator(
    noteId: number | string,
    permissionId: number | string
  ): Promise<void> {
    return apiFetch(`/api/notes/${noteId}/collaborators/${permissionId}`, {
      method: "DELETE",
    });
  },

  async getSharingSettings(
    noteId: number | string
  ): Promise<SharingSettingsResponse> {
    return apiFetch(`/api/notes/${noteId}/sharing`, { method: "GET" });
  },

  async activateSharedLink(shareUuid: string): Promise<ActivateAccessResponse> {
    return apiFetch(`/api/notes/activate/${shareUuid}`, { method: "POST" });
  },

  async setPublicAccess(
    noteId: number | string,
    accessLevel: "editor" | "viewer" | "commenter" | null
  ): Promise<any> {
    return apiFetch(`/api/notes/${noteId}/public-access`, {
      method: "PUT",
      body: JSON.stringify({ access_level: accessLevel }),
    });
  },

  async getIcons(): Promise<Array<{ id: number; url: string }>> {
    return apiFetch(`/api/icons`, { method: "GET" });
  },

  async updateNoteIcon(
    noteId: string | number,
    iconId: number,
    iconUrl?: string,
    iconName?: string
  ): Promise<void> {
    console.log("Updating note icon:", noteId, iconId);
    return apiFetch(`/api/notes/${noteId}/icons`, {
      method: "PUT",
      body: JSON.stringify({ icon_file_id: Number(iconId) }),
    });
  },

  async getPDFexport(noteId: string | number): Promise<string> {
    const response = await fetch(`${API_BASE}/api/notes/${noteId}/export/pdf`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return url;
  }
};
