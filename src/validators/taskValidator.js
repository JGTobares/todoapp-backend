import { body, param, query, validationResult } from "express-validator"

// Validator for creating a task
export const createTaskValidator = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("El texto de la tarea es obligatorio")
    .isLength({ min: 1, max: 500 })
    .withMessage("El texto de la tarea debe tener entre 1 y 500 caracteres")
]

// Validator for updating a task
export const updateTaskValidator = [
  param("id")
    .isMongoId()
    .withMessage("ID inválido"),

  body("text")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El texto de la tarea no puede estar vacío")
    .isLength({ min: 1, max: 500 })
    .withMessage("El texto de la tarea debe tener entre 1 y 500 caracteres"),

  body("done")
    .optional()
    .isBoolean()
    .withMessage("El campo 'done' debe ser un booleano")
]

// Validator for task ID parameter
export const taskIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("ID inválido")
]

// Validator for query parameters (pagination, filters)
export const getTasksQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100")
    .toInt(),

  query("done")
    .optional()
    .isBoolean()
    .withMessage("El filtro 'done' debe ser un booleano")
    .toBoolean(),

  query("sort")
    .optional()
    .isIn(["createdAt", "-createdAt", "updatedAt", "-updatedAt"])
    .withMessage("El ordenamiento debe ser: createdAt, -createdAt, updatedAt o -updatedAt")
]

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Errores de validación",
      details: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    })
  }
  next()
}
