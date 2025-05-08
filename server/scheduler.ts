import { DeepSeekMessage, aiService } from './ai';
import { storage } from './storage';
import { Browser, Page } from 'puppeteer';
import { createBrowserInstance } from './browser';

interface ScheduleConfig {
  id: string;
  url: string;
  frequency: string;
  startAt: Date;
  endAt?: Date;
  maxVisits: number;
  followLinks: boolean;
  maxDepth: number;
  description: string;
  active: boolean;
}

interface VisitStats {
  totalVisits: number;
  visitsBySchedule: Record<string, number>;
  lastVisitTime: Record<string, Date>;
  visitedUrls: Set<string>;
}

class SchedulerService {
  private schedules: ScheduleConfig[] = [];
  private browserInstance: Browser | null = null;
  private isRunning = false;
  private timers: NodeJS.Timeout[] = [];
  private stats: VisitStats = {
    totalVisits: 0,
    visitsBySchedule: {},
    lastVisitTime: {},
    visitedUrls: new Set()
  };
  private visitLimit = 200000;

  constructor() {
    // Load persisted schedules and stats here if needed
  }

  async startScheduler() {
    if (this.isRunning) return;

    try {
      this.browserInstance = await createBrowserInstance();
      this.isRunning = true;

      // Start each schedule
      for (const schedule of this.schedules) {
        if (schedule.active) {
          this.scheduleVisit(schedule);
        }
      }
    } catch (error) {
      console.error('Failed to start scheduler:', error);
      throw error;
    }
  }

  stopScheduler() {
    this.isRunning = false;
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];

