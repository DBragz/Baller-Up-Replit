import Database from "better-sqlite3";
import path from "path";
import type { Scores, UpdateScores, Location } from "@shared/schema";

const DEFAULT_TARGET_SCORE = 21;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const dbPath = process.env.DB_FILE || path.join(process.cwd(), "data.db");
const db = new Database(dbPath);

// Create locations table
db.exec(`
  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    good_score INTEGER NOT NULL DEFAULT 0,
    bad_score INTEGER NOT NULL DEFAULT 0,
    target_score INTEGER NOT NULL DEFAULT 21,
    last_activity INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

// Create queue table with location_id
db.exec(`
  CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    location_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(name, location_id),
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
  )
`);

// Migration: Add location_id column if upgrading from old schema
try {
  db.exec(`ALTER TABLE queue ADD COLUMN location_id TEXT NOT NULL DEFAULT ''`);
} catch (e) {
  // Column already exists
}

function normalizeName(name: string): string {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ");
}

function generateLocationId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Basketball-themed name generator
const basketballAdjectives = [
  "Blazing", "Thunder", "Lightning", "Storm", "Phoenix", "Shadow", "Cosmic", "Neon",
  "Savage", "Elite", "Prime", "Alpha", "Omega", "Turbo", "Hyper", "Ultra", "Mega",
  "Atomic", "Solar", "Lunar", "Steel", "Iron", "Golden", "Silver", "Diamond",
  "Crimson", "Midnight", "Sunset", "Dawn", "Fury", "Rage", "Titan", "Dragon",
  "Phantom", "Ghost", "Spirit", "Venom", "Blade", "Flash", "Bolt", "Spark"
];

const basketballNouns = [
  "Ballers", "Dunkers", "Shooters", "Dribblers", "Hoopers", "Slammers", "Jammers",
  "Court", "Arena", "Gym", "Zone", "Squad", "Crew", "Dynasty", "Legends", "Kings",
  "Queens", "Warriors", "Knights", "Dragons", "Wolves", "Hawks", "Eagles", "Raptors",
  "Panthers", "Tigers", "Lions", "Bulls", "Rockets", "Thunder", "Heat", "Magic",
  "Nets", "Blazers", "Mavs", "Celtics", "Lakers", "Clippers", "Pistons"
];

function generateBasketballName(): string {
  const adj = basketballAdjectives[Math.floor(Math.random() * basketballAdjectives.length)];
  const noun = basketballNouns[Math.floor(Math.random() * basketballNouns.length)];
  return `${adj} ${noun}`;
}

export interface IStorage {
  // Location methods
  createLocation(customName?: string): Location;
  getLocation(id: string): Location | null;
  listActiveLocations(): Location[];
  deleteLocation(id: string): void;
  updateLocationActivity(id: string): void;
  cleanupInactiveLocations(): number;

  // Queue methods (now location-specific)
  getQueue(locationId: string): string[];
  joinQueue(locationId: string, name: string): { queue: string[] } | { error: string };
  leaveQueue(locationId: string, name: string): { queue: string[] } | { error: string };
  nextPlayer(locationId: string): { next: string | null; queue: string[] };

  // Scores methods (now location-specific)
  getScores(locationId: string): Scores;
  updateScores(locationId: string, update: UpdateScores): Scores;
  updateTargetScore(locationId: string, targetScore: number): Scores;
  resetScores(locationId: string): Scores;
}

export class SQLiteStorage implements IStorage {
  // Location statements
  private insertLocationStmt = db.prepare(
    "INSERT INTO locations (id, name, good_score, bad_score, target_score, last_activity, created_at) VALUES (?, ?, 0, 0, 21, ?, ?)"
  );
  private getLocationStmt = db.prepare(
    "SELECT id, name, good_score, bad_score, target_score, last_activity AS lastActivity, created_at AS createdAt FROM locations WHERE id = ?"
  );
  private listActiveLocationsStmt = db.prepare(
    "SELECT id, name, last_activity AS lastActivity, created_at AS createdAt FROM locations ORDER BY last_activity DESC"
  );
  private deleteLocationStmt = db.prepare("DELETE FROM locations WHERE id = ?");
  private updateActivityStmt = db.prepare("UPDATE locations SET last_activity = ? WHERE id = ?");
  private getInactiveLocationsStmt = db.prepare(
    "SELECT id FROM locations WHERE last_activity < ?"
  );

  // Queue statements (location-specific)
  private getQueueStmt = db.prepare(
    "SELECT name FROM queue WHERE location_id = ? ORDER BY position ASC"
  );
  private checkExistsStmt = db.prepare(
    "SELECT 1 FROM queue WHERE location_id = ? AND LOWER(name) = LOWER(?)"
  );
  private getMaxPosStmt = db.prepare(
    "SELECT COALESCE(MAX(position), 0) AS maxPos FROM queue WHERE location_id = ?"
  );
  private insertPlayerStmt = db.prepare(
    "INSERT INTO queue (name, position, location_id, created_at) VALUES (?, ?, ?, ?)"
  );
  private getPlayerByNameStmt = db.prepare(
    "SELECT position FROM queue WHERE location_id = ? AND LOWER(name) = LOWER(?)"
  );
  private deleteByNameStmt = db.prepare(
    "DELETE FROM queue WHERE location_id = ? AND LOWER(name) = LOWER(?)"
  );
  private shiftDownStmt = db.prepare(
    "UPDATE queue SET position = position - 1 WHERE location_id = ? AND position > ?"
  );
  private getFirstPlayerStmt = db.prepare(
    "SELECT id, name, position FROM queue WHERE location_id = ? ORDER BY position ASC LIMIT 1"
  );
  private deleteByIdStmt = db.prepare("DELETE FROM queue WHERE id = ?");
  private deleteQueueByLocationStmt = db.prepare("DELETE FROM queue WHERE location_id = ?");

  // Scores statements (location-specific)
  private getScoresStmt = db.prepare(
    "SELECT good_score AS good, bad_score AS bad, target_score AS targetScore FROM locations WHERE id = ?"
  );

  // Location methods
  createLocation(customName?: string): Location {
    const id = generateLocationId();
    const name = customName || generateBasketballName();
    const now = Date.now();
    
    this.insertLocationStmt.run(id, name, now, now);
    
    return { id, name, lastActivity: now, createdAt: now };
  }

  getLocation(id: string): Location | null {
    const row = this.getLocationStmt.get(id) as any;
    if (!row) return null;
    return { id: row.id, name: row.name, lastActivity: row.lastActivity, createdAt: row.createdAt };
  }

  listActiveLocations(): Location[] {
    const rows = this.listActiveLocationsStmt.all() as any[];
    return rows.map(r => ({ id: r.id, name: r.name, lastActivity: r.lastActivity, createdAt: r.createdAt }));
  }

  deleteLocation(id: string): void {
    this.deleteQueueByLocationStmt.run(id);
    this.deleteLocationStmt.run(id);
  }

  updateLocationActivity(id: string): void {
    this.updateActivityStmt.run(Date.now(), id);
  }

  cleanupInactiveLocations(): number {
    const cutoff = Date.now() - INACTIVITY_TIMEOUT_MS;
    const inactive = this.getInactiveLocationsStmt.all(cutoff) as { id: string }[];
    
    for (const loc of inactive) {
      this.deleteLocation(loc.id);
    }
    
    return inactive.length;
  }

  // Queue methods
  getQueue(locationId: string): string[] {
    const rows = this.getQueueStmt.all(locationId) as { name: string }[];
    return rows.map((r) => r.name);
  }

  joinQueue(locationId: string, rawName: string): { queue: string[] } | { error: string } {
    const name = normalizeName(rawName);
    if (!name) {
      return { error: "Name is required" };
    }

    const exists = this.checkExistsStmt.get(locationId, name);
    if (exists) {
      return { error: "Already in queue" };
    }

    const maxPosRow = this.getMaxPosStmt.get(locationId) as { maxPos: number };
    const nextPos = (maxPosRow?.maxPos || 0) + 1;

    this.insertPlayerStmt.run(name, nextPos, locationId, Date.now());
    this.updateLocationActivity(locationId);

    return { queue: this.getQueue(locationId) };
  }

  leaveQueue(locationId: string, rawName: string): { queue: string[] } | { error: string } {
    const name = normalizeName(rawName);
    if (!name) {
      return { error: "Name is required" };
    }

    const player = this.getPlayerByNameStmt.get(locationId, name) as
      | { position: number }
      | undefined;
    if (!player) {
      return { error: "Name not found in queue" };
    }

    const removedPos = player.position;
    this.deleteByNameStmt.run(locationId, name);
    this.shiftDownStmt.run(locationId, removedPos);
    this.updateLocationActivity(locationId);

    return { queue: this.getQueue(locationId) };
  }

  nextPlayer(locationId: string): { next: string | null; queue: string[] } {
    const first = this.getFirstPlayerStmt.get(locationId) as
      | { id: number; name: string; position: number }
      | undefined;

    if (!first) {
      return { next: null, queue: [] };
    }

    const nextName = first.name;
    this.deleteByIdStmt.run(first.id);
    this.shiftDownStmt.run(locationId, first.position);
    this.updateLocationActivity(locationId);

    return { next: nextName, queue: this.getQueue(locationId) };
  }

  // Scores methods
  getScores(locationId: string): Scores {
    const row = this.getScoresStmt.get(locationId) as
      | { good: number; bad: number; targetScore: number }
      | undefined;
    return row || { good: 0, bad: 0, targetScore: DEFAULT_TARGET_SCORE };
  }

  updateScores(locationId: string, update: UpdateScores): Scores {
    const fields: string[] = [];
    const params: (number | string)[] = [];

    if (typeof update.good === "number") {
      fields.push("good_score = ?");
      params.push(Math.max(0, Math.floor(update.good)));
    }
    if (typeof update.bad === "number") {
      fields.push("bad_score = ?");
      params.push(Math.max(0, Math.floor(update.bad)));
    }

    if (fields.length > 0) {
      params.push(locationId);
      const sql = `UPDATE locations SET ${fields.join(", ")} WHERE id = ?`;
      db.prepare(sql).run(...params);
      this.updateLocationActivity(locationId);
    }

    return this.getScores(locationId);
  }

  updateTargetScore(locationId: string, targetScore: number): Scores {
    db.prepare("UPDATE locations SET target_score = ? WHERE id = ?").run(
      Math.max(1, Math.floor(targetScore)),
      locationId
    );
    this.updateLocationActivity(locationId);
    return this.getScores(locationId);
  }

  resetScores(locationId: string): Scores {
    db.prepare("UPDATE locations SET good_score = 0, bad_score = 0 WHERE id = ?").run(locationId);
    this.updateLocationActivity(locationId);
    return this.getScores(locationId);
  }
}

export const storage = new SQLiteStorage();

// Start cleanup interval (runs every 5 minutes)
setInterval(() => {
  const cleaned = storage.cleanupInactiveLocations();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} inactive location(s)`);
  }
}, 5 * 60 * 1000);
