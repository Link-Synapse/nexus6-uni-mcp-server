import crypto from "node:crypto";

type Message = { ts: number; sender: string; content: string };
type Session = { id: string; participants: string[]; messages: Message[] };

export class ChatCoordinator {
  private sessions = new Map<string, Session>();

  createSession(participants: string[]) {
    const id = crypto.randomUUID();
    this.sessions.set(id, { id, participants, messages: [] });
    return id;
  }

  sendMessage(sessionId: string, sender: string, content: string) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error("Session not found");
    s.messages.push({ ts: Date.now(), sender, content });
  }
}
