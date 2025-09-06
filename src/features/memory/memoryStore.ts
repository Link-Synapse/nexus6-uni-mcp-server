import * as fs from "fs";
import * as path from "path";

export interface MemoryNote {
  id: string;
  project?: string;
  tags?: string[];
  text: string;
  ts: number;
}

export class MemoryStore {
  private filePath: string;
  private notes: MemoryNote[] = [];

  constructor(baseDir: string) {
    this.filePath = path.resolve(baseDir, "projects", "nexus6", "memory.json");
    this.ensureLoaded();
  }

  private ensureLoaded() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.notes = JSON.parse(raw);
      } else {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        fs.writeFileSync(this.filePath, "[]", "utf-8");
        this.notes = [];
      }
    } catch {
      this.notes = [];
      fs.writeFileSync(this.filePath, "[]", "utf-8");
    }
  }

  private persist() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.notes, null, 2), "utf-8");
  }

  add(text: string, project?: string, tags?: string[]): MemoryNote {
    const note: MemoryNote = {
      id: cryptoRandomId(),
      project,
      tags,
      text,
      ts: Date.now()
    };
    this.notes.push(note);
    this.persist();
    return note;
  }

  search(query: string, limit = 10): MemoryNote[] {
    const q = query.toLowerCase();
    return this.notes
      .filter(n => n.text.toLowerCase().includes(q) || (n.tags || []).join(" ").toLowerCase().includes(q))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit);
  }
}

function cryptoRandomId(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, "0")).join("");
}

// polyfill for node < 19
declare const crypto: any;
