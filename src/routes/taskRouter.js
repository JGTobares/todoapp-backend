import { Router } from "express"
import {
  getAllTasks,
  getTask,
  addNewTask,
  updateTask,
  deleteTask,
  getTaskStats
} from "../controllers/taskController.js"
import {
  createTaskValidator,
  updateTaskValidator,
  taskIdValidator,
  getTasksQueryValidator,
  handleValidationErrors
} from "../validators/taskValidator.js"
import { apiLimiter } from "../middleware/limiter.js"

const taskRouter = Router()

// Apply rate limiting to all task routes
taskRouter.use(apiLimiter)

// Get task statistics
taskRouter.get("/stats", getTaskStats)

// Get all tasks with pagination and filters
taskRouter.get("/", getTasksQueryValidator, handleValidationErrors, getAllTasks)

// Get single task
taskRouter.get("/:id", taskIdValidator, handleValidationErrors, getTask)

// Create new task
taskRouter.post("/", createTaskValidator, handleValidationErrors, addNewTask)

// Update task (text or done status)
taskRouter.patch("/:id", updateTaskValidator, handleValidationErrors, updateTask)

// Delete task
taskRouter.delete("/:id", taskIdValidator, handleValidationErrors, deleteTask)

export { taskRouter }
