import mongoose from "mongoose"
import { appConfig } from "./config.js"
import { logger } from "../utils/logger.js"

let isConnected = false
let retryCount = 0
const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds

const connectDb = async (URI_DB, retries = 0) => {
  try {
    if (isConnected && mongoose.connection.readyState === 1) {
      logger.log("✅ MongoDB ya está conectado")
      return
    }

    await mongoose.connect(URI_DB, appConfig.mongoOptions)

    isConnected = true
    retryCount = 0
    
    // Log connection details
    const isAtlas = URI_DB.includes('mongodb+srv://')
    const dbType = isAtlas ? 'MongoDB Atlas' : 'MongoDB Local'
    logger.log("✅ Conectado a MongoDB con éxito")
    logger.log(`🔗 Tipo: ${dbType}`)
    logger.log(`📊 Base de datos: ${mongoose.connection.name}`)
    logger.log(`🌐 Host: ${mongoose.connection.host || 'N/A'}`)
    logger.log(`🔌 Puerto: ${mongoose.connection.port || 'N/A'}`)

    // Setup event handlers
    setupEventHandlers()
  } catch (error) {
    console.error(`❌ Error al conectarse a MongoDB (intento ${retries + 1}/${MAX_RETRIES}):`, error.message)
    isConnected = false

    // Retry logic
    if (retries < MAX_RETRIES) {
      logger.log(`🔄 Reintentando conexión en ${RETRY_DELAY / 1000} segundos...`)
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
      return connectDb(URI_DB, retries + 1)
    }

    throw error
  }
}

const setupEventHandlers = () => {
  // Handle connection events
  mongoose.connection.on("connected", () => {
    logger.log("✅ MongoDB conectado")
    isConnected = true
    retryCount = 0
  })

  mongoose.connection.on("error", (err) => {
    console.error("❌ Error en MongoDB:", err.message)
    isConnected = false
  })

  mongoose.connection.on("disconnected", () => {
    logger.log("⚠️ MongoDB desconectado")
    isConnected = false
    
    // Attempt to reconnect if not manually disconnected
    if (retryCount < MAX_RETRIES) {
      retryCount++
      logger.log(`🔄 Intentando reconectar... (${retryCount}/${MAX_RETRIES})`)
      setTimeout(() => {
        if (mongoose.connection.readyState === 0) {
          connectDb(process.env.NODE_ENV === "production" 
            ? process.env.URI_DB_REMOTE 
            : process.env.URI_DB, 0)
        }
      }, RETRY_DELAY)
    }
  })

  // Handle process termination
  const gracefulShutdown = async (signal) => {
    logger.log(`\n${signal} recibido. Cerrando conexión a MongoDB...`)
    try {
      await mongoose.connection.close()
      logger.log("✅ MongoDB desconectado correctamente")
      process.exit(0)
    } catch (error) {
      console.error("❌ Error al cerrar conexión:", error.message)
      process.exit(1)
    }
  }

  process.on("SIGINT", () => gracefulShutdown("SIGINT"))
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
}

const getDbStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  }

  return {
    state: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState],
    isConnected: isConnected && mongoose.connection.readyState === 1,
    name: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
    port: mongoose.connection.port || null
  }
}

const disconnectDb = async () => {
  try {
    if (isConnected) {
      await mongoose.connection.close()
      isConnected = false
      logger.log("✅ MongoDB desconectado correctamente")
    }
  } catch (error) {
    console.error("❌ Error al desconectar MongoDB:", error.message)
  }
}

export { connectDb, getDbStatus, disconnectDb }
