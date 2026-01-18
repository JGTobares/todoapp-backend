import mongoose from "mongoose"

const taskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "El texto de la tarea es obligatorio"],
      trim: true,
      minlength: [1, "El texto de la tarea no puede estar vacío"],
      maxlength: [500, "El texto de la tarea no puede tener más de 500 caracteres"]
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "El userId es obligatorio"],
      ref: "User"
    },
    done: {
      type: Boolean,
      default: false
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

// Indexes for better query performance
taskSchema.index({ userId: 1, createdAt: -1 })
taskSchema.index({ userId: 1, done: 1 })

const Task = mongoose.model("Task", taskSchema)

export { Task }
