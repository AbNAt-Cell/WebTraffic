import { db } from "./index";
import { hash } from "bcrypt";
import * as schema from "@shared/schema";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Create default user if not exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "default")
    });

    if (!existingUser) {
      console.log("Creating default user...");
      const hashedPassword = await hash("password", 10);
      const [user] = await db.insert(schema.users).values({
        username: "default",
        password: hashedPassword
      }).returning();
      
      console.log(`Created default user with ID: ${user.id}`);
      
      // Create default agent settings for the user
      await db.insert(schema.agentSettings).values({
        userId: user.id,
        behavior: "standard",
        navigationTimeout: 30,
        userAgent: "Chrome (Windows)",
        enableJavascript: true,
        acceptCookies: true,
        disableImages: false
      });
      
      console.log("Created default agent settings");
      
      // Create initial visit stats for the user
      await db.insert(schema.visitStats).values({
        userId: user.id,
        totalVisits: 0,
        remainingVisits: 200000,
        uniqueUrls: 0
      });
      
      console.log("Created initial visit stats");
    } else {
      console.log("Default user already exists, skipping creation");
      
      // Check if visit stats exist for the user
      const existingStats = await db.query.visitStats.findFirst({
        where: (stats, { eq }) => eq(stats.userId, existingUser.id)
      });
      
      if (!existingStats) {
        // Create initial visit stats for existing user
        await db.insert(schema.visitStats).values({
          userId: existingUser.id,
          totalVisits: 0,
          remainingVisits: 200000,
          uniqueUrls: 0
        });
        
        console.log("Created initial visit stats for existing user");
      }
    }
    
    console.log("Seed completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
