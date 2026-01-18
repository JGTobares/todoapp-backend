import { Router } from "express"
import { login, register, updateProfile, refreshToken, getProfile } from "../controllers/authController.js"
import { authMiddleware } from "../middleware/auth.js"
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  handleValidationErrors
} from "../validators/authValidator.js"
import { strictLimiter, authLimiter } from "../middleware/limiter.js"

const authRouter = Router()

// Public routes with strict rate limiting
authRouter.post("/register", strictLimiter, registerValidator, handleValidationErrors, register)
authRouter.post("/login", strictLimiter, loginValidator, handleValidationErrors, login)

// Protected routes with general auth rate limiting
authRouter.get("/profile", authMiddleware, authLimiter, getProfile)
authRouter.patch("/profile", authMiddleware, authLimiter, updateProfileValidator, handleValidationErrors, updateProfile)
authRouter.post("/refresh", authMiddleware, authLimiter, refreshToken)

export { authRouter }
