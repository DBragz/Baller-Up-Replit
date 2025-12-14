import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQueuePlayerSchema, updateScoresSchema, updateTargetScoreSchema, createLocationSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Location routes
  app.post("/api/locations", (req, res) => {
    try {
      const parsed = createLocationSchema.safeParse(req.body);
      const customName = parsed.success ? parsed.data.name : undefined;
      const location = storage.createLocation(customName);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/locations", (_req, res) => {
    try {
      const locations = storage.listActiveLocations();
      res.json({ locations });
    } catch (error) {
      console.error("Error listing locations:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/locations/:locationId", (req, res) => {
    try {
      const location = storage.getLocation(req.params.locationId);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Error getting location:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/locations/:locationId", (req, res) => {
    try {
      storage.deleteLocation(req.params.locationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting location:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Queue routes (location-specific)
  app.get("/api/locations/:locationId/queue", (req, res) => {
    try {
      const queue = storage.getQueue(req.params.locationId);
      res.json({ queue });
    } catch (error) {
      console.error("Error getting queue:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/locations/:locationId/join", (req, res) => {
    try {
      const parsed = insertQueuePlayerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const result = storage.joinQueue(req.params.locationId, parsed.data.name);
      if ("error" in result) {
        return res.status(result.error === "Already in queue" ? 409 : 400).json(result);
      }
      res.status(201).json(result);
    } catch (error) {
      console.error("Error joining queue:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/locations/:locationId/leave", (req, res) => {
    try {
      const parsed = insertQueuePlayerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const result = storage.leaveQueue(req.params.locationId, parsed.data.name);
      if ("error" in result) {
        return res.status(result.error === "Name not found in queue" ? 404 : 400).json(result);
      }
      res.json(result);
    } catch (error) {
      console.error("Error leaving queue:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/locations/:locationId/next", (req, res) => {
    try {
      const result = storage.nextPlayer(req.params.locationId);
      res.json(result);
    } catch (error) {
      console.error("Error getting next player:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Scores routes (location-specific)
  app.get("/api/locations/:locationId/scores", (req, res) => {
    try {
      const scores = storage.getScores(req.params.locationId);
      res.json(scores);
    } catch (error) {
      console.error("Error getting scores:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/locations/:locationId/scores", (req, res) => {
    try {
      const parsed = updateScoresSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Must provide good and/or bad as numbers" });
      }

      if (parsed.data.good === undefined && parsed.data.bad === undefined) {
        return res.status(400).json({ error: "Must provide good and/or bad as numbers" });
      }

      const scores = storage.updateScores(req.params.locationId, parsed.data);
      res.json(scores);
    } catch (error) {
      console.error("Error updating scores:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/locations/:locationId/scores/reset", (req, res) => {
    try {
      const scores = storage.resetScores(req.params.locationId);
      res.json(scores);
    } catch (error) {
      console.error("Error resetting scores:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/locations/:locationId/scores/target", (req, res) => {
    try {
      const parsed = updateTargetScoreSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Target score must be a number between 1 and 100" });
      }

      const scores = storage.updateTargetScore(req.params.locationId, parsed.data.targetScore);
      res.json(scores);
    } catch (error) {
      console.error("Error updating target score:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  return httpServer;
}
