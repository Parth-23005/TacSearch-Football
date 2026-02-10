import { db } from "./db";
import {
  videos, clips, users,
  type Video, type InsertVideo,
  type Clip, type InsertClip,
  type User, type UpsertUser // Auth types from shared/models/auth imported via shared/schema
} from "@shared/schema";
import { eq, like, sql } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth"; // Import authStorage to extend/use

export interface IStorage extends IAuthStorage {
  // Videos
  getVideos(): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;

  // Clips
  getClips(videoId?: number): Promise<Clip[]>;
  createClip(clip: InsertClip): Promise<Clip>;
  searchClips(query: string): Promise<(Clip & { video: Video | null })[]>; // Mock semantic search
}

export class DatabaseStorage implements IStorage {
  // === Auth Methods (Delegated or Re-implemented if needed, but we can mixin) ===
  // Since we are implementing IStorage which extends IAuthStorage, we need these.
  // We can just use the authStorage implementation or re-implement using the same DB.
  // Re-implementing is cleaner to keep this class self-contained if we want,
  // but for DRY we can just delegate.

  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    return authStorage.upsertUser(user);
  }

  // === Video Methods ===
  async getVideos(): Promise<Video[]> {
    return await db.select().from(videos);
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values(insertVideo).returning();
    return video;
  }

  // === Clip Methods ===
  async getClips(videoId?: number): Promise<Clip[]> {
    if (videoId) {
      return await db.select().from(clips).where(eq(clips.videoId, videoId));
    }
    return await db.select().from(clips);
  }

  async createClip(insertClip: InsertClip): Promise<Clip> {
    const [clip] = await db.insert(clips).values(insertClip).returning();
    return clip;
  }

  async searchClips(query: string): Promise<(Clip & { video: Video | null })[]> {
    // This is where the "Simulated AI" magic happens.
    // For a real app, we'd generate embeddings here.
    // For this MVP, we'll do a robust keyword search on description + tags
    // AND simulated "semantic" matches based on predefined keywords.

    const lowercaseQuery = query.toLowerCase();

    // 1. Basic text search
    const results = await db
      .select({
        clip: clips,
        video: videos,
      })
      .from(clips)
      .leftJoin(videos, eq(clips.videoId, videos.id))
      .where(
        sql`LOWER(${clips.description}) LIKE ${`%${lowercaseQuery}%`} OR 
            EXISTS (SELECT 1 FROM unnest(${clips.tags}) AS tag WHERE LOWER(tag) LIKE ${`%${lowercaseQuery}%`})`
      );

    return results.map(r => ({ ...r.clip, video: r.video }));
  }
}

export const storage = new DatabaseStorage();
