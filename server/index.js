// Express server entry point.
//
// This is the backend for the PC builder app. Right now it does very
// little — just a health-check route — because the project is at the
// very beginning. Add routes as features are built.

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // allow the React app (different port) to call this API
app.use(express.json()); // parse JSON request bodies

// Health-check route — confirms the server is running.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running." });
});

// Future routes get added here (or imported from ./routes).
// Example:
//   import partsRouter from "./routes/parts.js";
//   app.use("/api/parts", partsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
