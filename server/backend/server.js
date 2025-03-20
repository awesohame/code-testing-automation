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
app.get('/api/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const serpApiUrl = new URL('https://serpapi.com/search.json');
  serpApiUrl.searchParams.append('q', `books:${query}`);
  serpApiUrl.searchParams.append('location', 'India');
  serpApiUrl.searchParams.append('hl', 'hi');
  serpApiUrl.searchParams.append('gl', 'in');
  serpApiUrl.searchParams.append('google_domain', 'google.co.in');
  serpApiUrl.searchParams.append('api_key', '555e1650dcfeb69fdfe704d298b0396b66172413026edf642b954be707bfaa50');

  try {
    const response = await fetch(serpApiUrl.toString());
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy server error:', error);
    res.status(500).json({ error: 'Failed to fetch data from SerpAPI' });
  }
});

// Connect to DB before setting up routes
connectDB().then(() => {
  console.log("Database Connected");
})
// Only set up routes after DB connection is established
const testRoutes = require("./routes/testRoutes");
const extractApiRoutes = require("./routes/extractApiRoutes");
const testScriptRoutes = require("./routes/testScriptRoutes");
const webhookRoutes = require('./routes/webhookRoutes');
const userRoutes = require('./routes/userRoutes');
const loadTestRouter = require('./routes/loadTestRoutes.js')
const testGenerationRoutes = require('./routes/testGenerationRoutes.js')
const managerRoutes = require('./routes/managerRoutes.js');

app.use('/api/webhooks', webhookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loadtests', loadTestRouter);
app.use('/api/test-generations', testGenerationRoutes);
app.use("/api", testRoutes);
app.use("/api/extract-api", extractApiRoutes);
app.use("/api", testScriptRoutes);
app.use("/api/manager", managerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// }).catch(err => {
//   console.error("Failed to connect to database:", err);
//   process.exit(1);
// });