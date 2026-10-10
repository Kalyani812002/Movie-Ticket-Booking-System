import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import Booking from "./models/Booking.js";
import User from "./models/User.js";
import Show from "./models/Show.js";
import { getConfig } from "./config/env.js";

async function removeLegacyBookingIndex() {
  let indexes;
  try {
    indexes = await Booking.collection.indexes();
  } catch (error) {
    if (error.code === 26 || error.codeName === "NamespaceNotFound") {
      return;
    }
    throw error;
  }

  const legacyIndex = indexes.find(
    (index) =>
      index.unique &&
      index.key.movie === 1 &&
      index.key.showDate === 1 &&
      index.key.showTime === 1 &&
      index.key.seats === 1
  );
  if (legacyIndex) {
    await Booking.collection.dropIndex(legacyIndex.name);
    console.log("Removed the legacy booking uniqueness index.");
  }
}

async function startServer() {
  const { mongoUri, port } = getConfig();
  await connectDatabase(mongoUri);
  await removeLegacyBookingIndex();
  await Booking.init();
  await User.init();
  await Show.init();

 const server = app.listen(port, "0.0.0.0");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  console.log(`CineBook API listening on port ${port}`);

  async function shutdown(signal) {
    console.log(`${signal} received; closing the API.`);
    server.close(async (error) => {
      if (error) {
        console.error("Unable to close the HTTP server cleanly:", error);
        process.exitCode = 1;
      }
      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        console.error("Unable to disconnect from MongoDB cleanly:", disconnectError);
        process.exitCode = 1;
      }
    });
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch(async (error) => {
  console.error("Unable to start the API:", error);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    console.error("Unable to disconnect from MongoDB after startup failure:", disconnectError);
  }
  process.exitCode = 1;
});
