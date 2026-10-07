import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      validate: {
        validator: (value) => typeof value === "string" && Buffer.byteLength(value, "utf8") <= 72,
        message: "Password cannot exceed 72 UTF-8 bytes."
      },
      select: false
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform(_document, result) {
    delete result.password;
    delete result.__v;
    return result;
  }
});

export default mongoose.model("User", userSchema);
