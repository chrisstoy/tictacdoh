import type { ClientMessage, ServerMessage } from './protocol';
import { parseServerMessage, serializeClientMessage } from './protocol';

export type WsFactory = (url: string) => WebSocket;

export type OnlineWsHandlers = {
  onMessage: (msg: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
};

/**
 * Thin WebSocket wrapper for the multiplayer protocol.
 * Inject `wsFactory` in tests; defaults to browser/RN `WebSocket`.
 */
export class OnlineWsClient {
  private socket: WebSocket | null = null;
  private openWaiters: Array<() => void> = [];

  constructor(private readonly wsFactory: WsFactory = (url) => new WebSocket(url)) {}

  connect(url: string, handlers: OnlineWsHandlers): void {
    this.close();
    const socket = this.wsFactory(url);
    this.socket = socket;

    socket.onopen = () => {
      handlers.onOpen?.();
      const waiters = this.openWaiters;
      this.openWaiters = [];
      waiters.forEach((w) => w());
    };
    socket.onmessage = (event) => {
      const raw = typeof event.data === 'string' ? event.data : String(event.data);
      const msg = parseServerMessage(raw);
      if (msg) handlers.onMessage(msg);
    };
    socket.onclose = () => {
      handlers.onClose?.();
    };
    socket.onerror = (error) => {
      handlers.onError?.(error);
    };

    // Some test doubles open synchronously / via microtask without onopen.
    if (socket.readyState === WebSocket.OPEN) {
      queueMicrotask(() => socket.onopen?.(new Event('open') as unknown as Event));
    }
  }

  waitUntilOpen(timeoutMs = 5000): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WebSocket open timeout')), timeoutMs);
      this.openWaiters.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  send(msg: ClientMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.socket.send(serializeClientMessage(msg));
  }

  close(): void {
    this.openWaiters = [];
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      try {
        this.socket.close();
      } catch {
        // ignore
      }
      this.socket = null;
    }
  }

  get isOpen(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
