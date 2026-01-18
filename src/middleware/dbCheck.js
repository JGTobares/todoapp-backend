import { getDbStatus } from "../config/mongo.js"

// Middleware to check if database is connected before processing requests
export const dbCheckMiddleware = (req, res, next) => {
  const dbStatus = getDbStatus()
  
  if (!dbStatus.isConnected) {
    return res.status(503).json({
      success: false,
      error: "Servicio temporalmente no disponible. La base de datos no está conectada",
      database: dbStatus.status
    })
  }
  
  next()
}
