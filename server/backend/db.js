const mongoose = require('mongoose');

// Replace with your actual MongoDB Atlas connection string
const uri = "mongodb+srv://ajinkyac2601:SjDav0TUQwKHXNga@cluster0.d0fmc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function connectDB() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB cluster successfully!");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit if connection fails
  }
}

module.exports = { connectDB };