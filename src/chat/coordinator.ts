import crypto from "node:crypto";

type Message = { ts: number; sender: string; content: string };
type Session = { id: string; participants: string[]; messages: Message[]; createdAt: number };

export class ChatCoordinator {
  private sessions = new Map<string, Session>();
  private readonly maxSessions = 100;
  private readonly sessionTTL = 24 * 60 * 60 * 1000; // 24 hours

  createSession(participants: string[]) {
    this.cleanupExpiredSessions();
    
    if (this.sessions.size >= this.maxSessions) {
      throw new Error('Maximum session limit reached');
    }

    const id = crypto.randomUUID();
    this.sessions.set(id, { 
      id, 
      participants, 
      messages: [],
      createdAt: Date.now()
    });
    return id;
  }

  sendMessage(sessionId: string, sender: string, content: string) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error("Session not found");
    s.messages.push({ ts: Date.now(), sender, content });
  }

  private cleanupExpiredSessions() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.createdAt > this.sessionTTL) {
        this.sessions.delete(id);
      }
    }
  }
}
