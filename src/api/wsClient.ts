import { Block } from "../components/block";
import { config } from "../config/project.config";
import { showNotification } from "../components/notification";

export type MessageType = "note_update" | "error";

export interface Header {
  id: number;
  name: string;
  url: string;
}

export interface Icon {
  id: number;
  name: string;
  url: string;
}

export interface ServerMessage {
  type: MessageType;
  note_id?: number;
  updated_by?: number;
  updated_at?: string;
  blocks?: Block[];
  message?: string;
  title?: string;
  header?: Header | null;
  icon?: Icon | null;
}

export class WsClient {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectInterval = 3000;
  private shouldReconnect = true;

  constructor(noteId: number | string) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    let host;
    let basePath;
    if (config.API_BASE_URL.startsWith("/")) {
      host = window.location.host;
      basePath = config.API_BASE_URL;
    } else {
      const urlParts = config.API_BASE_URL.replace(/^https?:\/\//, "").split(
        "/"
      );
      host = urlParts[0];
      basePath = urlParts.length > 1 ? `/${urlParts.slice(1).join("/")}` : "";
    }

    this.url = `${protocol}//${host}${basePath}/ws/notes/${noteId}`;
  }

  public connect(onMessage: (msg: ServerMessage) => void) {
    try {
      this.socket = new WebSocket(this.url);
    } catch (e) {
      console.error("WS Create Error:", e);
      return;
    }

    this.socket.onopen = () => {
    };

    this.socket.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error("WS Parse Error:", e);
      }
    };

    this.socket.onclose = (event) => {
      if (this.shouldReconnect) {
        setTimeout(() => {
          this.connect(onMessage);
        }, this.reconnectInterval);
      }
    };

    this.socket.onerror = (err) => {
      console.error("WS Error:", err);
      this.socket?.close();
    };
  }

  public close() {
    this.shouldReconnect = false;
    this.socket?.close();
    this.socket = null;
  }
}
