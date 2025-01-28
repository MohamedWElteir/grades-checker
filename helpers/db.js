const mongoose = require("mongoose");

let isConnected;
const connectDB = async () => {
  if (isConnected) {
    console.log("Using existing MongoDB connection");
    return;
  }

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment variables.");
    }

    const db = await mongoose.connect(uri);

    isConnected = db.connections[0].readyState;
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error(`Error connecting to MongoDB Atlas: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
