import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Navigation history table
export const navigationHistory = pgTable("navigation_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  url: text("url").notNull(),
  title: text("title"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  success: boolean("success").notNull().default(true),
});

export const navigationHistoryRelations = relations(navigationHistory, ({ one }) => ({
  user: one(users, {
    fields: [navigationHistory.userId],
    references: [users.id],
  }),
}));

export const insertNavigationHistorySchema = createInsertSchema(navigationHistory).pick({
  userId: true,
  url: true,
  title: true,
  success: true,
});

export type InsertNavigationHistory = z.infer<typeof insertNavigationHistorySchema>;
export type NavigationHistory = typeof navigationHistory.$inferSelect;

// Activity log table
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  activityType: text("activity_type").notNull(), // navigation, interaction, extraction, error
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata"), // Store any additional data
});

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

export const insertActivityLogSchema = createInsertSchema(activityLog).pick({
  userId: true,
  activityType: true,
  description: true,
  metadata: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;

// Extracted data table
export const extractedData = pgTable("extracted_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sourceUrl: text("source_url").notNull(),
  selector: text("selector").notNull(),
  data: jsonb("data").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const extractedDataRelations = relations(extractedData, ({ one }) => ({
  user: one(users, {
    fields: [extractedData.userId],
    references: [users.id],
  }),
}));

export const insertExtractedDataSchema = createInsertSchema(extractedData).pick({
  userId: true,
  sourceUrl: true,
  selector: true,
  data: true,
});

export type InsertExtractedData = z.infer<typeof insertExtractedDataSchema>;
export type ExtractedData = typeof extractedData.$inferSelect;

// Agent settings table
export const agentSettings = pgTable("agent_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  behavior: text("behavior").notNull().default("standard"),
  navigationTimeout: integer("navigation_timeout").notNull().default(30),
  userAgent: text("user_agent").notNull().default("Chrome (Windows)"),
  enableJavascript: boolean("enable_javascript").notNull().default(true),
  acceptCookies: boolean("accept_cookies").notNull().default(true),
  disableImages: boolean("disable_images").notNull().default(false),
});

export const agentSettingsRelations = relations(agentSettings, ({ one }) => ({
  user: one(users, {
    fields: [agentSettings.userId],
    references: [users.id],
  }),
}));

export const insertAgentSettingsSchema = createInsertSchema(agentSettings).pick({
  userId: true,
  behavior: true,
  navigationTimeout: true,
  userAgent: true,
  enableJavascript: true,
  acceptCookies: true,
  disableImages: true,
});

export type InsertAgentSettings = z.infer<typeof insertAgentSettingsSchema>;
export type AgentSettings = typeof agentSettings.$inferSelect;

// Scheduled visits schema
export const schedules = pgTable("schedules", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  url: text("url").notNull(),
  frequency: text("frequency").notNull(), // once, hourly, daily, weekly
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),
  maxVisits: integer("max_visits").notNull().default(100),
  followLinks: boolean("follow_links").notNull().default(false),
  maxDepth: integer("max_depth").notNull().default(2),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const schedulesRelations = relations(schedules, ({ one }) => ({
  user: one(users, { fields: [schedules.userId], references: [users.id] }),
}));

export const insertScheduleSchema = createInsertSchema(schedules).pick({
  id: true,
  userId: true,
  url: true,
  frequency: true,
  startAt: true,
  endAt: true,
  maxVisits: true,
  followLinks: true,
  maxDepth: true,
  description: true,
  active: true,
});

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

// Visit statistics schema
export const visitStats = pgTable("visit_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalVisits: integer("total_visits").notNull().default(0),
  remainingVisits: integer("remaining_visits").notNull().default(200000),
  uniqueUrls: integer("unique_urls").notNull().default(0),
  lastVisitTime: timestamp("last_visit_time"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const visitStatsRelations = relations(visitStats, ({ one }) => ({
  user: one(users, { fields: [visitStats.userId], references: [users.id] }),
}));

export const insertVisitStatsSchema = createInsertSchema(visitStats).pick({
  userId: true,
  totalVisits: true,
  remainingVisits: true,
  uniqueUrls: true,
  lastVisitTime: true,
});

export type InsertVisitStats = z.infer<typeof insertVisitStatsSchema>;
export type VisitStats = typeof visitStats.$inferSelect;
