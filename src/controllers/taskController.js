import { Task } from "../models/tasks.model.js"
import { NotFoundError, ValidationError } from "../utils/errors.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { logger } from "../utils/logger.js"

const getAllTasks = asyncHandler(async (req, res) => {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Build query
    const query = { userId }

    // Filter by done status if provided
    if (req.query.done !== undefined) {
      query.done = req.query.done === "true"
    }

    // Build sort
    let sort = { createdAt: -1 } // Default sort
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith("-") ? req.query.sort.slice(1) : req.query.sort
      const sortOrder = req.query.sort.startsWith("-") ? -1 : 1
      sort = { [sortField]: sortOrder }
    }

    // Get tasks with pagination
    const tasks = await Task.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const total = await Task.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  })
})

const getTask = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Find task belonging to user
  const foundTask = await Task.findOne({ _id: id, userId })

  if (!foundTask) {
    throw new NotFoundError("Tarea")
  }

  res.json({
    success: true,
    data: foundTask
  })
})

const addNewTask = asyncHandler(async (req, res) => {
    const { text } = req.body
    const userId = req.user.id

    // Debug logging
    logger.log("🔍 [TASK CREATE] Datos recibidos:", { text, userId })

    // Create new task associated with user
    const newTask = new Task({ text, userId })
    const savedTask = await newTask.save()
    
    logger.log("✅ [TASK CREATE] Tarea creada:", { 
      id: savedTask._id, 
      text: savedTask.text, 
      userId: savedTask.userId,
      done: savedTask.done 
    })

  res.status(201).json({
    success: true,
    message: "Tarea creada correctamente",
    data: savedTask
  })
})

const updateTask = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user.id
    const { text, done } = req.body

    // Build update data
    const updateData = {}
    if (text !== undefined) {
      updateData.text = text
    }
    if (done !== undefined) {
      updateData.done = done
    }

  // Check if there's anything to update
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError("No hay cambios para actualizar. Proporciona 'text' o 'done'")
  }

  // Update task only if it belongs to user
  const updatedTask = await Task.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateData },
    { new: true, runValidators: true }
  )

  if (!updatedTask) {
    throw new NotFoundError("Tarea")
  }

  res.json({
    success: true,
    message: "Tarea actualizada correctamente",
    data: updatedTask
  })
})

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Delete task only if it belongs to user
  const deletedTask = await Task.findOneAndDelete({ _id: id, userId })

  if (!deletedTask) {
    throw new NotFoundError("Tarea")
  }

  res.json({
    success: true,
    message: "Tarea eliminada correctamente",
    data: { id: deletedTask._id }
  })
})

const getTaskStats = asyncHandler(async (req, res) => {
    const userId = req.user.id

    // Get statistics
    const total = await Task.countDocuments({ userId })
    const completed = await Task.countDocuments({ userId, done: true })
    const pending = await Task.countDocuments({ userId, done: false })

    res.json({
      success: true,
      data: {
        total,
        completed,
        pending,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
      }
    })
})

export { getAllTasks, getTask, addNewTask, updateTask, deleteTask, getTaskStats }
