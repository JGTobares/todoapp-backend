import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import nodemailer from "nodemailer"
import { errorEmailTemplate } from "../templates/email.js"
import { config } from "dotenv"
config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const logDir = path.join(process.cwd(), "log")

// Ensure log directory exists (async)
const ensureLogDir = async () => {
  try {
    await fs.access(logDir)
  } catch {
    await fs.mkdir(logDir, { recursive: true })
  }
}

// Initialize log directory
ensureLogDir().catch(console.error)

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_FROM || "noreply@example.com",
    pass: process.env.PASS_GOOGLE_APP
  }
})

const adminEmail = process.env.ADMIN_EMAIL

// Send error email (async, non-blocking)
const sendErrorEmail = async (logObject) => {
  if (!adminEmail || !process.env.PASS_GOOGLE_APP) {
    return // Skip if email not configured
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@example.com",
      to: adminEmail,
      subject: "⚠️ Error 500 en API Tasks",
      html: errorEmailTemplate(logObject)
    }

    await transporter.sendMail(mailOptions)
    // Email sent successfully (no logging needed in production)
  } catch (error) {
    console.error("❌ Error enviando correo:", error.message)
  }
}

// Write log to file (async, non-blocking)
const writeLog = async (logObject) => {
  try {
    const fileName = path.join(logDir, `${new Date().toISOString().slice(0, 10)}.json`)

    let currentData = []
    try {
      const fileContent = await fs.readFile(fileName, "utf8")
      currentData = JSON.parse(fileContent)
    } catch {
      // File doesn't exist or is invalid, start with empty array
      currentData = []
    }

    currentData.push(logObject)

    await fs.writeFile(fileName, JSON.stringify(currentData, null, 2), "utf8")
  } catch (error) {
    console.error("❌ Error escribiendo log:", error.message)
  }
}

// Logger middleware (async)
const logger = async (tokens, req, res) => {
  const logObject = {
    ip: tokens["remote-addr"](req, res),
    user: tokens["remote-user"](req, res) || null,
    date: tokens.date(req, res, "iso"),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    httpVersion: tokens["http-version"](req, res),
    status: Number(tokens.status(req, res)),
    contentLength: tokens.res(req, res, "content-length"),
    referrer: tokens.referrer(req, res) || null,
    userAgent: tokens["user-agent"](req, res),
    responseTime: tokens["response-time"](req, res) + " ms"
  }

  // Write log asynchronously (non-blocking)
  writeLog(logObject).catch(console.error)

  // Send email if status is 500 (async, non-blocking)
  if (logObject.status === 500) {
    sendErrorEmail(logObject).catch(console.error)
  }

  return null
}

export { logger }
