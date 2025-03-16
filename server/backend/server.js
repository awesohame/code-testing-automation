require("dotenv").config();
const express = require("express");
const cors = require("cors");
const testRoutes = require("./routes/testRoutes");
const extractApiRoutes = require("./routes/extractApiRoutes");
const testScriptRoutes = require("./routes/testScriptRoutes");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api", testRoutes);
app.use("/api/extract-api", extractApiRoutes);
app.use("/api", testScriptRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
