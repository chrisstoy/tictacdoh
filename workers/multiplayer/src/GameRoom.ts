import { DurableObject } from 'cloudflare:workers';

import {
  applyMove,
  determineWinner,
  emptyBoard,
  isDraw,
  isValidMove,
  isValidRoundsInMatch,
  matchWinnerAfterRounds,
} from '../../../shared/gameRules';
import type { PlayerId, TileState, Winner } from '../../../shared/types';
import {
  IDLE_TTL_MS,
  RECLAIM_MS,
  type ClientMessage,
  type PlayPhase,
  type RoomSnapshot,
  type ServerMessage,
  parseClientMessage,
} from './protocol';

type Seat = {
  token: string;
  connected: boolean;
};

type PersistedRoom = {
  code: string;
  roundsInMatch: number;
  host: Seat | null;
  guest: Seat | null;
  phase: PlayPhase;
  board: TileState[];
  turn: PlayerId;
  roundWinner: Winner | undefined;
  isDraw: boolean;
  rounds: { winner: Winner | undefined }[];
  matchWinner: PlayerId | undefined;
  reclaimSeat: PlayerId | null;
  reclaimDeadlineMs: number | null;
  forfeitedBy: PlayerId | undefined;
  lastActivityMs: number;
  closedReason: string | null;
};

const STORAGE_KEY = 'room';

function newToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export class GameRoom extends DurableObject {
  private room: PersistedRoom | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.room = (await this.ctx.storage.get<PersistedRoom>(STORAGE_KEY)) ?? null;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/create') {
      return this.handleCreate(request);
    }

    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      return this.handleWebSocket();
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleCreate(request: Request): Promise<Response> {
    let body: { code?: string; roundsInMatch?: number; hostToken?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const code = body.code;
    const roundsInMatch = body.roundsInMatch;
    const hostToken = body.hostToken ?? newToken();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'code required' }, { status: 400 });
    }
    if (typeof roundsInMatch !== 'number' || !isValidRoundsInMatch(roundsInMatch)) {
      return Response.json({ error: 'invalid roundsInMatch' }, { status: 400 });
    }
    if (this.room && this.room.phase !== 'CLOSED') {
      return Response.json({ error: 'room already exists' }, { status: 409 });
    }

    this.room = {
      code,
      roundsInMatch,
      host: { token: hostToken, connected: false },
      guest: null,
      phase: 'WAITING',
      board: emptyBoard(),
      turn: 'X',
      roundWinner: undefined,
      isDraw: false,
      rounds: [],
      matchWinner: undefined,
      reclaimSeat: null,
      reclaimDeadlineMs: null,
      forfeitedBy: undefined,
      lastActivityMs: Date.now(),
      closedReason: null,
    };
    await this.persist();
    await this.scheduleIdleAlarm();
    return Response.json({ code, hostToken, roundsInMatch });
  }

  private handleWebSocket(): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') {
      this.send(ws, { type: 'error', message: 'Expected text frame' });
      return;
    }
    const parsed = parseClientMessage(message);
    if (!parsed) {
      this.send(ws, { type: 'error', message: 'Invalid message' });
      return;
    }
    await this.dispatch(ws, parsed);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, _wasClean: boolean): Promise<void> {
    await this.handleDisconnect(ws);
    try {
      ws.close(code, reason);
    } catch {
      // already closed
    }
  }

  async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
    await this.handleDisconnect(ws);
  }

  async alarm(): Promise<void> {
    await this.runDueAlarms(Date.now());
  }

  /** Exposed for tests to advance reclaim / idle timers without waiting. */
  async runDueAlarms(now: number): Promise<void> {
    if (!this.room || this.room.phase === 'CLOSED') return;

    if (
      this.room.reclaimSeat &&
      this.room.reclaimDeadlineMs != null &&
      now >= this.room.reclaimDeadlineMs
    ) {
      await this.forfeit(this.room.reclaimSeat, 'reconnect timeout');
      return;
    }

    if (now - this.room.lastActivityMs >= IDLE_TTL_MS) {
      const connected =
        (this.room.host?.connected ? 1 : 0) + (this.room.guest?.connected ? 1 : 0);
      if (connected < 2) {
        await this.closeRoom('idle timeout');
      }
    }
  }

  private async dispatch(ws: WebSocket, msg: ClientMessage): Promise<void> {
    if (!this.room || this.room.phase === 'CLOSED') {
      this.send(ws, { type: 'roomClosed', reason: this.room?.closedReason ?? 'closed' });
      return;
    }

    switch (msg.type) {
      case 'join':
        await this.handleJoin(ws, msg.token);
        break;
      case 'move':
        await this.handleMove(ws, msg.index);
        break;
      case 'nextRound':
        await this.handleNextRound(ws);
        break;
      case 'rematch':
        await this.handleRematch(ws);
        break;
      case 'quit':
        await this.handleQuit(ws);
        break;
    }
  }

  private seatForWs(ws: WebSocket): PlayerId | null {
    const attachment = ws.deserializeAttachment() as { seat?: PlayerId } | null;
    return attachment?.seat ?? null;
  }

  private setSeat(ws: WebSocket, seat: PlayerId): void {
    ws.serializeAttachment({ seat });
  }

  private async handleJoin(ws: WebSocket, token?: string): Promise<void> {
    if (!this.room) {
      this.send(ws, { type: 'error', message: 'Room not found' });
      return;
    }

    let seat: PlayerId | null = null;
    let assignedToken: string | null = null;

    if (token) {
      if (this.room.host?.token === token) {
        seat = 'X';
        assignedToken = token;
        this.room.host.connected = true;
      } else if (this.room.guest?.token === token) {
        seat = 'O';
        assignedToken = token;
        this.room.guest.connected = true;
      } else {
        this.send(ws, { type: 'error', message: 'Invalid token' });
        return;
      }

      if (this.room.reclaimSeat === seat) {
        this.room.reclaimSeat = null;
        this.room.reclaimDeadlineMs = null;
      }
    } else {
      // New guest join
      if (this.room.guest) {
        this.send(ws, { type: 'error', message: 'Guest seat taken' });
        return;
      }
      assignedToken = newToken();
      this.room.guest = { token: assignedToken, connected: true };
      seat = 'O';
      if (this.room.phase === 'WAITING') {
        this.room.phase = 'PLAYING';
        this.room.board = emptyBoard();
        this.room.turn = 'X';
      }
    }

    this.setSeat(ws, seat!);
    this.touch();
    await this.persist();
    await this.scheduleNextAlarm();

    this.send(ws, {
      type: 'welcome',
      seat: seat!,
      token: assignedToken!,
      snapshot: this.snapshot(),
    });
    this.broadcastExcept(ws, { type: 'sync', snapshot: this.snapshot() });
  }

  private async handleMove(ws: WebSocket, index: number): Promise<void> {
    const seat = this.seatForWs(ws);
    if (!seat || !this.room) {
      this.send(ws, { type: 'error', message: 'Not joined' });
      return;
    }
    if (this.room.phase !== 'PLAYING') {
      this.send(ws, { type: 'error', message: 'Not playing' });
      return;
    }
    if (this.room.turn !== seat) {
      this.send(ws, { type: 'error', message: 'Not your turn' });
      return;
    }
    if (!isValidMove(this.room.board, index, seat)) {
      this.send(ws, { type: 'error', message: 'Invalid move' });
      return;
    }

    this.room.board = applyMove(this.room.board, index, seat);
    const winner = determineWinner(this.room.board);
    const draw = isDraw(this.room.board);

    if (winner || draw) {
      this.room.roundWinner = winner;
      this.room.isDraw = draw;
      this.room.rounds = [...this.room.rounds, { winner }];
      this.room.matchWinner = matchWinnerAfterRounds(this.room.rounds, this.room.roundsInMatch);
      this.room.phase = this.room.matchWinner ? 'MATCH_OVER' : 'ROUND_OVER';
    } else {
      this.room.turn = seat === 'X' ? 'O' : 'X';
    }

    this.touch();
    await this.persist();
    this.broadcastAll({ type: 'sync', snapshot: this.snapshot() });
  }

  private async handleNextRound(ws: WebSocket): Promise<void> {
    if (!this.seatForWs(ws) || !this.room) {
      this.send(ws, { type: 'error', message: 'Not joined' });
      return;
    }
    if (this.room.phase !== 'ROUND_OVER') {
      this.send(ws, { type: 'error', message: 'Round not over' });
      return;
    }
    this.room.board = emptyBoard();
    this.room.turn = 'X';
    this.room.roundWinner = undefined;
    this.room.isDraw = false;
    this.room.phase = 'PLAYING';
    this.touch();
    await this.persist();
    this.broadcastAll({ type: 'sync', snapshot: this.snapshot() });
  }

  private async handleRematch(ws: WebSocket): Promise<void> {
    if (!this.seatForWs(ws) || !this.room) {
      this.send(ws, { type: 'error', message: 'Not joined' });
      return;
    }
    if (this.room.phase !== 'MATCH_OVER') {
      this.send(ws, { type: 'error', message: 'Match not over' });
      return;
    }
    // Same seats (host=X, guest=O); reset match state
    this.room.board = emptyBoard();
    this.room.turn = 'X';
    this.room.roundWinner = undefined;
    this.room.isDraw = false;
    this.room.rounds = [];
    this.room.matchWinner = undefined;
    this.room.forfeitedBy = undefined;
    this.room.phase = 'PLAYING';
    this.touch();
    await this.persist();
    this.broadcastAll({ type: 'sync', snapshot: this.snapshot() });
  }

  private async handleQuit(ws: WebSocket): Promise<void> {
    if (!this.seatForWs(ws) || !this.room) {
      this.send(ws, { type: 'error', message: 'Not joined' });
      return;
    }
    await this.closeRoom('quit');
  }

  private async handleDisconnect(ws: WebSocket): Promise<void> {
    if (!this.room || this.room.phase === 'CLOSED') return;
    const seat = this.seatForWs(ws);
    if (!seat) return;

    if (seat === 'X' && this.room.host) {
      this.room.host.connected = false;
    }
    if (seat === 'O' && this.room.guest) {
      this.room.guest.connected = false;
    }

    this.room.reclaimSeat = seat;
    this.room.reclaimDeadlineMs = Date.now() + RECLAIM_MS;
    this.touch();
    await this.persist();
    await this.ctx.storage.setAlarm(this.room.reclaimDeadlineMs);

    this.broadcastExcept(ws, {
      type: 'disconnect',
      seat,
      reclaimMs: RECLAIM_MS,
    });
  }

  private async forfeit(seat: PlayerId, reason: string): Promise<void> {
    if (!this.room || this.room.phase === 'CLOSED') return;
    const winner: PlayerId = seat === 'X' ? 'O' : 'X';
    this.room.forfeitedBy = seat;
    this.room.matchWinner = winner;
    this.room.phase = 'MATCH_OVER';
    this.room.reclaimSeat = null;
    this.room.reclaimDeadlineMs = null;
    this.touch();
    await this.persist();
    this.broadcastAll({ type: 'sync', snapshot: this.snapshot() });
    // Keep room open for rematch; note reason for logging
    void reason;
  }

  private async closeRoom(reason: string): Promise<void> {
    if (!this.room) return;
    this.room.phase = 'CLOSED';
    this.room.closedReason = reason;
    this.room.reclaimSeat = null;
    this.room.reclaimDeadlineMs = null;
    await this.persist();
    await this.ctx.storage.deleteAlarm();
    this.broadcastAll({ type: 'roomClosed', reason });
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.close(1000, reason);
      } catch {
        // ignore
      }
    }
  }

  private snapshot(): RoomSnapshot {
    const room = this.room!;
    return {
      code: room.code,
      phase: room.phase,
      roundsInMatch: room.roundsInMatch,
      board: room.board,
      turn: room.turn,
      roundWinner: room.roundWinner,
      isDraw: room.isDraw,
      rounds: room.rounds,
      matchWinner: room.matchWinner,
      hostConnected: !!room.host?.connected,
      guestConnected: !!room.guest?.connected,
      reclaimDeadlineMs: room.reclaimDeadlineMs,
      forfeitedBy: room.forfeitedBy,
    };
  }

  private touch(): void {
    if (this.room) {
      this.room.lastActivityMs = Date.now();
    }
  }

  private async persist(): Promise<void> {
    if (this.room) {
      await this.ctx.storage.put(STORAGE_KEY, this.room);
    }
  }

  private async scheduleIdleAlarm(): Promise<void> {
    if (!this.room) return;
    const when = this.room.lastActivityMs + IDLE_TTL_MS;
    await this.ctx.storage.setAlarm(when);
  }

  private async scheduleNextAlarm(): Promise<void> {
    if (!this.room) return;
    const candidates: number[] = [this.room.lastActivityMs + IDLE_TTL_MS];
    if (this.room.reclaimDeadlineMs != null) {
      candidates.push(this.room.reclaimDeadlineMs);
    }
    await this.ctx.storage.setAlarm(Math.min(...candidates));
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // socket gone
    }
  }

  private broadcastAll(msg: ServerMessage): void {
    const raw = JSON.stringify(msg);
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(raw);
      } catch {
        // ignore
      }
    }
  }

  private broadcastExcept(except: WebSocket, msg: ServerMessage): void {
    const raw = JSON.stringify(msg);
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === except) continue;
      try {
        socket.send(raw);
      } catch {
        // ignore
      }
    }
  }
}

