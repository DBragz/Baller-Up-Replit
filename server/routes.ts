import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQueuePlayerSchema, updateScoresSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/queue", (_req, res) => {
    try {
      const queue = storage.getQueue();
      res.json({ queue });
    } catch (error) {
      console.error("Error getting queue:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/join", (req, res) => {
    try {
      const parsed = insertQueuePlayerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const result = storage.joinQueue(parsed.data.name);
      if ("error" in result) {
        return res.status(result.error === "Already in queue" ? 409 : 400).json(result);
      }
      res.status(201).json(result);
    } catch (error) {
      console.error("Error joining queue:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/leave", (req, res) => {
    try {
      const parsed = insertQueuePlayerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const result = storage.leaveQueue(parsed.data.name);
      if ("error" in result) {
        return res.status(result.error === "Name not found in queue" ? 404 : 400).json(result);
      }
      res.json(result);
    } catch (error) {
      console.error("Error leaving queue:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/next", (_req, res) => {
    try {
      const result = storage.nextPlayer();
      res.json(result);
    } catch (error) {
      console.error("Error getting next player:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/scores", (_req, res) => {
    try {
      const scores = storage.getScores();
      res.json(scores);
    } catch (error) {
      console.error("Error getting scores:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/scores", (req, res) => {
    try {
      const parsed = updateScoresSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Must provide good and/or bad as numbers" });
      }

      if (parsed.data.good === undefined && parsed.data.bad === undefined) {
        return res.status(400).json({ error: "Must provide good and/or bad as numbers" });
      }

      const scores = storage.updateScores(parsed.data);
      res.json(scores);
    } catch (error) {
      console.error("Error updating scores:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  return httpServer;
}
