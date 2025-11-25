import { Block } from "../components/block";
import { config } from "../config/project.config";

export type MessageType = "note_update" | "error";

export interface ServerMessage {
  type: MessageType;
  note_id?: number;
  updated_by?: number;
  updated_at?: string;
  blocks?: Block[];
  message?: string;
  title?: string;
}

export class WsClient {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectInterval = 3000;
  private shouldReconnect = true;

  constructor(noteId: number | string) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = config.API_BASE_URL.replace(/^https?:\/\//, "");
    this.url = `${protocol}//${host}/api/ws/notes/${noteId}`;
    console.log("WSClient initialized with URL:", this.url);
  }

  public connect(onMessage: (msg: ServerMessage) => void) {
    console.log("Connecting to WebSocket...");
    try {
      this.socket = new WebSocket(this.url);
    } catch (e) {
      console.error("Failed to create WebSocket:", e);
      return;
    }

    this.socket.onopen = () => {
      console.log("WS Connected");
    };

    this.socket.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);
        console.log("WS Message received:", data.type);
        onMessage(data);
      } catch (e) {
        console.error("WS message parsing error:", e, event.data);
      }
    };

    this.socket.onclose = (event) => {
      console.log("WS Closed:", event.code, event.reason);
      if (this.shouldReconnect) {
        setTimeout(() => {
            console.log("Reconnecting WS...");
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
    console.log("Closing WS connection manually");
    this.shouldReconnect = false;
    this.socket?.close();
    this.socket = null;
  }
}
