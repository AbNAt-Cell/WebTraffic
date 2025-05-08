import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { Browser, Page } from "puppeteer";
import { z } from "zod";
import { db } from "@db";
import { activityLog, extractedData, navigationHistory, schedules } from "@shared/schema";
import { eq } from "drizzle-orm";
import { schedulerService } from "./scheduler";
import { createBrowserInstance } from "./browser";
import { aiService } from "./ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize browser instance at startup
  let browserInstance: Browser | null = null;
  
  // Helper function to get browser instance
  const getBrowserInstance = async (): Promise<Browser> => {
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
  
  // Endpoint to navigate to a URL
  app.post("/api/navigate", async (req: Request, res: Response) => {
    const schema = z.object({
      url: z.string().url("Invalid URL provided"),
      timeout: z.number().int().min(5).max(120).optional().default(30),
    });
    
    try {
      const { url, timeout } = schema.parse(req.body);
      
      // Get browser instance
      browserInstance = await getBrowserInstance();
      
      const page = await browserInstance.newPage();
      await page.setDefaultNavigationTimeout(timeout * 1000);
      
      // Log the navigation attempt
      const navigationEntry = await storage.logNavigation({
        url,
        userId: 1, // Use default user for now
        success: true,
      });
      
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded" });
        const title = await page.title();
        
        // Log activity
        await storage.logActivity({
          userId: 1, // Default user
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
      } catch (error: any) {
        // Update navigation entry to indicate failure
        await db.update(navigationHistory)
          .set({ success: false })
          .where(eq(navigationHistory.id, navigationEntry.id))
          .execute();
        
        // Log error activity
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
  
  // Endpoint to click on an element
  app.post("/api/click", async (req: Request, res: Response) => {
    const schema = z.object({
      url: z.string().url("Invalid URL provided"),
      selector: z.string().min(1, "Selector is required"),
      waitForNavigation: z.boolean().optional().default(true),
      timeout: z.number().int().min(5).max(120).optional().default(30),
    });
    
    try {
      const { url, selector, waitForNavigation, timeout } = schema.parse(req.body);
      
      // Get browser instance
      browserInstance = await getBrowserInstance();
      
      const page = await browserInstance.newPage();
      await page.setDefaultNavigationTimeout(timeout * 1000);
      
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        
        // Wait for selector to be visible
        await page.waitForSelector(selector, { visible: true, timeout: timeout * 1000 });
        
        // Execute click with optional navigation wait
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
        
        // Log activity
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
      } catch (error: any) {
        // Log error activity
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
  
  // Endpoint to type text into an element
  app.post("/api/type", async (req: Request, res: Response) => {
    const schema = z.object({
      url: z.string().url("Invalid URL provided"),
      selector: z.string().min(1, "Selector is required"),
      text: z.string().min(1, "Text is required"),
      timeout: z.number().int().min(5).max(120).optional().default(30),
    });
    
    try {
      const { url, selector, text, timeout } = schema.parse(req.body);
      
      // Get browser instance
      browserInstance = await getBrowserInstance();
      
      const page = await browserInstance.newPage();
      await page.setDefaultNavigationTimeout(timeout * 1000);
      
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        
        // Wait for selector to be visible
        await page.waitForSelector(selector, { visible: true, timeout: timeout * 1000 });
        
        // Clear the input field first
        await page.evaluate((sel) => {
          document.querySelector(sel)?.setAttribute('value', '');
        }, selector);
        
        // Type the text
        await page.type(selector, text);
        
        // Log activity
        await storage.logActivity({
          userId: 1,
          activityType: "interaction",
          description: `Typed text into element: ${selector}`,
          metadata: { text, url }
        });
        
        return res.status(200).json({
          success: true,
          selector,
          text
        });
      } catch (error: any) {
        // Log error activity
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
  
  // Endpoint to extract data from elements
  app.post("/api/extract", async (req: Request, res: Response) => {
    const schema = z.object({
      url: z.string().url("Invalid URL provided"),
      selector: z.string().min(1, "Selector is required"),
      timeout: z.number().int().min(5).max(120).optional().default(30),
      dataAttributes: z.array(z.string()).optional(),
    });
    
    try {
      const { url, selector, timeout, dataAttributes = [] } = schema.parse(req.body);
      
      // Get browser instance
      browserInstance = await getBrowserInstance();
      
      const page = await browserInstance.newPage();
      await page.setDefaultNavigationTimeout(timeout * 1000);
      
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        
        // Wait for selector to be present
        await page.waitForSelector(selector, { timeout: timeout * 1000 });
        
        // Extract data from the selected elements
        const extractedItems = await page.evaluate((sel, attrs) => {
          const elements = Array.from(document.querySelectorAll(sel));
          return elements.map(el => {
            const item: any = {
              innerText: el.textContent?.trim(),
              html: el.innerHTML
            };
            
            // Extract requested attributes if present
            if (attrs.length > 0) {
              attrs.forEach(attr => {
                item[attr] = (el as HTMLElement).getAttribute(attr);
              });
            }
            
            // Extract href from anchor tags
            if (el.tagName === 'A') {
              item.href = (el as HTMLAnchorElement).href;
            }
            
            // Extract src from image tags
            if (el.tagName === 'IMG') {
              item.src = (el as HTMLImageElement).src;
              item.alt = (el as HTMLImageElement).alt;
            }
            
            return item;
          });
        }, selector, dataAttributes);
        
        // Store extracted data
        const savedExtraction = await storage.saveExtractedData({
          userId: 1,
          sourceUrl: url,
          selector,
          data: extractedItems
        });
        
        // Log activity
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
      } catch (error: any) {
        // Log error activity
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
  
  // Endpoint to scroll the page
  app.post("/api/scroll", async (req: Request, res: Response) => {
    const schema = z.object({
      url: z.string().url("Invalid URL provided"),
      direction: z.enum(["up", "down", "top", "bottom"]),
      amount: z.number().int().optional().default(500),
      timeout: z.number().int().min(5).max(120).optional().default(30),
    });
    
    try {
      const { url, direction, amount, timeout } = schema.parse(req.body);
      
      // Get browser instance
      browserInstance = await getBrowserInstance();
      
      const page = await browserInstance.newPage();
      await page.setDefaultNavigationTimeout(timeout * 1000);
      
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        
        // Execute scrolling based on direction
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
        
        // Log activity
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
      } catch (error: any) {
        // Log error activity
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
  
  // Endpoint to get activity logs
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const logs = await storage.getActivityLogs();
      return res.status(200).json(logs);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve activity logs"
      });
    }
  });
  
  // DeepSeek AI endpoints
  // Endpoint to analyze content with DeepSeek AI
  app.post("/api/ai/analyze", async (req: Request, res: Response) => {
    const schema = z.object({
      content: z.string().min(1, "Content is required"),
      instructions: z.string().min(1, "Instructions are required"),
    });
    
    try {
      const { content, instructions } = schema.parse(req.body);
      
      const analysis = await aiService.analyzeContent(content, instructions);
      
      // Log activity
      await storage.logActivity({
        userId: 1, // Default user
        activityType: "ai-analysis",
        description: `Analyzed content using DeepSeek AI`,
        metadata: { instructionsLength: instructions.length, contentLength: content.length }
      });
      
      return res.status(200).json({
        success: true,
        analysis
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
  
  // Endpoint to suggest actions with DeepSeek AI
  app.post("/api/ai/suggest-actions", async (req: Request, res: Response) => {
    const schema = z.object({
      url: z.string().url("Valid URL is required"),
      pageContent: z.string().min(1, "Page content is required"),
    });
    
    try {
      const { url, pageContent } = schema.parse(req.body);
      
      const suggestions = await aiService.suggestActions(pageContent, url);
      
      // Log activity
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
  
  // Endpoint to create task plan with DeepSeek AI
  app.post("/api/ai/create-plan", async (req: Request, res: Response) => {
    const schema = z.object({
      task: z.string().min(1, "Task description is required"),
    });
    
    try {
      const { task } = schema.parse(req.body);
      
      const plan = await aiService.createTaskPlan(task);
      
      // Log activity
      await storage.logActivity({
        userId: 1,
        activityType: "ai-plan",
        description: `Created task plan for: ${task.substring(0, 50)}${task.length > 50 ? '...' : ''}`,
        metadata: { taskLength: task.length }
      });
      
      return res.status(200).json({
        success: true,
        plan
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
  
  // Endpoint to get extracted data by ID
  app.get("/api/extracted-data/:id", async (req, res) => {
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
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve extracted data"
      });
    }
  });
  
  // Scheduler endpoints
  // Get all schedules
  app.get("/api/schedules", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Default user for now
      const schedules = await storage.getSchedules(userId);
      
      return res.status(200).json({
        success: true,
        schedules
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve schedules"
      });
    }
  });
  
  // Create a schedule
  app.post("/api/schedules", async (req: Request, res: Response) => {
    const schema = z.object({
      url: z.string().url("Invalid URL provided"),
      frequency: z.enum(["once", "hourly", "daily", "weekly", "custom"]),
      startAt: z.coerce.date(),
      endAt: z.coerce.date().optional(),
      maxVisits: z.number().int().min(1).max(10000).default(100),
      followLinks: z.boolean().default(false),
      maxDepth: z.number().int().min(1).max(5).default(2),
      description: z.string().optional(),
      active: z.boolean().default(true)
    });
    
    try {
      const data = schema.parse(req.body);
      const userId = 1; // Default user for now
      
      // Check visit stats to ensure we're not exceeding limits
      const stats = await storage.getVisitStats(userId);
      const remainingVisits = stats.remainingVisits;
      
      if (remainingVisits < data.maxVisits) {
        return res.status(400).json({
          success: false,
          error: `Visit limit exceeded. You only have ${remainingVisits.toLocaleString()} visits remaining.`
        });
      }
      
      // Create schedule
      const schedule = await storage.createSchedule({
        id: Date.now().toString(),
        userId,
        ...data
      });
      
      // Update remainingVisits
      await storage.updateVisitStats(userId, {
        remainingVisits: remainingVisits - data.maxVisits
      });
      
      // Log activity
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
  
  // Update a schedule
  app.patch("/api/schedules/:id", async (req: Request, res: Response) => {
    const schema = z.object({
      url: z.string().url("Invalid URL provided").optional(),
      frequency: z.enum(["once", "hourly", "daily", "weekly", "custom"]).optional(),
      startAt: z.coerce.date().optional(),
      endAt: z.coerce.date().optional(),
      maxVisits: z.number().int().min(1).max(10000).optional(),
      followLinks: z.boolean().optional(),
      maxDepth: z.number().int().min(1).max(5).optional(),
      description: z.string().optional(),
      active: z.boolean().optional()
    });
    
    try {
      const { id } = req.params;
      const data = schema.parse(req.body);
      const userId = 1; // Default user for now
      
      // If maxVisits is increasing, check visit limits
      if (data.maxVisits) {
        const existingSchedule = await db.query.schedules.findFirst({
          where: eq(schedules.id, id)
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
          
          // Update remaining visits
          await storage.updateVisitStats(userId, {
            remainingVisits: stats.remainingVisits - visitDifference
          });
        }
      }
      
      // Update schedule
      const updatedSchedule = await storage.updateSchedule(id, data);
      
      // Log activity
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
  
  // Delete a schedule
  app.delete("/api/schedules/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = 1; // Default user for now
      
      // Get the schedule before deleting to adjust visit counts
      const schedule = await db.query.schedules.findFirst({
        where: eq(schedules.id, id)
      });
      
      if (!schedule) {
        return res.status(404).json({
          success: false,
          error: "Schedule not found"
        });
      }
      
      // Delete the schedule
      const deletedSchedule = await storage.deleteSchedule(id);
      
      // Add the visits back to the remaining count if the schedule was active
      if (schedule.active) {
        const stats = await storage.getVisitStats(userId);
        await storage.updateVisitStats(userId, {
          remainingVisits: stats.remainingVisits + schedule.maxVisits
        });
      }
      
      // Log activity
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
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to delete schedule"
      });
    }
  });
  
  // Start or stop the scheduler
  app.post("/api/scheduler/control", async (req: Request, res: Response) => {
    const schema = z.object({
      action: z.enum(["start", "stop"])
    });
    
    try {
      const { action } = schema.parse(req.body);
      const userId = 1; // Default user for now
      
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
  
  // Get visit stats
  app.get("/api/visit-stats", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Default user for now
      const stats = await storage.getVisitStats(userId);
      
      return res.status(200).json({
        success: true,
        stats
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve visit stats"
      });
    }
  });
  
  // API cleanup on process exit
  process.on('exit', async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
  
  process.on('SIGINT', async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
    process.exit();
  });
  
  process.on('SIGTERM', async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
    process.exit();
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
