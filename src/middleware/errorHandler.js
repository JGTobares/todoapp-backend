// Centralized error handling middleware
import { AppError } from "../utils/errors.js"

const errorHandler = (err, req, res, next) => {
  // Log error details to console
  console.error("❌ [ERROR]", {
    method: req.method,
    url: req.url,
    status: err.statusCode || 500,
    message: err.message || "Error interno del servidor",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  })
  
  let statusCode = err.statusCode || 500
  let message = err.message || "Error interno del servidor"
  let details = null

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    if (err.details) {
      details = err.details
    }
  }
  // Handle MongoDB duplicate key error
  else if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyPattern)[0]
    message = `El ${field} ya está en uso`
    details = { field, value: err.keyValue[field] }
  }
  // Handle MongoDB validation errors
  else if (err.name === "ValidationError" && err.errors) {
    statusCode = 400
    message = "Error de validación"
    details = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message
    }))
  }
  // Handle MongoDB cast errors (invalid ObjectId)
  else if (err.name === "CastError") {
    statusCode = 400
    message = "ID inválido"
  }
  // Handle JWT errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401
    message = "Token inválido"
  }
  else if (err.name === "TokenExpiredError") {
    statusCode = 401
    message = "Token expirado"
  }
  // Handle Mongoose errors
  else if (err.name === "MongoServerError") {
    statusCode = 500
    message = "Error en la base de datos"
  }
  // Handle network/timeout errors
  else if (err.name === "MongoNetworkError" || err.name === "MongoTimeoutError") {
    statusCode = 503
    message = "Error de conexión con la base de datos"
  }

  // Log error for debugging
  const shouldLog = statusCode === 500 || process.env.NODE_ENV === "development"
  
  if (shouldLog) {
    console.error("Error:", {
      name: err.name,
      message: err.message,
      statusCode,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    })
  }

  // Send error response
  const response = {
    success: false,
    error: message,
    ...(details && { details })
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === "development" && err.stack) {
    response.stack = err.stack
  }

  res.status(statusCode).json(response)
}

export { errorHandler }
