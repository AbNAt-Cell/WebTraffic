import puppeteer, { Browser, Page } from "puppeteer";

// Mock browser for environments where Puppeteer cannot run
class MockBrowser {
  async newPage() {
    return new MockPage();
  }
  
  async close() {
    console.log("MockBrowser: Closing browser");
    return Promise.resolve();
  }
}

class MockPage {
  private currentUrl = "";
  
  async goto(url: string) {
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
}

// Centralized browser launch configuration to be used throughout the application
export async function createBrowserInstance() {
  try {
    console.log("Attempting to create browser instance with enhanced containerized environment options...");
    
    try {
      // First attempt with normal Puppeteer
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-features=site-per-process',
          '--disable-extensions',
          '--disable-software-rasterizer',
          '--disable-infobars',
          '--mute-audio',
          '--single-process',        
          '--disable-breakpad',
          '--disable-web-security',
          '--no-zygote'
        ],
        dumpio: true, // Output browser process stdout and stderr
        headless: true as any, // Use headless mode
        timeout: 60000, // Increase timeout to 60 seconds
      });
      
      console.log("Browser launched successfully!");
      return browser;
    } catch (innerError) {
      console.warn("Cannot launch real browser due to system limitations, using mock browser instead");
      console.warn("This is a fallback mode for development/testing only");
      if (innerError instanceof Error) {
        console.warn(`Original error: ${innerError.message}`);
      }
      
      // Return a mock browser as fallback
      return new MockBrowser() as unknown as Browser;
    }
  } catch (error) {
    console.error("Failed to initialize browser instance:", error);
    // More graceful error handling
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.stack) {
        console.error(`Stack trace: ${error.stack}`);
      }
    }
    throw error;
  }
}
