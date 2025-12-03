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
    showNotification("Подключение к совместному доступу...", "info");
    try {
      this.socket = new WebSocket(this.url);
    } catch (e) {
      showNotification("Ошибка в создании совместного доступа", "error");
      console.error(e);
      return;
    }

    this.socket.onopen = () => {
      showNotification("Совместный доступ подключён", "success");
    };

    this.socket.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        showNotification(
          "Ошибка в получении данных совместного доступа",
          "error"
        );
        console.error(e);
      }
    };

    this.socket.onclose = (event) => {
      showNotification("Соединение совместного доступа закрыто", "info");
      if (this.shouldReconnect) {
        setTimeout(() => {
          showNotification(
            "Повторное подключение к совместному доступу...",
            "info"
          );
          this.connect(onMessage);
        }, this.reconnectInterval);
      }
    };

    this.socket.onerror = (err) => {
      showNotification("Ошибка в соединении совместного доступа", "error");
      console.error(err);
      this.socket?.close();
    };
  }

  public close() {
    showNotification("Отключение совместного доступа...", "info");
    this.shouldReconnect = false;
    this.socket?.close();
    this.socket = null;
  }
}
