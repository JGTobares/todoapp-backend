import jwt from "jsonwebtoken"
import { appConfig } from "../config/config.js"
import { UnauthorizedError } from "../utils/errors.js"

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Token de autenticación requerido"
      })
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Token mal formado. Debe comenzar con 'Bearer '"
      })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token no proporcionado"
      })
    }

    // Verify token
    const decoded = jwt.verify(token, appConfig.jwt.secret)

    // Attach user info to request
    req.user = decoded

    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expirado"
      })
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Token inválido"
      })
    }

    return res.status(401).json({
      success: false,
      error: "Error al verificar el token"
    })
  }
}

export { authMiddleware }