    // Close browser
    if (this.browserInstance) {
      this.browserInstance.close().catch(console.error);
      this.browserInstance = null;
    }
  }

  addSchedule(schedule: ScheduleConfig) {
    this.schedules.push(schedule);
    this.stats.visitsBySchedule[schedule.id] = 0;
    this.stats.lastVisitTime[schedule.id] = new Date(0); // Initialize with epoch

    // If scheduler is running, start this schedule immediately
    if (this.isRunning && schedule.active) {
      this.scheduleVisit(schedule);
    }

    return schedule;
  }

  updateSchedule(scheduleId: string, update: Partial<ScheduleConfig>) {
    const scheduleIndex = this.schedules.findIndex(s => s.id === scheduleId);
    
    if (scheduleIndex === -1) {
      throw new Error(`Schedule with ID ${scheduleId} not found`);
    }

    this.schedules[scheduleIndex] = { ...this.schedules[scheduleIndex], ...update };
    return this.schedules[scheduleIndex];
  }

  removeSchedule(scheduleId: string) {
    const scheduleIndex = this.schedules.findIndex(s => s.id === scheduleId);
    
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

  private scheduleVisit(schedule: ScheduleConfig) {
    // Calculate when the next visit should occur
    const now = new Date();
    let nextVisitTime = new Date(schedule.startAt);

    // If start time is in the past, recalculate
    if (nextVisitTime < now) {
      switch (schedule.frequency) {
        case 'once':
          // Just schedule it now
          nextVisitTime = new Date();
          break;

        case 'hourly':
          // Schedule at the next hour
          nextVisitTime = new Date();
          nextVisitTime.setHours(nextVisitTime.getHours() + 1, 0, 0, 0);
          break;

        case 'daily':
          // Schedule for tomorrow, same time
          const originalHour = new Date(schedule.startAt).getHours();
          const originalMinute = new Date(schedule.startAt).getMinutes();
          nextVisitTime = new Date();
          nextVisitTime.setDate(nextVisitTime.getDate() + 1);
          nextVisitTime.setHours(originalHour, originalMinute, 0, 0);
          break;

        case 'weekly':
          // Schedule for next week, same day and time
          nextVisitTime = new Date();
          nextVisitTime.setDate(nextVisitTime.getDate() + 7);
          break;
      }
    }

    // Calculate delay in milliseconds
    const delay = Math.max(0, nextVisitTime.getTime() - now.getTime());

    // Create the timer
    const timer = setTimeout(async () => {
      // Check if we've reached the visit limit
      if (this.stats.totalVisits >= this.visitLimit) {
        console.log(`Visit limit (${this.visitLimit}) reached. Stopping scheduler.`);
        this.stopScheduler();
        return;
      }

      // Check if this schedule is still active
      if (!schedule.active || !this.isRunning) {
        return;
      }

      // Check if we've reached the max visits for this schedule
      if (this.stats.visitsBySchedule[schedule.id] >= schedule.maxVisits) {
        console.log(`Max visits (${schedule.maxVisits}) reached for schedule ${schedule.id}`);
        return;
      }

      // Check if the endAt date has passed
      if (schedule.endAt && new Date() > new Date(schedule.endAt)) {
        console.log(`End date reached for schedule ${schedule.id}`);
        return;
      }

      try {
        // Visit the URL
        await this.visitUrl(schedule);

        // Update stats
        this.stats.totalVisits++;
        this.stats.visitsBySchedule[schedule.id]++;
        this.stats.lastVisitTime[schedule.id] = new Date();
        this.stats.visitedUrls.add(schedule.url);

        // Log activity
        await storage.logActivity({
          userId: 1, // Default user
          activityType: 'scheduled-visit',
          description: `Scheduled visit to ${schedule.url}`,
          metadata: { scheduleId: schedule.id }
        });

        // Reschedule the next visit (except for 'once' frequency)
        if (schedule.frequency !== 'once') {
          this.scheduleVisit(schedule);
        }
      } catch (error) {
        console.error(`Error during scheduled visit to ${schedule.url}:`, error);
        
        // Log error
        await storage.logActivity({
          userId: 1, // Default user
          activityType: 'error',
          description: `Error during scheduled visit to ${schedule.url}`,
          metadata: { error: String(error), scheduleId: schedule.id }
        });

        // Reschedule the next visit (except for 'once' frequency)
        if (schedule.frequency !== 'once') {
          this.scheduleVisit(schedule);
        }
      }
    }, delay);

    this.timers.push(timer);
  }

  private async visitUrl(schedule: ScheduleConfig) {
    if (!this.browserInstance) {
      this.browserInstance = await createBrowserInstance();
    }

    const page = await this.browserInstance.newPage();
    await page.setDefaultNavigationTimeout(30 * 1000); // 30 seconds

    try {
      // Log navigation start
      await storage.logNavigation({
        userId: 1, // Default user
        url: schedule.url,
        title: 'Scheduled visit'
      });

      // Navigate to the URL
      await page.goto(schedule.url, { waitUntil: 'domcontentloaded' });

      // Wait a bit for the page to render
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Capture the page content
      const pageContent = await page.evaluate(() => document.body.innerText);
      const pageTitle = await page.title();

      // Use DeepSeek AI to analyze the page and suggest next actions
      if (schedule.followLinks) {
        await this.processLinks(page, schedule, 1); // Start at depth 1
      }

      // Use AI to analyze the page content
      await this.analyzePageWithAI(pageContent, schedule.url, pageTitle);

      return true;
    } catch (error) {
      console.error(`Error visiting ${schedule.url}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private async processLinks(page: Page, schedule: ScheduleConfig, currentDepth: number) {
    if (currentDepth > schedule.maxDepth || !this.isRunning) {
      return;
    }

    try {
      // Extract all links on the page
      const links = await page.evaluate(() => {
        const anchorElements = Array.from(document.querySelectorAll('a[href]'));
        return anchorElements
          .map(anchor => (anchor as HTMLAnchorElement).href)
          .filter(href => 
            href && 
            href.startsWith('http') && 
            !href.includes('#') && // Skip anchors
            new URL(href).hostname === window.location.hostname // Same domain only
          );
      });

      // Deduplicate links
      const uniqueLinksSet = new Set(links);
      const uniqueLinks = Array.from(uniqueLinksSet);

      // Use DeepSeek AI to select the most relevant links
      const baseUrl = new URL(schedule.url).hostname;
      const linksForAI = uniqueLinks.slice(0, 10); // Limit to 10 links for AI analysis

      // Ask AI to prioritize links
      const messages: DeepSeekMessage[] = [
        {
          role: 'system',
          content: `You are an AI that helps with web navigation. You need to analyze URLs and prioritize which ones are likely to be most relevant and information-rich based on their paths and structure.`
        },
        {
          role: 'user',
          content: `I'm browsing ${baseUrl} and found these links. Please rank them by potential relevance and information value, with the most valuable first. Only respond with the ranked list of URLs, one per line:\n${linksForAI.join('\n')}`
        }
      ];

      const aiResponse = await aiService.generateResponse(messages, { temperature: 0.7 });
      console.log('AI ranked links:', aiResponse);

      // Extract URLs from the AI response
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const matches = aiResponse.match(urlRegex) || [];
      const prioritizedLinks = matches.length > 0 ? matches : uniqueLinks.slice(0, 3);

      // Visit the top 3 links or fewer
      const linksToVisit = prioritizedLinks.slice(0, 3);
      
      for (const link of linksToVisit) {
        // Check if we're still under the visit limit
        if (this.stats.totalVisits >= this.visitLimit) {
          console.log(`Visit limit (${this.visitLimit}) reached. Stopping further link processing.`);
          return;
        }

        // Check if we're still running
        if (!this.isRunning) {
          return;
        }

        try {
          // Navigate to the link
          await page.goto(link, { waitUntil: 'domcontentloaded' });
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait a bit

          // Update stats
          this.stats.totalVisits++;
          this.stats.visitsBySchedule[schedule.id]++;
          this.stats.visitedUrls.add(link);

          // Log the visit
          await storage.logNavigation({
            userId: 1,
            url: link,
            title: await page.title()
          });

          // Process links at the next depth recursively
          if (currentDepth < schedule.maxDepth) {
            await this.processLinks(page, schedule, currentDepth + 1);
          }
        } catch (error) {
          console.error(`Error visiting link ${link}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing links:', error);
    }
  }

  private async analyzePageWithAI(pageContent: string, url: string, title: string) {
    try {
      // Truncate page content if it's too long (DeepSeek has token limits)
      const truncatedContent = pageContent.substring(0, 2000) + 
        (pageContent.length > 2000 ? '... (content truncated)' : '');

      // Ask DeepSeek AI to analyze the page
      const messages: DeepSeekMessage[] = [
        {
          role: 'system',
          content: `You are an AI assistant that analyzes web pages. Extract key information and summarize the main content.`
        },
        {
          role: 'user',
          content: `Please analyze this webpage from ${url} titled "${title}" and provide a brief summary of its key information and purpose:\n\n${truncatedContent}`
        }
      ];

      const analysis = await aiService.generateResponse(messages, { temperature: 0.3 });
      
      // Save the analysis to the database
      await storage.saveExtractedData({
        userId: 1,
        sourceUrl: url,
        selector: 'page',
        data: { analysis, title, url }
      });

      return analysis;
    } catch (error) {
      console.error(`Error analyzing page with AI:`, error);
      return null;
    }
  }
}

export const schedulerService = new SchedulerService();
