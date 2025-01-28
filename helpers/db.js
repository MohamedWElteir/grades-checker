const mongoose = require("mongoose");

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    console.log("Using cached MongoDB connection");
    return cachedConnection;
  }

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment variables.");
    }

    const db = await mongoose.connect(uri);
    cachedConnection = db; 
    console.log("MongoDB connected successfully!");
    return db;
  } catch (error) {
    console.error(`Error connecting to MongoDB Atlas: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
