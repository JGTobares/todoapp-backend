import express from "express"
import cors from "cors"
import morgan from "morgan"
import compression from "compression"
import helmet from "helmet"
import { config } from "dotenv"
import { connectDb, getDbStatus } from "./config/mongo.js"
import { taskRouter } from "./routes/taskRouter.js"
import { authRouter } from "./routes/authRouter.js"
import { authMiddleware } from "./middleware/auth.js"
import { dbCheckMiddleware } from "./middleware/dbCheck.js"
import { logger as fileLogger } from "./middleware/logger.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { validateEnv } from "./utils/envValidator.js"
import { appConfig } from "./config/config.js"
import { logger } from "./utils/logger.js"

// Load environment variables
config()

// Validate environment variables
validateEnv()

// Database URI - Automatic selection based on environment
// Logic:
// - If URI_DB_REMOTE is set, use it (allows forcing Atlas even in development)
// - Production (NODE_ENV=production): Prefers URI_DB_REMOTE, falls back to URI_DB
// - Development/Other: Prefers URI_DB (local), falls back to URI_DB_REMOTE if local not available
// - Force Atlas: Set USE_ATLAS=true to force Atlas even in development
const isProduction = process.env.NODE_ENV === "production"
const forceAtlas = process.env.USE_ATLAS === "true"

let URI_DB
if (forceAtlas && process.env.URI_DB_REMOTE) {
  // Force Atlas even in development
  URI_DB = process.env.URI_DB_REMOTE
  logger.log("🔧 [CONFIG] Forzando uso de MongoDB Atlas (USE_ATLAS=true)")
} else if (isProduction) {
  // Production: Prefer Atlas
  URI_DB = process.env.URI_DB_REMOTE || process.env.URI_DB
} else {
  // Development: Prefer Local, fallback to Atlas
  URI_DB = process.env.URI_DB || process.env.URI_DB_REMOTE
}

// Debug: Log which URI is being used
const dbType = URI_DB?.includes("mongodb+srv://") ? "Atlas (Remoto)" : "Local"
logger.log(`🔍 Entorno: ${process.env.NODE_ENV || "development"}`)
logger.log(`🔍 Tipo de DB: ${dbType}`)
logger.log(`🔍 URI seleccionada: ${URI_DB ? URI_DB.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : "❌ Ninguna"}`)

// Create Express app
const server = express()

// Security middleware
server.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production",
  crossOriginEmbedderPolicy: false
})) // Set various HTTP headers for security

// CORS configuration
const corsOptions = {
  origin: appConfig.cors.origin === "*" 
    ? true 
    : appConfig.cors.origin.split(",").map(origin => origin.trim()),
  credentials: appConfig.cors.credentials,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}
server.use(cors(corsOptions))

// Note: express-mongo-sanitize removed due to Express 5 compatibility issues
// Mongoose already provides protection against NoSQL injection
// Additional validation is handled by express-validator in routes

// Body parsing middleware
server.use(express.json({ limit: "10mb" }))
server.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Compression middleware
server.use(compression())

// Custom token for request body (only for POST/PUT/PATCH)
morgan.token("body", (req) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    try {
      return JSON.stringify(req.body).substring(0, 300) // Limit to 300 chars
    } catch {
      return "-"
    }
  }
  return "-"
})

// Logging middleware - Console logs (always enabled for debugging)
const consoleFormat = process.env.NODE_ENV === "development"
  ? ":method :url :status :response-time ms - :res[content-length] bytes\n  📦 Body: :body"
  : ":method :url :status :response-time ms - :res[content-length] bytes"

server.use(morgan(consoleFormat, {
  stream: {
    write: (message) => {
      logger.log("📥", message.trim())
    }
  }
}))

// File logging (async, non-blocking)
server.use(morgan(fileLogger))

// Health check endpoint
server.get("/", (req, res) => {
  const db = getDbStatus()
  const uptime = process.uptime()

  if (db.isConnected) {
    return res.status(200).json({
      success: true,
      message: "API Tasks funcionando correctamente",
      database: {
        status: db.status,
        state: db.state,
        name: db.name || "N/A"
      },
      server: {
        uptime: `${Math.floor(uptime)}s`,
        environment: appConfig.nodeEnv,
        timestamp: new Date().toISOString()
      }
    })
  }

  return res.status(503).json({
    success: false,
    message: "API disponible pero la base de datos no está conectada",
    database: {
      status: db.status,
      state: db.state
    },
    server: {
      uptime: `${Math.floor(uptime)}s`,
      environment: appConfig.nodeEnv,
      timestamp: new Date().toISOString()
    }
  })
})

// API routes
server.use("/auth", authRouter)
server.use("/tasks", authMiddleware, dbCheckMiddleware, taskRouter)

// 404 handler
server.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Ruta no encontrada",
      path: req.originalUrl,
      method: req.method
    }
  })
})

// Error handling middleware (must be last)
server.use(errorHandler)

// Start server
const startServer = async () => {
  try {
    // Connect to database first (uses automatic URI selection)
    await connectDb(URI_DB)

    // Start listening
    server.listen(appConfig.port, () => {
      logger.log(`✅ Servidor conectado en http://localhost:${appConfig.port}`)
      logger.log(`📊 Entorno: ${appConfig.nodeEnv}`)
      logger.log(`🔒 JWT expira en: ${appConfig.jwt.expiresIn}`)
    })
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error.message)
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err)
  process.exit(1)
})

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err)
  process.exit(1)
})

// Start the server
startServer()
