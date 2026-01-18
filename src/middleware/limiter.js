import rateLimit from "express-rate-limit"
import { appConfig } from "../config/config.js"
import { logger } from "../utils/logger.js"

const isDevelopment = process.env.NODE_ENV !== "production"

// Helper to get rate limit config based on environment
const getRateLimitConfig = (type) => {
  const config = appConfig.rateLimit[type]
  
  return {
    windowMs: config.windowMs,
    // In development, use very high limits (effectively unlimited for testing)
    limit: isDevelopment ? 10000 : config.max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false // Count all requests
  }
}

// General rate limiter for auth routes (more restrictive)
export const authLimiter = rateLimit({
  ...getRateLimitConfig("auth"),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Demasiadas peticiones desde esta IP, por favor intenta más tarde"
    })
  }
})

// More restrictive limiter for login/register
// Store limiter instance to allow resetting on successful login
// In development, uses very high limits (10000) effectively disabling rate limiting
export const strictLimiter = rateLimit({
  ...getRateLimitConfig("strict"),
  skipSuccessfulRequests: false, // Count all requests
  handler: (req, res) => {
    // In development, this should rarely trigger due to high limit
    // But if it does, we still block it
    const retryAfter = Math.ceil(appConfig.rateLimit.strict.windowMs / 1000 / 60) // minutes
    const retryText = retryAfter === 1 ? "1 minuto" : retryAfter < 60 ? `${retryAfter} minutos` : `${Math.ceil(retryAfter / 60)} hora${Math.ceil(retryAfter / 60) > 1 ? 's' : ''}`
    
    res.status(429).json({
      success: false,
      error: "Demasiados intentos de registro",
      message: `Has excedido el límite de registros. Intenta de nuevo más tarde.`,
      retryAfter: retryText,
      timestamp: new Date().toISOString()
    })
  }
})

// Function to reset rate limiter for a specific IP
// Called after successful login to allow more registration attempts
export const resetRateLimit = (req) => {
  try {
    const key = strictLimiter.keyGenerator(req)
    
    // Try to reset using the store's methods
    if (strictLimiter.store) {
      // Method 1: Delete the key (if supported) - Most reliable
      if (typeof strictLimiter.store.delete === 'function') {
        strictLimiter.store.delete(key, () => {
          logger.log("✅ [RATE LIMIT] Contador reseteado para IP:", req.ip)
        })
        return
      }
      
      // Method 2: Reset key (if supported)
      if (typeof strictLimiter.store.resetKey === 'function') {
        strictLimiter.store.resetKey(key)
        logger.log("✅ [RATE LIMIT] Contador reseteado para IP:", req.ip)
        return
      }
      
      // Method 3: Decrement to zero (if we can get current count)
      if (typeof strictLimiter.store.get === 'function' && typeof strictLimiter.store.decrement === 'function') {
        strictLimiter.store.get(key, (err, value) => {
          if (!err && value && value.totalHits > 0) {
            // Decrement all hits
            for (let i = 0; i < value.totalHits; i++) {
              strictLimiter.store.decrement(key)
            }
            logger.log("✅ [RATE LIMIT] Contador reseteado para IP:", req.ip)
          }
        })
        return
      }
    }
    
    if (isDevelopment) {
      logger.log("ℹ️ [RATE LIMIT] En desarrollo, límites muy altos (10000 intentos)")
    } else {
      logger.log("ℹ️ [RATE LIMIT] Store no soporta reset directo, se reseteará automáticamente después del tiempo de ventana")
    }
  } catch (error) {
    logger.warn("⚠️ [RATE LIMIT] No se pudo resetear:", error.message)
  }
}

// Less restrictive limiter for general API routes
export const apiLimiter = rateLimit({
  ...getRateLimitConfig("api"),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Demasiadas peticiones, por favor intenta más tarde"
    })
  }
})

export { authLimiter as limiter }
