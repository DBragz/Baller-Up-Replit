import Database from "better-sqlite3";
import path from "path";
import type { Scores, UpdateScores } from "@shared/schema";

const dbPath = process.env.DB_FILE || path.join(process.cwd(), "data.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    position INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    good_score INTEGER NOT NULL DEFAULT 0,
    bad_score INTEGER NOT NULL DEFAULT 0
  )
`);

const ensureScores = db.prepare("SELECT id FROM scores WHERE id = 1");
if (!ensureScores.get()) {
  db.prepare(
    "INSERT INTO scores (id, good_score, bad_score) VALUES (1, 0, 0)",
  ).run();
}

// Ensure good_score and bad_score start at 0 by default
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    good_score INTEGER NOT NULL DEFAULT 0,
    bad_score INTEGER NOT NULL DEFAULT 0
  )
`);

function normalizeName(name: string): string {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ");
}

export interface IStorage {
  getQueue(): string[];
  joinQueue(name: string): { queue: string[] } | { error: string };
  leaveQueue(name: string): { queue: string[] } | { error: string };
  nextPlayer(): { next: string | null; queue: string[] };
  getScores(): Scores;
  updateScores(update: UpdateScores): Scores;
}

export class SQLiteStorage implements IStorage {
  private getQueueStmt = db.prepare(
    "SELECT name FROM queue ORDER BY position ASC",
  );
  private checkExistsStmt = db.prepare(
    "SELECT 1 FROM queue WHERE LOWER(name) = LOWER(?)",
  );
  private getMaxPosStmt = db.prepare(
    "SELECT COALESCE(MAX(position), 0) AS maxPos FROM queue",
  );
  private insertPlayerStmt = db.prepare(
    "INSERT INTO queue (name, position, created_at) VALUES (?, ?, ?)",
  );
  private getPlayerByNameStmt = db.prepare(
    "SELECT position FROM queue WHERE LOWER(name) = LOWER(?)",
  );
  private deleteByNameStmt = db.prepare(
    "DELETE FROM queue WHERE LOWER(name) = LOWER(?)",
  );
  private shiftDownStmt = db.prepare(
    "UPDATE queue SET position = position - 1 WHERE position > ?",
  );
  private getFirstPlayerStmt = db.prepare(
    "SELECT id, name, position FROM queue ORDER BY position ASC LIMIT 1",
  );
  private deleteByIdStmt = db.prepare("DELETE FROM queue WHERE id = ?");
  private getScoresStmt = db.prepare(
    "SELECT good_score AS good, bad_score AS bad FROM scores WHERE id = 1",
  );

  getQueue(): string[] {
    const rows = this.getQueueStmt.all() as { name: string }[];
    return rows.map((r) => r.name);
  }

  joinQueue(rawName: string): { queue: string[] } | { error: string } {
    const name = normalizeName(rawName);
    if (!name) {
      return { error: "Name is required" };
    }

    const exists = this.checkExistsStmt.get(name);
    if (exists) {
      return { error: "Already in queue" };
    }

    const maxPosRow = this.getMaxPosStmt.get() as { maxPos: number };
    const nextPos = (maxPosRow?.maxPos || 0) + 1;

    this.insertPlayerStmt.run(name, nextPos, Date.now());

    return { queue: this.getQueue() };
  }

  leaveQueue(rawName: string): { queue: string[] } | { error: string } {
    const name = normalizeName(rawName);
    if (!name) {
      return { error: "Name is required" };
    }

    const player = this.getPlayerByNameStmt.get(name) as
      | { position: number }
      | undefined;
    if (!player) {
      return { error: "Name not found in queue" };
    }

    const removedPos = player.position;
    this.deleteByNameStmt.run(name);
    this.shiftDownStmt.run(removedPos);

    return { queue: this.getQueue() };
  }

  nextPlayer(): { next: string | null; queue: string[] } {
    const first = this.getFirstPlayerStmt.get() as
      | { id: number; name: string; position: number }
      | undefined;

    if (!first) {
      return { next: null, queue: [] };
    }

    const nextName = first.name;
    this.deleteByIdStmt.run(first.id);
    this.shiftDownStmt.run(first.position);

    return { next: nextName, queue: this.getQueue() };
  }

  getScores(): Scores {
    const row = this.getScoresStmt.get() as
      | { good: number; bad: number }
      | undefined;
    return row || { good: 0, bad: 0 };
  }

  updateScores(update: UpdateScores): Scores {
    const fields: string[] = [];
    const params: number[] = [];

    if (typeof update.good === "number") {
      fields.push("good_score = ?");
      params.push(Math.max(0, Math.floor(update.good)));
    }
    if (typeof update.bad === "number") {
      fields.push("bad_score = ?");
      params.push(Math.max(0, Math.floor(update.bad)));
    }

    if (fields.length > 0) {
      const sql = `UPDATE scores SET ${fields.join(", ")} WHERE id = 1`;
      db.prepare(sql).run(...params);
    }

    return this.getScores();
  }
}

export const storage = new SQLiteStorage();
