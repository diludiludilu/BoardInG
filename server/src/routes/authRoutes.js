
const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { rateLimit } = require("express-rate-limit");
const User = require("../models/User");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function newToken() {
  return crypto.randomBytes(32).toString("hex");
}

function requireCsrf(req, res, next) {
  const actual = req.get("x-csrf-token");
  const expected = req.session.csrfToken;

  if (!actual || !expected) {
    return res.status(403).json({
      message: "Invalid security token",
    });
  }

  const a = Buffer.from(actual);
  const b = Buffer.from(expected);

  if (
    a.length !== b.length ||
    !crypto.timingSafeEqual(a, b)
  ) {
    return res.status(403).json({
      message: "Invalid security token",
    });
  }

  next();
}

// Issue a CSRF token for forms and API writes.
router.get("/csrf-token", (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = newToken();
  }

  req.session.save((error) => {
    if (error) return next(error);

    res.json({
      csrfToken: req.session.csrfToken,
    });
  });
});

// Create a new session after successful authentication.
function startSession(req, res, next, user, statusCode) {
  req.session.regenerate((error) => {
    if (error) return next(error);

    req.session.userId = user.id;
    req.session.csrfToken = newToken();

    req.session.save((saveError) => {
      if (saveError) return next(saveError);

      res.status(statusCode).json({
        user: publicUser(user),
        csrfToken: req.session.csrfToken,
      });
    });
  });
}

// Register student or owner.
router.post(
  "/register",
  authLimiter,
  requireCsrf,
  asyncRoute(async (req, res, next) => {
    const { name, email, password, role } = req.body || {};

    const cleanName =
      typeof name === "string" ? name.trim() : "";

    const cleanEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    if (
      cleanName.length < 2 ||
      cleanName.length > 80 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72 ||
      !["STUDENT", "OWNER"].includes(role)
    ) {
      return res.status(400).json({
        message: "Please enter valid registration details",
      });
    }

    const existing = await User.findOne({
      email: cleanEmail,
    });

    if (existing) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role,
    });

    startSession(req, res, next, user, 201);
  })
);

// Login with email and password.
router.post(
  "/login",
  authLimiter,
  requireCsrf,
  asyncRoute(async (req, res, next) => {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");

    const valid =
      user && (await bcrypt.compare(password, user.passwordHash));

    if (!valid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    startSession(req, res, next, user, 200);
  })
);

// Return the currently signed-in user.
router.get(
  "/me",
  asyncRoute(async (req, res) => {
    if (!req.session.userId) {
      return res.json({ user: null });
    }

    const user = await User.findById(req.session.userId);

    res.json({
      user: user ? publicUser(user) : null,
    });
  })
);

// Logout and destroy the session.
router.post("/logout", requireCsrf, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("boarding.sid", { path: "/" });
    res.json({ message: "Logged out" });
  });
});

module.exports = router;
