import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  metadata: jsonb("metadata").$type<{
    duration?: number;
    resolution?: string;
    fps?: number;
    matchDate?: string;
    homeTeam?: string;
    awayTeam?: string;
  }>().default({}),
  processed: boolean("processed").default(false),
  processingProgress: doublePrecision("processing_progress").default(0.0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clips = pgTable("clips", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  startTime: doublePrecision("start_time").notNull(), // seconds
  endTime: doublePrecision("end_time").notNull(),   // seconds
  description: text("description").notNull(),
  teamId: text("team_id"), // "home", "away", or specific team ID
  confidenceScore: doublePrecision("confidence_score").notNull(), // 0.0 to 1.0 (or 0-100)
  tags: text("tags").array(), // For additional metadata
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const videosRelations = relations(videos, ({ many }) => ({
  clips: many(clips),
}));

export const clipsRelations = relations(clips, ({ one }) => ({
  video: one(videos, {
    fields: [clips.videoId],
    references: [videos.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true });
export const insertClipSchema = createInsertSchema(clips).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Clip = typeof clips.$inferSelect;
export type InsertClip = z.infer<typeof insertClipSchema>;

// Request types
export type CreateVideoRequest = InsertVideo;
export type CreateClipRequest = InsertClip;
export type SearchQueryRequest = { query: string; };

// Response types
export type VideoResponse = Video;
export type ClipResponse = Clip & { video?: Video }; // Include video details often needed

export type SearchResponse = {
  clips: ClipResponse[];
  totalResults: number;
};
