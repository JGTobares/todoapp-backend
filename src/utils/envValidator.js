import { config } from "dotenv"
import { logger } from "./logger.js"
config()

const requiredEnvVars = [
  "PORT",
  "JWT_SECRET",
  "URI_DB"
]

const validateEnv = () => {
  const missing = []
  const warnings = []

  // Validar variables requeridas
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  })

  // Validar JWT_SECRET tiene suficiente longitud
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push("JWT_SECRET debería tener al menos 32 caracteres para mayor seguridad")
  }

  // Validar URI_DB en producción
  if (process.env.NODE_ENV === "production" && !process.env.URI_DB_REMOTE) {
    warnings.push("URI_DB_REMOTE no está configurada pero NODE_ENV es 'production'")
  }

  if (missing.length > 0) {
    console.error("❌ Variables de entorno faltantes:", missing.join(", "))
    console.error("Por favor, configura estas variables en tu archivo .env")
    process.exit(1)
  }

  if (warnings.length > 0) {
    warnings.forEach((warning) => {
      logger.warn("⚠️ Advertencia:", warning)
    })
  }

  logger.log("✅ Variables de entorno validadas correctamente")
}

export { validateEnv }
