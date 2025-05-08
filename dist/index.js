var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// db/index.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLog: () => activityLog,
  activityLogRelations: () => activityLogRelations,
  agentSettings: () => agentSettings,
  agentSettingsRelations: () => agentSettingsRelations,
  extractedData: () => extractedData,
  extractedDataRelations: () => extractedDataRelations,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertAgentSettingsSchema: () => insertAgentSettingsSchema,
  insertExtractedDataSchema: () => insertExtractedDataSchema,
  insertNavigationHistorySchema: () => insertNavigationHistorySchema,
  insertScheduleSchema: () => insertScheduleSchema,
  insertUserSchema: () => insertUserSchema,
  insertVisitStatsSchema: () => insertVisitStatsSchema,
  navigationHistory: () => navigationHistory,
  navigationHistoryRelations: () => navigationHistoryRelations,
  schedules: () => schedules,
  schedulesRelations: () => schedulesRelations,
  users: () => users,
  visitStats: () => visitStats,
  visitStatsRelations: () => visitStatsRelations
});
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var navigationHistory = pgTable("navigation_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  url: text("url").notNull(),
  title: text("title"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  success: boolean("success").notNull().default(true)
});
var navigationHistoryRelations = relations(navigationHistory, ({ one }) => ({
  user: one(users, {
    fields: [navigationHistory.userId],
    references: [users.id]
  })
}));
var insertNavigationHistorySchema = createInsertSchema(navigationHistory).pick({
  userId: true,
  url: true,
  title: true,
  success: true
});
var activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  activityType: text("activity_type").notNull(),
  // navigation, interaction, extraction, error
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata")
  // Store any additional data
});
var activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id]
  })
}));
var insertActivityLogSchema = createInsertSchema(activityLog).pick({
  userId: true,
  activityType: true,
  description: true,
  metadata: true
});
var extractedData = pgTable("extracted_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sourceUrl: text("source_url").notNull(),
  selector: text("selector").notNull(),
  data: jsonb("data").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
var extractedDataRelations = relations(extractedData, ({ one }) => ({
  user: one(users, {
    fields: [extractedData.userId],
    references: [users.id]
  })
}));
var insertExtractedDataSchema = createInsertSchema(extractedData).pick({
  userId: true,
  sourceUrl: true,
  selector: true,
  data: true
});
var agentSettings = pgTable("agent_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  behavior: text("behavior").notNull().default("standard"),
  navigationTimeout: integer("navigation_timeout").notNull().default(30),
  userAgent: text("user_agent").notNull().default("Chrome (Windows)"),
  enableJavascript: boolean("enable_javascript").notNull().default(true),
  acceptCookies: boolean("accept_cookies").notNull().default(true),
  disableImages: boolean("disable_images").notNull().default(false)
});
var agentSettingsRelations = relations(agentSettings, ({ one }) => ({
  user: one(users, {
    fields: [agentSettings.userId],
    references: [users.id]
  })
}));
var insertAgentSettingsSchema = createInsertSchema(agentSettings).pick({
  userId: true,
  behavior: true,
  navigationTimeout: true,
  userAgent: true,
  enableJavascript: true,
  acceptCookies: true,
  disableImages: true
});
var schedules = pgTable("schedules", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  url: text("url").notNull(),
  frequency: text("frequency").notNull(),
  // once, hourly, daily, weekly
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),
  maxVisits: integer("max_visits").notNull().default(100),
  followLinks: boolean("follow_links").notNull().default(false),
  maxDepth: integer("max_depth").notNull().default(2),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var schedulesRelations = relations(schedules, ({ one }) => ({
  user: one(users, { fields: [schedules.userId], references: [users.id] })
}));
var insertScheduleSchema = createInsertSchema(schedules).pick({
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
  active: true
});
var visitStats = pgTable("visit_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalVisits: integer("total_visits").notNull().default(0),
  remainingVisits: integer("remaining_visits").notNull().default(2e5),
  uniqueUrls: integer("unique_urls").notNull().default(0),
  lastVisitTime: timestamp("last_visit_time"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var visitStatsRelations = relations(visitStats, ({ one }) => ({
  user: one(users, { fields: [visitStats.userId], references: [users.id] })
}));
var insertVisitStatsSchema = createInsertSchema(visitStats).pick({
  userId: true,
  totalVisits: true,
  remainingVisits: true,
  uniqueUrls: true,
  lastVisitTime: true
});

// db/index.ts
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
var storage = {
  // Activity Log
  async logActivity(data) {
    try {
      const validatedData = insertActivityLogSchema.parse({
        userId: data.userId,
        activityType: data.activityType,
        description: data.description,
        metadata: data.metadata || {}
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
  async logNavigation(data) {
    try {
      const validatedData = insertNavigationHistorySchema.parse({
        userId: data.userId,
        url: data.url,
        title: data.title,
        success: data.success ?? true
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
  async saveExtractedData(data) {
    try {
      const validatedData = insertExtractedDataSchema.parse({
        userId: data.userId,
        sourceUrl: data.sourceUrl,
        selector: data.selector,
        data: data.data
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
  async getExtractedDataById(id) {
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
  async createSchedule(data) {
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
        description: data.description || "",
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
  async getSchedules(userId) {
    return db.query.schedules.findMany({
      where: eq(schedules.userId, userId),
      orderBy: desc(schedules.createdAt)
    });
  },
  async updateSchedule(id, data) {
    try {
      const existingSchedule = await db.query.schedules.findFirst({
        where: eq(schedules.id, id)
      });
      if (!existingSchedule) {
        throw new Error(`Schedule with ID ${id} not found`);
      }
      const updatedData = {
        ...existingSchedule,
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      };
      const [result] = await db.update(schedules).set(updatedData).where(eq(schedules.id, id)).returning();
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid schedule update data: ${error.message}`);
      }
      throw error;
    }
  },
  async deleteSchedule(id) {
    const [result] = await db.delete(schedules).where(eq(schedules.id, id)).returning();
    return result;
  },
  // Visit stats management
  async getVisitStats(userId) {
    const stats = await db.query.visitStats.findFirst({
      where: eq(visitStats.userId, userId)
    });
    if (!stats) {
      const defaultStats = {
        userId,
        totalVisits: 0,
        remainingVisits: 2e5,
        uniqueUrls: 0
      };
      const [newStats] = await db.insert(visitStats).values(defaultStats).returning();
      return newStats;
    }
    return stats;
  },
  async updateVisitStats(userId, data) {
    const stats = await this.getVisitStats(userId);
    const updatedData = {
      ...stats,
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const [result] = await db.update(visitStats).set(updatedData).where(eq(visitStats.id, stats.id)).returning();
    return result;
  }
};

// server/routes.ts
import { z as z2 } from "zod";
import { eq as eq2 } from "drizzle-orm";

// server/ai.ts
import axios from "axios";
var DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
var DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
var DEFAULT_MODEL = "deepseek-chat";
var aiService = {
  /**
   * Send a request to the DeepSeek AI API
   */
  async generateResponse(messages, options = {}) {
    try {
      if (!DEEPSEEK_API_KEY) {
        throw new Error("DeepSeek API key is not configured");
      }
      const requestBody = {
        model: DEFAULT_MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1e3
      };
      const response = await axios.post(
        DEEPSEEK_API_URL,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`
          }
        }
      );
      await storage.logActivity({
        userId: 1,
        // Default user
        activityType: "ai-interaction",
        description: "Received response from DeepSeek AI",
        metadata: {
          tokenUsage: response.data.usage,
          model: response.data.model
        }
      });
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling DeepSeek API:", error.message);
      await storage.logActivity({
        userId: 1,
        activityType: "error",
        description: "Failed to get response from DeepSeek AI",
        metadata: { error: error.message }
      });
      throw new Error(`AI service error: ${error.message}`);
    }
  },
  /**
   * Analyze extracted web content
   */
  async analyzeContent(content, instructions) {
    const messages = [
      {
        role: "system",
        content: "You are an AI assistant that analyzes web content. Provide clear, concise analysis."
      },
      {
        role: "user",
        content: `${instructions}

Here is the content to analyze:
${content}`
      }
    ];
    return this.generateResponse(messages, { temperature: 0.5 });
  },
  /**
   * Generate suggestions for next actions based on current webpage
   */
  async suggestActions(pageContent, url) {
    const messages = [
      {
        role: "system",
        content: "You are an AI assistant that suggests web navigation actions. Provide 3-5 specific, actionable suggestions."
      },
      {
        role: "user",
        content: `I'm currently on this webpage: ${url}

Here's the page content:
${pageContent}

Suggest some specific actions I could take next (e.g., elements to click, data to extract, specific navigation commands).`
      }
    ];
    return this.generateResponse(messages, { temperature: 0.7 });
  },
  /**
   * Generate a step-by-step plan to accomplish a task
   */
  async createTaskPlan(task) {
    const messages = [
      {
        role: "system",
        content: "You are an AI assistant that creates step-by-step plans for web automation tasks. Be specific with selectors and commands."
      },
      {
        role: "user",
        content: `I want to accomplish this task with the web automation agent: ${task}

Create a step-by-step plan using the available commands: navigate, click, type, extract, scroll.`
      }
    ];
    return this.generateResponse(messages, { temperature: 0.2 });
  }
};

// server/browser.ts
import puppeteer from "puppeteer";
var MockBrowser = class {
  async newPage() {
    return new MockPage();
  }
  async close() {
    console.log("MockBrowser: Closing browser");
    return Promise.resolve();
  }
};
var MockPage = class {
  currentUrl = "";
  async goto(url) {
    console.log(`MockPage: Navigating to ${url}`);
    this.currentUrl = url;
    return { status: () => 200 };
  }
  async setDefaultNavigationTimeout() {
    return Promise.resolve();
  }
  async waitForSelector() {
    return Promise.resolve();
  }
  async click() {
    return Promise.resolve();
  }
  async waitForNavigation() {
    return Promise.resolve();
  }
  async type() {
    return Promise.resolve();
  }
  async title() {
    return "Mock Page Title";
  }
  url() {
    return this.currentUrl;
  }
  async evaluate() {
    return [];
  }
  async close() {
    console.log("MockPage: Closing page");
    return Promise.resolve();
  }
};
async function createBrowserInstance() {
  try {
    console.log("Attempting to create browser instance with enhanced containerized environment options...");
    try {
      const browser = await puppeteer.launch({
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-features=site-per-process",
          "--disable-extensions",
          "--disable-software-rasterizer",
          "--disable-infobars",
          "--mute-audio",
          "--single-process",
          "--disable-breakpad",
          "--disable-web-security",
          "--no-zygote"
        ],
        dumpio: true,
        // Output browser process stdout and stderr
        headless: true,
        // Use headless mode
        timeout: 6e4
        // Increase timeout to 60 seconds
      });
      console.log("Browser launched successfully!");
      return browser;
    } catch (innerError) {
      console.warn("Cannot launch real browser due to system limitations, using mock browser instead");
      console.warn("This is a fallback mode for development/testing only");
      if (innerError instanceof Error) {
        console.warn(`Original error: ${innerError.message}`);
      }
      return new MockBrowser();
    }
  } catch (error) {
    console.error("Failed to initialize browser instance:", error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.stack) {
        console.error(`Stack trace: ${error.stack}`);
      }
    }
    throw error;
  }
}

// server/scheduler.ts
var SchedulerService = class {
  schedules = [];
  browserInstance = null;
  isRunning = false;
  timers = [];
  stats = {
    totalVisits: 0,
    visitsBySchedule: {},
    lastVisitTime: {},
    visitedUrls: /* @__PURE__ */ new Set()
  };
  visitLimit = 2e5;
  constructor() {
  }
  async startScheduler() {
    if (this.isRunning) return;
    try {
      this.browserInstance = await createBrowserInstance();
      this.isRunning = true;
      for (const schedule of this.schedules) {
        if (schedule.active) {
          this.scheduleVisit(schedule);
        }
      }
    } catch (error) {
      console.error("Failed to start scheduler:", error);
      throw error;
    }
  }
  stopScheduler() {
    this.isRunning = false;
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
    if (this.browserInstance) {
      this.browserInstance.close().catch(console.error);
      this.browserInstance = null;
    }
  }
  addSchedule(schedule) {
    this.schedules.push(schedule);
    this.stats.visitsBySchedule[schedule.id] = 0;
    this.stats.lastVisitTime[schedule.id] = /* @__PURE__ */ new Date(0);
    if (this.isRunning && schedule.active) {
      this.scheduleVisit(schedule);
    }
    return schedule;
  }
  updateSchedule(scheduleId, update) {
    const scheduleIndex = this.schedules.findIndex((s) => s.id === scheduleId);
    if (scheduleIndex === -1) {
      throw new Error(`Schedule with ID ${scheduleId} not found`);
    }
    this.schedules[scheduleIndex] = { ...this.schedules[scheduleIndex], ...update };
    return this.schedules[scheduleIndex];
  }
  removeSchedule(scheduleId) {
    const scheduleIndex = this.schedules.findIndex((s) => s.id === scheduleId);
    if (scheduleIndex === -1) {
      throw new Error(`Schedule with ID ${scheduleId} not found`);
    }
    this.schedules.splice(scheduleIndex, 1);
    delete this.stats.visitsBySchedule[scheduleId];
    delete this.stats.lastVisitTime[scheduleId];
  }
  getSchedules() {
    return this.schedules;
  }
  getStats() {
    return {
      totalVisits: this.stats.totalVisits,
      visitsBySchedule: this.stats.visitsBySchedule,
      lastVisitTime: this.stats.lastVisitTime,
      uniqueUrls: this.stats.visitedUrls.size,
      remainingVisits: this.visitLimit - this.stats.totalVisits
    };
  }
  scheduleVisit(schedule) {
    const now = /* @__PURE__ */ new Date();
    let nextVisitTime = new Date(schedule.startAt);
    if (nextVisitTime < now) {
      switch (schedule.frequency) {
        case "once":
          nextVisitTime = /* @__PURE__ */ new Date();
          break;
        case "hourly":
          nextVisitTime = /* @__PURE__ */ new Date();
          nextVisitTime.setHours(nextVisitTime.getHours() + 1, 0, 0, 0);
          break;
        case "daily":
          const originalHour = new Date(schedule.startAt).getHours();
          const originalMinute = new Date(schedule.startAt).getMinutes();
          nextVisitTime = /* @__PURE__ */ new Date();
          nextVisitTime.setDate(nextVisitTime.getDate() + 1);
          nextVisitTime.setHours(originalHour, originalMinute, 0, 0);
          break;
        case "weekly":
          nextVisitTime = /* @__PURE__ */ new Date();
          nextVisitTime.setDate(nextVisitTime.getDate() + 7);
          break;
      }
    }
    const delay = Math.max(0, nextVisitTime.getTime() - now.getTime());
    const timer = setTimeout(async () => {
      if (this.stats.totalVisits >= this.visitLimit) {
        console.log(`Visit limit (${this.visitLimit}) reached. Stopping scheduler.`);
        this.stopScheduler();
        return;
      }
      if (!schedule.active || !this.isRunning) {
        return;
      }
      if (this.stats.visitsBySchedule[schedule.id] >= schedule.maxVisits) {
        console.log(`Max visits (${schedule.maxVisits}) reached for schedule ${schedule.id}`);
        return;
      }
      if (schedule.endAt && /* @__PURE__ */ new Date() > new Date(schedule.endAt)) {
        console.log(`End date reached for schedule ${schedule.id}`);
        return;
      }
      try {
        await this.visitUrl(schedule);
        this.stats.totalVisits++;
        this.stats.visitsBySchedule[schedule.id]++;
        this.stats.lastVisitTime[schedule.id] = /* @__PURE__ */ new Date();
        this.stats.visitedUrls.add(schedule.url);
        await storage.logActivity({
          userId: 1,
          // Default user
          activityType: "scheduled-visit",
          description: `Scheduled visit to ${schedule.url}`,
          metadata: { scheduleId: schedule.id }
        });
        if (schedule.frequency !== "once") {
          this.scheduleVisit(schedule);
        }
      } catch (error) {
        console.error(`Error during scheduled visit to ${schedule.url}:`, error);
        await storage.logActivity({
          userId: 1,
          // Default user
          activityType: "error",
          description: `Error during scheduled visit to ${schedule.url}`,
          metadata: { error: String(error), scheduleId: schedule.id }
        });
        if (schedule.frequency !== "once") {
          this.scheduleVisit(schedule);
        }
      }
    }, delay);
    this.timers.push(timer);
  }
  async visitUrl(schedule) {
    if (!this.browserInstance) {
      this.browserInstance = await createBrowserInstance();
    }
    const page = await this.browserInstance.newPage();
    await page.setDefaultNavigationTimeout(30 * 1e3);
    try {
      await storage.logNavigation({
        userId: 1,
        // Default user
        url: schedule.url,
        title: "Scheduled visit"
      });
      await page.goto(schedule.url, { waitUntil: "domcontentloaded" });
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      const pageContent = await page.evaluate(() => document.body.innerText);
      const pageTitle = await page.title();
      if (schedule.followLinks) {
        await this.processLinks(page, schedule, 1);
      }
      await this.analyzePageWithAI(pageContent, schedule.url, pageTitle);
      return true;
    } catch (error) {
      console.error(`Error visiting ${schedule.url}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }
  async processLinks(page, schedule, currentDepth) {
    if (currentDepth > schedule.maxDepth || !this.isRunning) {
      return;
    }
    try {
      const links = await page.evaluate(() => {
        const anchorElements = Array.from(document.querySelectorAll("a[href]"));
        return anchorElements.map((anchor) => anchor.href).filter(
          (href) => href && href.startsWith("http") && !href.includes("#") && // Skip anchors
          new URL(href).hostname === window.location.hostname
          // Same domain only
        );
      });
      const uniqueLinksSet = new Set(links);
      const uniqueLinks = Array.from(uniqueLinksSet);
      const baseUrl = new URL(schedule.url).hostname;
      const linksForAI = uniqueLinks.slice(0, 10);
      const messages = [
        {
          role: "system",
          content: `You are an AI that helps with web navigation. You need to analyze URLs and prioritize which ones are likely to be most relevant and information-rich based on their paths and structure.`
        },
        {
          role: "user",
          content: `I'm browsing ${baseUrl} and found these links. Please rank them by potential relevance and information value, with the most valuable first. Only respond with the ranked list of URLs, one per line:
${linksForAI.join("\n")}`
        }
      ];
      const aiResponse = await aiService.generateResponse(messages, { temperature: 0.7 });
      console.log("AI ranked links:", aiResponse);
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const matches = aiResponse.match(urlRegex) || [];
      const prioritizedLinks = matches.length > 0 ? matches : uniqueLinks.slice(0, 3);
      const linksToVisit = prioritizedLinks.slice(0, 3);
      for (const link of linksToVisit) {
        if (this.stats.totalVisits >= this.visitLimit) {
          console.log(`Visit limit (${this.visitLimit}) reached. Stopping further link processing.`);
          return;
        }
        if (!this.isRunning) {
          return;
        }
        try {
          await page.goto(link, { waitUntil: "domcontentloaded" });
          await new Promise((resolve) => setTimeout(resolve, 2e3));
          this.stats.totalVisits++;
          this.stats.visitsBySchedule[schedule.id]++;
          this.stats.visitedUrls.add(link);
          await storage.logNavigation({
            userId: 1,
            url: link,
            title: await page.title()
          });
          if (currentDepth < schedule.maxDepth) {
            await this.processLinks(page, schedule, currentDepth + 1);
          }
        } catch (error) {
          console.error(`Error visiting link ${link}:`, error);
        }
      }
    } catch (error) {
      console.error("Error processing links:", error);
    }
  }
  async analyzePageWithAI(pageContent, url, title) {
    try {
      const truncatedContent = pageContent.substring(0, 2e3) + (pageContent.length > 2e3 ? "... (content truncated)" : "");
      const messages = [
        {
          role: "system",
          content: `You are an AI assistant that analyzes web pages. Extract key information and summarize the main content.`
        },
        {
          role: "user",
          content: `Please analyze this webpage from ${url} titled "${title}" and provide a brief summary of its key information and purpose:

${truncatedContent}`
        }
      ];
      const analysis = await aiService.generateResponse(messages, { temperature: 0.3 });
      await storage.saveExtractedData({
        userId: 1,
        sourceUrl: url,
        selector: "page",
        data: { analysis, title, url }
      });
      return analysis;
    } catch (error) {
      console.error(`Error analyzing page with AI:`, error);
      return null;
    }
  }
};
var schedulerService = new SchedulerService();

// server/routes.ts
async function registerRoutes(app2) {
  let browserInstance = null;
  const getBrowserInstance = async () => {
    if (!browserInstance) {
      browserInstance = await createBrowserInstance();
    }
    return browserInstance;
  };
  try {
    browserInstance = await createBrowserInstance();
    console.log("Browser instance initialized successfully");
  } catch (error) {
    console.error("Failed to initialize browser instance:", error);
  }
  app2.post("/api/navigate", async (req, res) => {
    const schema = z2.object({
      url: z2.string().url("Invalid URL provided"),
      timeout: z2.number().int().min(5).max(120).optional().default(30)
    });
    try {
      const { url, timeout } = schema.parse(req.body);
      browserInstance = await getBrowserInstance();
      const page = await browserInstance.newPage();
      await page.setDefaultNavigationTimeout(timeout * 1e3);
      const navigationEntry = await storage.logNavigation({
        url,
        userId: 1,
        // Use default user for now
        success: true
      });
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded" });
        const title = await page.title();
        await storage.logActivity({
          userId: 1,
          // Default user
          activityType: "navigation",
          description: `Successfully navigated to ${url}`,
          metadata: { statusCode: response?.status() }
        });
        return res.status(200).json({
          success: true,
          title,
          url: page.url(),
          statusCode: response?.status()
        });
      } catch (error) {
        await db.update(navigationHistory).set({ success: false }).where(eq2(navigationHistory.id, navigationEntry.id)).execute();
        await storage.logActivity({
          userId: 1,
          activityType: "error",
          description: `Failed to navigate to ${url}`,
          metadata: { error: error.message }
        });
        return res.status(500).json({
          success: false,
          error: error.message
        });
      } finally {
        await page.close();
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "An unknown error occurred"
      });
    }
  });
  app2.post("/api/click", async (req, res) => {
    const schema = z2.object({
      url: z2.string().url("Invalid URL provided"),
      selector: z2.string().min(1, "Selector is required"),
      waitForNavigation: z2.boolean().optional().default(true),
      timeout: z2.number().int().min(5).max(120).optional().default(30)
    });
    try {
      const { url, selector, waitForNavigation, timeout } = schema.parse(req.body);
      browserInstance = await getBrowserInstance();
      const page = await browserInstance.newPage();
      await page.setDefaultNavigationTimeout(timeout * 1e3);
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(selector, { visible: true, timeout: timeout * 1e3 });
        if (waitForNavigation) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: "domcontentloaded" }),
            page.click(selector)
          ]);
        } else {
          await page.click(selector);
        }
        const currentUrl = page.url();
        const title = await page.title();
        await storage.logActivity({
          userId: 1,
          activityType: "interaction",
          description: `Clicked on element: ${selector}`,
          metadata: { url: currentUrl }
        });
        return res.status(200).json({
          success: true,
          url: currentUrl,
          title
        });
      } catch (error) {
        await storage.logActivity({
          userId: 1,
          activityType: "error",
          description: `Failed to click element: ${selector}`,
          metadata: { error: error.message }
        });
        return res.status(500).json({
          success: false,
          error: error.message
        });
      } finally {
        await page.close();
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "An unknown error occurred"
      });
    }
  });
  app2.post("/api/type", async (req, res) => {
    const schema = z2.object({
      url: z2.string().url("Invalid URL provided"),
      selector: z2.string().min(1, "Selector is required"),
      text: z2.string().min(1, "Text is required"),
      timeout: z2.number().int().min(5).max(120).optional().default(30)
    });
    try {
      const { url, selector, text: text2, timeout } = schema.parse(req.body);
      browserInstance = await getBrowserInstance();
      const page = await browserInstance.newPage();
      await page.setDefaultNavigationTimeout(timeout * 1e3);
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(selector, { visible: true, timeout: timeout * 1e3 });
        await page.evaluate((sel) => {
          document.querySelector(sel)?.setAttribute("value", "");
        }, selector);
        await page.type(selector, text2);
        await storage.logActivity({
          userId: 1,
          activityType: "interaction",
          description: `Typed text into element: ${selector}`,
          metadata: { text: text2, url }
        });
        return res.status(200).json({
          success: true,
          selector,
          text: text2
        });
      } catch (error) {
        await storage.logActivity({
          userId: 1,
          activityType: "error",
          description: `Failed to type text into element: ${selector}`,
          metadata: { error: error.message }
        });
        return res.status(500).json({
          success: false,
          error: error.message
        });
      } finally {
        await page.close();
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "An unknown error occurred"
      });
    }
  });
  app2.post("/api/extract", async (req, res) => {
    const schema = z2.object({
      url: z2.string().url("Invalid URL provided"),
      selector: z2.string().min(1, "Selector is required"),
      timeout: z2.number().int().min(5).max(120).optional().default(30),
      dataAttributes: z2.array(z2.string()).optional()
    });
    try {
      const { url, selector, timeout, dataAttributes = [] } = schema.parse(req.body);
      browserInstance = await getBrowserInstance();
      const page = await browserInstance.newPage();
      await page.setDefaultNavigationTimeout(timeout * 1e3);
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(selector, { timeout: timeout * 1e3 });
        const extractedItems = await page.evaluate((sel, attrs) => {
          const elements = Array.from(document.querySelectorAll(sel));
          return elements.map((el) => {
            const item = {
              innerText: el.textContent?.trim(),
              html: el.innerHTML
            };
            if (attrs.length > 0) {
              attrs.forEach((attr) => {
                item[attr] = el.getAttribute(attr);
              });
            }
            if (el.tagName === "A") {
              item.href = el.href;
            }
            if (el.tagName === "IMG") {
              item.src = el.src;
              item.alt = el.alt;
            }
            return item;
          });
        }, selector, dataAttributes);
        const savedExtraction = await storage.saveExtractedData({
          userId: 1,
          sourceUrl: url,
          selector,
          data: extractedItems
        });
        await storage.logActivity({
          userId: 1,
          activityType: "extraction",
          description: `Extracted ${extractedItems.length} items from: ${selector}`,
          metadata: { url, extractionId: savedExtraction.id }
        });
        return res.status(200).json({
          success: true,
          count: extractedItems.length,
          data: extractedItems,
          extractionId: savedExtraction.id
        });
      } catch (error) {
        await storage.logActivity({
          userId: 1,
          activityType: "error",
          description: `Failed to extract data from: ${selector}`,
          metadata: { error: error.message }
        });
        return res.status(500).json({
          success: false,
          error: error.message
        });
      } finally {
        await page.close();
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "An unknown error occurred"
      });
    }
  });
  app2.post("/api/scroll", async (req, res) => {
    const schema = z2.object({
      url: z2.string().url("Invalid URL provided"),
      direction: z2.enum(["up", "down", "top", "bottom"]),
      amount: z2.number().int().optional().default(500),
      timeout: z2.number().int().min(5).max(120).optional().default(30)
    });
    try {
      const { url, direction, amount, timeout } = schema.parse(req.body);
      browserInstance = await getBrowserInstance();
      const page = await browserInstance.newPage();
      await page.setDefaultNavigationTimeout(timeout * 1e3);
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        switch (direction) {
          case "down":
            await page.evaluate((scrollAmount) => {
              window.scrollBy(0, scrollAmount);
            }, amount);
            break;
          case "up":
            await page.evaluate((scrollAmount) => {
              window.scrollBy(0, -scrollAmount);
            }, amount);
            break;
          case "top":
            await page.evaluate(() => {
              window.scrollTo(0, 0);
            });
            break;
          case "bottom":
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight);
            });
            break;
        }
        await storage.logActivity({
          userId: 1,
          activityType: "interaction",
          description: `Scrolled page ${direction}`,
          metadata: { url }
        });
        return res.status(200).json({
          success: true,
          direction
        });
      } catch (error) {
        await storage.logActivity({
          userId: 1,
          activityType: "error",
          description: `Failed to scroll page ${direction}`,
          metadata: { error: error.message }
        });
        return res.status(500).json({
          success: false,
          error: error.message
        });
      } finally {
        await page.close();
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "An unknown error occurred"
      });
    }
  });
  app2.get("/api/activity-logs", async (req, res) => {
    try {
      const logs = await storage.getActivityLogs();
      return res.status(200).json(logs);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve activity logs"
      });
    }
  });
  app2.post("/api/ai/analyze", async (req, res) => {
    const schema = z2.object({
      content: z2.string().min(1, "Content is required"),
      instructions: z2.string().min(1, "Instructions are required")
    });
    try {
      const { content, instructions } = schema.parse(req.body);
      const analysis = await aiService.analyzeContent(content, instructions);
      await storage.logActivity({
        userId: 1,
        // Default user
        activityType: "ai-analysis",
        description: `Analyzed content using DeepSeek AI`,
        metadata: { instructionsLength: instructions.length, contentLength: content.length }
      });
      return res.status(200).json({
        success: true,
        analysis
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "An unknown error occurred during AI analysis"
      });
    }
  });
  app2.post("/api/ai/suggest-actions", async (req, res) => {
    const schema = z2.object({
      url: z2.string().url("Valid URL is required"),
      pageContent: z2.string().min(1, "Page content is required")
    });
    try {
      const { url, pageContent } = schema.parse(req.body);
      const suggestions = await aiService.suggestActions(pageContent, url);
      await storage.logActivity({
        userId: 1,
        activityType: "ai-suggestion",
        description: `Generated action suggestions for ${url}`,
        metadata: { url }
      });
      return res.status(200).json({
        success: true,
        suggestions
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "An unknown error occurred while generating suggestions"
      });
    }
  });
  app2.post("/api/ai/create-plan", async (req, res) => {
    const schema = z2.object({
      task: z2.string().min(1, "Task description is required")
    });
    try {
      const { task } = schema.parse(req.body);
      const plan = await aiService.createTaskPlan(task);
      await storage.logActivity({
        userId: 1,
        activityType: "ai-plan",
        description: `Created task plan for: ${task.substring(0, 50)}${task.length > 50 ? "..." : ""}`,
        metadata: { taskLength: task.length }
      });
      return res.status(200).json({
        success: true,
        plan
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "An unknown error occurred while creating task plan"
      });
    }
  });
  app2.get("/api/extracted-data/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid ID provided"
        });
      }
      const data = await storage.getExtractedDataById(id);
      if (!data) {
        return res.status(404).json({
          success: false,
          error: "Extracted data not found"
        });
      }
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve extracted data"
      });
    }
  });
  app2.get("/api/schedules", async (req, res) => {
    try {
      const userId = 1;
      const schedules2 = await storage.getSchedules(userId);
      return res.status(200).json({
        success: true,
        schedules: schedules2
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve schedules"
      });
    }
  });
  app2.post("/api/schedules", async (req, res) => {
    const schema = z2.object({
      url: z2.string().url("Invalid URL provided"),
      frequency: z2.enum(["once", "hourly", "daily", "weekly", "custom"]),
      startAt: z2.coerce.date(),
      endAt: z2.coerce.date().optional(),
      maxVisits: z2.number().int().min(1).max(1e4).default(100),
      followLinks: z2.boolean().default(false),
      maxDepth: z2.number().int().min(1).max(5).default(2),
      description: z2.string().optional(),
      active: z2.boolean().default(true)
    });
    try {
      const data = schema.parse(req.body);
      const userId = 1;
      const stats = await storage.getVisitStats(userId);
      const remainingVisits = stats.remainingVisits;
      if (remainingVisits < data.maxVisits) {
        return res.status(400).json({
          success: false,
          error: `Visit limit exceeded. You only have ${remainingVisits.toLocaleString()} visits remaining.`
        });
      }
      const schedule = await storage.createSchedule({
        id: Date.now().toString(),
        userId,
        ...data
      });
      await storage.updateVisitStats(userId, {
        remainingVisits: remainingVisits - data.maxVisits
      });
      await storage.logActivity({
        userId,
        activityType: "scheduler",
        description: `Created schedule to visit ${data.url}`,
        metadata: { scheduleId: schedule.id }
      });
      return res.status(201).json({
        success: true,
        schedule
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create schedule"
      });
    }
  });
  app2.patch("/api/schedules/:id", async (req, res) => {
    const schema = z2.object({
      url: z2.string().url("Invalid URL provided").optional(),
      frequency: z2.enum(["once", "hourly", "daily", "weekly", "custom"]).optional(),
      startAt: z2.coerce.date().optional(),
      endAt: z2.coerce.date().optional(),
      maxVisits: z2.number().int().min(1).max(1e4).optional(),
      followLinks: z2.boolean().optional(),
      maxDepth: z2.number().int().min(1).max(5).optional(),
      description: z2.string().optional(),
      active: z2.boolean().optional()
    });
    try {
      const { id } = req.params;
      const data = schema.parse(req.body);
      const userId = 1;
      if (data.maxVisits) {
        const existingSchedule = await db.query.schedules.findFirst({
          where: eq2(schedules.id, id)
        });
        if (existingSchedule && data.maxVisits > existingSchedule.maxVisits) {
          const visitDifference = data.maxVisits - existingSchedule.maxVisits;
          const stats = await storage.getVisitStats(userId);
          if (stats.remainingVisits < visitDifference) {
            return res.status(400).json({
              success: false,
              error: `Visit limit exceeded. You only have ${stats.remainingVisits.toLocaleString()} visits remaining.`
            });
          }
          await storage.updateVisitStats(userId, {
            remainingVisits: stats.remainingVisits - visitDifference
          });
        }
      }
      const updatedSchedule = await storage.updateSchedule(id, data);
      await storage.logActivity({
        userId,
        activityType: "scheduler",
        description: `Updated schedule ${id}`,
        metadata: { scheduleId: id }
      });
      return res.status(200).json({
        success: true,
        schedule: updatedSchedule
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to update schedule"
      });
    }
  });
  app2.delete("/api/schedules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = 1;
      const schedule = await db.query.schedules.findFirst({
        where: eq2(schedules.id, id)
      });
      if (!schedule) {
        return res.status(404).json({
          success: false,
          error: "Schedule not found"
        });
      }
      const deletedSchedule = await storage.deleteSchedule(id);
      if (schedule.active) {
        const stats = await storage.getVisitStats(userId);
        await storage.updateVisitStats(userId, {
          remainingVisits: stats.remainingVisits + schedule.maxVisits
        });
      }
      await storage.logActivity({
        userId,
        activityType: "scheduler",
        description: `Deleted schedule for ${schedule.url}`,
        metadata: { scheduleId: id }
      });
      return res.status(200).json({
        success: true,
        schedule: deletedSchedule
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to delete schedule"
      });
    }
  });
  app2.post("/api/scheduler/control", async (req, res) => {
    const schema = z2.object({
      action: z2.enum(["start", "stop"])
    });
    try {
      const { action } = schema.parse(req.body);
      const userId = 1;
      if (action === "start") {
        await schedulerService.startScheduler();
        await storage.logActivity({
          userId,
          activityType: "scheduler",
          description: "Started scheduler",
          metadata: { action }
        });
        return res.status(200).json({
          success: true,
          message: "Scheduler started successfully"
        });
      } else {
        schedulerService.stopScheduler();
        await storage.logActivity({
          userId,
          activityType: "scheduler",
          description: "Stopped scheduler",
          metadata: { action }
        });
        return res.status(200).json({
          success: true,
          message: "Scheduler stopped successfully"
        });
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to control scheduler"
      });
    }
  });
  app2.get("/api/visit-stats", async (req, res) => {
    try {
      const userId = 1;
      const stats = await storage.getVisitStats(userId);
      return res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve visit stats"
      });
    }
  });
  process.on("exit", async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
  process.on("SIGINT", async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
    process.exit();
  });
  process.on("SIGTERM", async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
    process.exit();
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@db": path.resolve(import.meta.dirname, "db"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
