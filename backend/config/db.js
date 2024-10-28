// db.js
const mongoose = require('mongoose');

const uri = "mongodb://localhost:27017/photo_app"; // Adjust URI as needed for MongoDB Atlas or local

async function connectToDatabase() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB via Mongoose");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if connection fails
  }
}

module.exports = connectToDatabase;
