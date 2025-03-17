require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db.js");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.get('/ping', (req, res) => {
  console.log('Ping received');
  res.send('pong');
});

// Connect to DB before setting up routes
connectDB().then(() => {
  // Only set up routes after DB connection is established
  const testRoutes = require("./routes/testRoutes");
  const extractApiRoutes = require("./routes/extractApiRoutes");
  const testScriptRoutes = require("./routes/testScriptRoutes");
  const webhookRoutes = require('./routes/webhookRoutes');
  const userRoutes = require('./routes/userRoutes');
  
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/users', userRoutes);
  app.use("/api", testRoutes);
  app.use("/api/extract-api", extractApiRoutes);
  app.use("/api", testScriptRoutes);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});