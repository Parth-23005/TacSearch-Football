import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { z } from "zod";
import { calculateMockConfidence } from "./lib/search";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Videos API
  app.get(api.videos.list.path, async (req, res) => {
    const videos = await storage.getVideos();
    res.json(videos);
  });

  app.get(api.videos.get.path, async (req, res) => {
    const video = await storage.getVideo(Number(req.params.id));
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    res.json(video);
  });

  app.post(api.videos.create.path, async (req, res) => {
    try {
      const input = api.videos.create.input.parse(req.body);
      const video = await storage.createVideo(input);
      res.status(201).json(video);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // 3. Clips API
  app.get(api.clips.list.path, async (req, res) => {
    const videoId = req.query.videoId ? Number(req.query.videoId) : undefined;
    const clips = await storage.getClips(videoId);
    res.json(clips);
  });

  app.post(api.clips.create.path, async (req, res) => {
    try {
      const input = api.clips.create.input.parse(req.body);
      const clip = await storage.createClip(input);
      res.status(201).json(clip);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.clips.search.path, async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.json([]);
    }

    // Perform search
    const results = await storage.searchClips(query);

    // Add mock confidence scores dynamically
    const resultsWithScores = results.map(clip => ({
      ...clip,
      confidenceScore: calculateMockConfidence(query, clip.description)
    }));
    
    // Sort by confidence
    resultsWithScores.sort((a, b) => b.confidenceScore - a.confidenceScore);

    res.json(resultsWithScores);
  });

  // 4. Seed Data (Run on startup or via hidden endpoint)
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingVideos = await storage.getVideos();
  if (existingVideos.length > 0) return;

  console.log("Seeding database...");

  // Create Mock Videos
  const match1 = await storage.createVideo({
    title: "Manchester City vs Real Madrid - UCL Semi-Final 2023",
    filename: "mci_rma_2023.mp4",
    filepath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Placeholder
    metadata: {
      matchDate: "2023-05-17",
      homeTeam: "Manchester City",
      awayTeam: "Real Madrid",
    }
  });

  const match2 = await storage.createVideo({
    title: "Arsenal vs Liverpool - Premier League 2024",
    filename: "ars_liv_2024.mp4",
    filepath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Placeholder
    metadata: {
      matchDate: "2024-02-04",
      homeTeam: "Arsenal",
      awayTeam: "Liverpool",
    }
  });

  // Create Mock Clips (Simulating what YOLO/CLIP would find)
  // Match 1 Clips
  await storage.createClip({
    videoId: match1.id,
    startTime: 60,
    endTime: 75,
    description: "Manchester City high press forces turnover",
    teamId: "home",
    confidenceScore: 0.95,
    tags: ["High Press", "Turnover", "Midfield"],
    thumbnailUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800",
  });

  await storage.createClip({
    videoId: match1.id,
    startTime: 120,
    endTime: 140,
    description: "Real Madrid counter attack opportunity missed",
    teamId: "away",
    confidenceScore: 0.88,
    tags: ["Counter Attack", "Missed Chance", "Transition"],
    thumbnailUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
  });
  
  await storage.createClip({
    videoId: match1.id,
    startTime: 300,
    endTime: 320,
    description: "Defensive error by Akanji leads to shot",
    teamId: "home",
    confidenceScore: 0.92,
    tags: ["Defensive Error", "Shot Conceded", "Box"],
    thumbnailUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=800",
  });

  // Match 2 Clips
  await storage.createClip({
    videoId: match2.id,
    startTime: 45,
    endTime: 55,
    description: "Saka goal from fast break",
    teamId: "home",
    confidenceScore: 0.99,
    tags: ["Goal", "Fast Break", "Winger"],
    thumbnailUrl: "https://images.unsplash.com/photo-1522778119026-d647f0565c71?auto=format&fit=crop&q=80&w=800",
  });
  
  await storage.createClip({
    videoId: match2.id,
    startTime: 200,
    endTime: 215,
    description: "Liverpool defensive line breakdown",
    teamId: "away",
    confidenceScore: 0.85,
    tags: ["Defensive Line", "Error", "Offside Trap"],
    thumbnailUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800",
  });

  console.log("Database seeded successfully.");
}
