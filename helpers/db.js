const mongoose = require("mongoose");

let cachedConnection = null;
let listenersAdded = false;
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

   if (!listenersAdded) {
     mongoose.connection.on("connected", async () => {
       console.log("MongoDB connected successfully");
     });
     mongoose.connection.on("disconnected", async () => {
       console.error("MongoDB disconnected, attempting to reconnect...");
       cachedConnection = null;
       setTimeout(() => connectDB().catch(() => {}), 2000);
     });
     mongoose.connection.on("reconnected", async () => {
       console.log("MongoDB reconnected successfully");
     });
     mongoose.connection.on("error", async (error) => {
       console.error(`MongoDB connection error: ${error.message}`);
       cachedConnection = null;
     });
    listenersAdded = true;
   }
    return db;
  } catch (error) {
    console.error(`Error connecting to MongoDB Atlas: ${error.message}`);
    cachedConnection = null;
    throw error;
  }
};

module.exports = connectDB;