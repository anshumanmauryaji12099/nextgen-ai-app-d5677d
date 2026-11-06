import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

/**
 * Image Studio results. Until accounts land (milestone 2) each browser gets an
 * anonymous device id; every query is scoped to it.
 */
export const images = pgTable(
  'images',
  {
    id: text().primaryKey(),
    deviceId: text('device_id').notNull(),
    ipHash: text('ip_hash').notNull(),
    tool: text().notNull(),
    prompt: text().notNull().default(''),
    style: text(),
    ratio: text(),
    model: text().notNull(),
    blobKey: text('blob_key').notNull(),
    mimeType: text('mime_type').notNull(),
    bytes: integer().notNull(),
    saved: boolean().notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('images_device_created_idx').on(t.deviceId, t.createdAt),
    index('images_ip_created_idx').on(t.ipHash, t.createdAt),
  ],
)

export type ImageRecord = typeof images.$inferSelect
