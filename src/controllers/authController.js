import bcrypt from "bcryptjs"
import { User } from "../models/auth.model.js"
import jwt from "jsonwebtoken"
import { appConfig } from "../config/config.js"
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { resetRateLimit } from "../middleware/limiter.js"
import { logger } from "../utils/logger.js"

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body

  // Debug logging
  logger.log("🔍 [REGISTER] Datos recibidos:", { username, email, password: password ? "***" : "undefined" })

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] })
  
  logger.log("🔍 [REGISTER] Usuario existente:", existingUser ? "Sí" : "No")

  if (existingUser) {
    throw new ConflictError(
      existingUser.email === email
        ? "El correo electrónico ya está registrado"
        : "El username ya está en uso"
    )
  }

    // Hash password
    const hash = await bcrypt.hash(password, 10)

    // Create new user
    const newUser = new User({ username, email, password: hash })
    await newUser.save()
    
    logger.log("✅ [REGISTER] Usuario creado:", { id: newUser._id, username: newUser.username, email: newUser.email })

  // Generate JWT token
  const token = jwt.sign(
    { id: newUser._id, username: newUser.username, email: newUser.email },
    appConfig.jwt.secret,
    { expiresIn: appConfig.jwt.expiresIn }
  )

  res.status(201).json({
    success: true,
    message: "Usuario registrado correctamente",
    token,
    user: {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email
    }
  })
})

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Find user by email
  const user = await User.findOne({ email })
  if (!user) {
    throw new UnauthorizedError("Credenciales inválidas")
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw new UnauthorizedError("Credenciales inválidas")
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    appConfig.jwt.secret,
    { expiresIn: appConfig.jwt.expiresIn }
  )

  // Reset rate limiter on successful login
  resetRateLimit(req)
  logger.log("✅ [LOGIN] Rate limiter reset para IP:", req.ip)

  res.status(200).json({
    success: true,
    message: "Login exitoso",
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
})

const updateProfile = asyncHandler(async (req, res) => {
  const { username, currentPassword, newPassword } = req.body
  const userId = req.user.id

  // Find current user
  const user = await User.findById(userId)
  if (!user) {
    throw new NotFoundError("Usuario")
  }

  // If changing password, validate current password
  if (newPassword) {
    if (!currentPassword) {
      throw new ValidationError("La contraseña actual es requerida para cambiar la contraseña")
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      throw new UnauthorizedError("La contraseña actual es incorrecta")
    }
  }

  // If changing username, verify it's not in use
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      throw new ConflictError("El username ya está en uso")
    }
  }

  // Build update data
  const updateData = {}
  if (username && username !== user.username) {
    updateData.username = username
  }
  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 10)
  }

  // Check if there's anything to update
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError("No hay cambios para actualizar")
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  )

  // If username changed, generate new token
  let newToken = null
  if (updateData.username) {
    newToken = jwt.sign(
      { id: updatedUser._id, username: updatedUser.username, email: updatedUser.email },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.expiresIn }
    )
  }

  res.status(200).json({
    success: true,
    message: "Perfil actualizado correctamente",
    user: {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email
    },
    ...(newToken && { token: newToken })
  })
})

const refreshToken = asyncHandler(async (req, res) => {
  const userId = req.user.id

  // Find current user to get updated information
  const user = await User.findById(userId)
  if (!user) {
    throw new NotFoundError("Usuario")
  }

  // Generate new token with updated user information
  const newToken = jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    appConfig.jwt.secret,
    { expiresIn: appConfig.jwt.expiresIn }
  )

  res.status(200).json({
    success: true,
    message: "Token refrescado correctamente",
    token: newToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
})

const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const user = await User.findById(userId).select("-password")
  if (!user) {
    throw new NotFoundError("Usuario")
  }

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  })
})

export { login, register, updateProfile, refreshToken, getProfile }
