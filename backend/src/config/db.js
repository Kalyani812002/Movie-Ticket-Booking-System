import mongoose from "mongoose";

export async function connectDatabase(uri) {
  const connection = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${connection.connection.host}`);
}
