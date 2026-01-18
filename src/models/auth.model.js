import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "El username es obligatorio"],
      unique: true,
      trim: true,
      minlength: [3, "El username debe tener al menos 3 caracteres"],
      maxlength: [30, "El username no puede tener más de 30 caracteres"],
      match: [/^[a-zA-Z0-9_]+$/, "El username solo puede contener letras, números y guiones bajos"]
    },
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Por favor ingresa un email válido"]
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minlength: [8, "La contraseña debe tener al menos 8 caracteres"]
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

// Indexes for better query performance
// Note: email and username already have unique: true which creates indexes
// These explicit indexes are redundant but kept for clarity

// Method to compare password (can be used if needed)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model("User", userSchema)

export { User }
