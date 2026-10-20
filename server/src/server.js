
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const helmet = require("helmet");
const houseRoutes = require("./routes/houseRoutes");

const authRoutes = require("./routes/authRoutes");

const app = express();

if (
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 32 ||
  !process.env.MONGO_URI
) {
  throw new Error("Missing valid environment configuration");
}

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "20kb" }));

// Persist sessions in MongoDB.
app.use(
  session({
    name: "boarding.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

// Authentication routes.
app.use("/api/auth", authRoutes);

// Health check.
app.get("/api/health", (req, res) => {
  res.json({
    application: "BoardInG",
    status: "running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// Temporary listing route until the next module.
app.use("/api/houses", houseRoutes);

// Handle unknown API paths.
app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

// Handle backend errors.
app.use((error, req, res, next) => {
  console.error(error);

  if (error.code === 11000) {
    return res.status(409).json({
      message: "This record already exists",
    });
  }

  if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(400).json({
      message: "Invalid data provided",
    });
  }

  res.status(500).json({
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(
        `BoardInG API running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

start();
