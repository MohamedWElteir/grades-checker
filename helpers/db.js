const mongoose = require("mongoose");

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState ===1) return cachedConnection;
  

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment variables.");
    }

    const db = await mongoose.connect(uri,{
      retryReads: true,
      retryWrites: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 450000,
    });
    cachedConnection = db; 

    mongoose.connection.once("error", (error) => {
      console.error(`MongoDB connection error: ${error.message}`);
      cachedConnection = null
    });

    mongoose.connection.once("disconnected", () => {
      console.error("MongoDB disconnected");
      cachedConnection = null
    });

    return db;
  } catch (error) {
    console.error(`Error connecting to MongoDB Atlas: ${error.message}`);
    cachedConnection = null
    throw error;
  }
};

module.exports = connectDB;