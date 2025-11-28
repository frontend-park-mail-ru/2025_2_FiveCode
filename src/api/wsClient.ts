import { Block } from "../components/block";
import { config } from "../config/project.config";
import { showNotification } from "../components/notification";


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
    // console.log("WSClient initialized with URL:", this.url);
    // showNotification("", "info");
  }

  public connect(onMessage: (msg: ServerMessage) => void) {
    showNotification("Подключение к совместному доступу...", "info");
    try {
      this.socket = new WebSocket(this.url);
    } catch (e) {
      showNotification("Ошибка в создании совместного доступа", "error");
      return;
    }

    this.socket.onopen = () => {
      console.log("WS Connected");
      showNotification("Совместный доступ подключён", "success");
    };

    this.socket.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        // console.error("WS message parsing error:", e, event.data);
        showNotification("Ошибка в получении данных совместного доступа", "error");
      }
    };

    this.socket.onclose = (event) => {
      // console.log("WS Closed:", event.code, event.reason);
      showNotification("Соединение совместного доступа закрыто", "info");
      if (this.shouldReconnect) {
        setTimeout(() => {
            // console.log("Reconnecting WS...");
            showNotification("Повторное подключение к совместному доступу...", "info");
            this.connect(onMessage);
        }, this.reconnectInterval);
      }
    };

    this.socket.onerror = (err) => {
      showNotification("Ошибка в соединении совместного доступа", "error");
      // console.error("WS Error:", err);
      this.socket?.close();
    };
  }

  public close() {
    // console.log("Closing WS connection manually");
    showNotification("Отключение совместного доступа...", "info");
    this.shouldReconnect = false;
    this.socket?.close();
    this.socket = null;
  }
}
