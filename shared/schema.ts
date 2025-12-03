import { z } from "zod";

export const queuePlayerSchema = z.object({
  id: z.number(),
  name: z.string(),
  position: z.number(),
  createdAt: z.number(),
});

export const insertQueuePlayerSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
});

export const scoresSchema = z.object({
  good: z.number().min(0),
  bad: z.number().min(0),
});

export const updateScoresSchema = z.object({
  good: z.number().min(0).optional(),
  bad: z.number().min(0).optional(),
});

export type QueuePlayer = z.infer<typeof queuePlayerSchema>;
export type InsertQueuePlayer = z.infer<typeof insertQueuePlayerSchema>;
export type Scores = z.infer<typeof scoresSchema>;
export type UpdateScores = z.infer<typeof updateScoresSchema>;

export const users = null;
export type User = { id: string; username: string; password: string };
export type InsertUser = { username: string; password: string };
