require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const houseRoutes = require("./routes/houseRoutes");
const requestRoutes = require("./routes/requestRoutes");
const communityRoutes = require("./routes/communityRoutes");
const issueRoutes = require("./routes/issueRoutes");

if (!process.env.MONGO_URI || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("Configure MONGO_URI and a random SESSION_SECRET (32+ characters) in server/.env");
}

const app = express();
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "20kb" }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));

app.use(session({
  name: "boarding.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use("/api/auth", authRoutes);
app.get("/api/health", (req, res) => res.json({
  application: "BoardInG", status: "running",
  database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
}));
app.use("/api/houses", houseRoutes);
app.use("/api", requestRoutes);
app.use("/api", communityRoutes);
app.use("/api", issueRoutes);
app.use("/api", (req, res) => res.status(404).json({ message: "API endpoint not found" }));
app.use((error, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, error);
  if (error.code === 11000) return res.status(409).json({ message: "An existing record conflicts with this request" });
  if (error.name === "ValidationError" || error.name === "CastError" || error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid data provided" });
  }
  res.status(500).json({ message: "Internal server error" });
});

const PORT = Number(process.env.PORT || 5000);
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => console.log(`BoardInG API running at http://localhost:${PORT}`));
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exitCode = 1;
  }
}
if (require.main === module) start();
module.exports = { app, start };
