import { z } from 'zod';
import { insertVideoSchema, insertClipSchema, videos, clips } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  videos: {
    list: {
      method: 'GET' as const,
      path: '/api/videos',
      responses: {
        200: z.array(z.custom<typeof videos.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/videos/:id',
      responses: {
        200: z.custom<typeof videos.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/videos',
      input: insertVideoSchema,
      responses: {
        201: z.custom<typeof videos.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  clips: {
    search: {
      method: 'GET' as const,
      path: '/api/clips/search',
      input: z.object({
        q: z.string(), // Search query
      }),
      responses: {
        200: z.array(z.custom<typeof clips.$inferSelect & { video?: typeof videos.$inferSelect }>()),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/clips',
      input: z.object({
        videoId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof clips.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clips',
      input: insertClipSchema,
      responses: {
        201: z.custom<typeof clips.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type VideoInput = z.infer<typeof api.videos.create.input>;
export type ClipInput = z.infer<typeof api.clips.create.input>;
export type ClipSearchResponse = z.infer<typeof api.clips.search.responses[200]>;
