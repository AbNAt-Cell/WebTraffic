import { db } from "@db";
import { 
  activityLog, 
  navigationHistory, 
  extractedData, 
  schedules,
  visitStats,
  insertActivityLogSchema, 
  insertNavigationHistorySchema, 
  insertExtractedDataSchema,
  insertScheduleSchema,
  insertVisitStatsSchema
} from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const storage = {
  // Activity Log
  async logActivity(data: {
    userId: number;
    activityType: string;
    description: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const validatedData = insertActivityLogSchema.parse({
        userId: data.userId,
        activityType: data.activityType,
        description: data.description,
        metadata: data.metadata || {},
      });

      const [result] = await db.insert(activityLog).values(validatedData).returning();
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid activity log data: ${error.message}`);
      }
      throw error;
    }
  },

  async getActivityLogs(limit = 50) {
    return db.query.activityLog.findMany({
      orderBy: desc(activityLog.timestamp),
      limit
    });
  },

  // Navigation History
  async logNavigation(data: {
    userId: number;
    url: string;
    title?: string;
    success?: boolean;
  }) {
    try {
      const validatedData = insertNavigationHistorySchema.parse({
        userId: data.userId,
        url: data.url,
        title: data.title,
        success: data.success ?? true,
      });

      const [result] = await db.insert(navigationHistory).values(validatedData).returning();
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid navigation history data: ${error.message}`);
      }
      throw error;
    }
  },

  async getNavigationHistory(limit = 50) {
    return db.query.navigationHistory.findMany({
      orderBy: desc(navigationHistory.timestamp),
      limit
    });
  },

  // Extracted Data
  async saveExtractedData(data: {
    userId: number;
    sourceUrl: string;
    selector: string;
    data: any;
  }) {
    try {
      const validatedData = insertExtractedDataSchema.parse({
        userId: data.userId,
        sourceUrl: data.sourceUrl,
        selector: data.selector,
        data: data.data,
      });

      const [result] = await db.insert(extractedData).values(validatedData).returning();
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid extracted data: ${error.message}`);
      }
      throw error;
    }
  },

  async getExtractedDataById(id: number) {
    return db.query.extractedData.findFirst({
      where: eq(extractedData.id, id)
    });
  },

  async getAllExtractedData(limit = 20) {
    return db.query.extractedData.findMany({
      orderBy: desc(extractedData.timestamp),
      limit
    });
  },
  
  // Schedule management
  async createSchedule(data: {
    id: string;
    userId: number;
    url: string;
    frequency: string;
    startAt: Date;
    endAt?: Date;
    maxVisits: number;
    followLinks: boolean;
    maxDepth: number;
    description?: string;
    active: boolean;
  }) {
    try {
      const validatedData = insertScheduleSchema.parse({
        id: data.id,
        userId: data.userId,
        url: data.url,
        frequency: data.frequency,
        startAt: data.startAt,
        endAt: data.endAt,
        maxVisits: data.maxVisits,
        followLinks: data.followLinks,
        maxDepth: data.maxDepth,
        description: data.description || '',
        active: data.active
      });

      const [result] = await db.insert(schedules).values(validatedData).returning();
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid schedule data: ${error.message}`);
      }
      throw error;
    }
  },

  async getSchedules(userId: number) {
    return db.query.schedules.findMany({
      where: eq(schedules.userId, userId),
      orderBy: desc(schedules.createdAt)
    });
  },

  async updateSchedule(id: string, data: Partial<{
    url: string;
    frequency: string;
    startAt: Date;
    endAt?: Date;
    maxVisits: number;
    followLinks: boolean;
    maxDepth: number;
    description?: string;
    active: boolean;
  }>) {
    try {
      // We need to handle partial updates, so we first get the existing record
      const existingSchedule = await db.query.schedules.findFirst({
        where: eq(schedules.id, id)
      });

      if (!existingSchedule) {
        throw new Error(`Schedule with ID ${id} not found`);
      }

      // Merge with existing data
      const updatedData = {
        ...existingSchedule,
        ...data,
        updatedAt: new Date()
      };

      const [result] = await db
        .update(schedules)
        .set(updatedData)
        .where(eq(schedules.id, id))
        .returning();

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid schedule update data: ${error.message}`);
      }
      throw error;
    }
  },

  async deleteSchedule(id: string) {
    const [result] = await db
      .delete(schedules)
      .where(eq(schedules.id, id))
      .returning();
    
    return result;
  },

  // Visit stats management
  async getVisitStats(userId: number) {
    const stats = await db.query.visitStats.findFirst({
      where: eq(visitStats.userId, userId)
    });

    if (!stats) {
      // Create default stats if none exist
      const defaultStats = {
        userId,
        totalVisits: 0,
        remainingVisits: 200000,
        uniqueUrls: 0
      };

      const [newStats] = await db.insert(visitStats)
        .values(defaultStats)
        .returning();

      return newStats;
    }

    return stats;
  },

  async updateVisitStats(userId: number, data: {
    totalVisits?: number;
    remainingVisits?: number;
    uniqueUrls?: number;
    lastVisitTime?: Date;
  }) {
    const stats = await this.getVisitStats(userId);

    const updatedData = {
      ...stats,
      ...data,
      updatedAt: new Date()
    };

    const [result] = await db
      .update(visitStats)
      .set(updatedData)
      .where(eq(visitStats.id, stats.id))
      .returning();

    return result;
  }
};
