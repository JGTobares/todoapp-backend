import { config } from "dotenv"
config()

// Centralized configuration
export const appConfig = {
  // Server
  port: process.env.PORT || 1111,
  nodeEnv: process.env.NODE_ENV || "development",
  
  // Database - Automatic selection based on environment
  // - If USE_ATLAS=true, force Atlas even in development
  // - Production: Use Atlas (remote) if available, fallback to local
  // - Development: Use local if available, fallback to Atlas
  // If NODE_ENV is not set, defaults to development (local)
  dbUri: (() => {
    const forceAtlas = process.env.USE_ATLAS === "true"
    const isProduction = process.env.NODE_ENV === "production"
    
    if (forceAtlas && process.env.URI_DB_REMOTE) {
      return process.env.URI_DB_REMOTE
    } else if (isProduction) {
      return process.env.URI_DB_REMOTE || process.env.URI_DB
    } else {
      return process.env.URI_DB || process.env.URI_DB_REMOTE
    }
  })(),
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "24h"
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: process.env.CORS_CREDENTIALS === "true"
  },
  
  // Email
  email: {
    admin: process.env.ADMIN_EMAIL,
    from: process.env.EMAIL_FROM || "noreply@example.com",
    googleAppPassword: process.env.PASS_GOOGLE_APP
  },
  
  // Rate Limiting - More lenient in development
  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === "production" ? 10 : 50 // More lenient in development
    },
    strict: {
      windowMs: 15 * 60 * 1000,
      max: process.env.NODE_ENV === "production" ? 5 : 30 // More lenient in development
    },
    api: {
      windowMs: 15 * 60 * 1000,
      max: process.env.NODE_ENV === "production" ? 100 : 500 // More lenient in development
    }
  },
  
  // MongoDB Connection Options
  mongoOptions: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
    w: "majority"
  }
}
