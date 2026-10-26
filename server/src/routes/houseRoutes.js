
const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");

const User = require("../models/User");
const BoardingHouse = require("../models/BoardingHouse");

const router = express.Router();

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// Only authenticated boarding owners may continue.
const requireOwner = asyncRoute(async (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      message: "Please log in first",
    });
  }

  const user = await User.findById(req.session.userId);

  if (!user || user.role !== "OWNER") {
    return res.status(403).json({
      message: "Owner access required",
    });
  }

  next();
});

// Protect operations that change data.
// Uses the same CSRF-token rules as our auth routes.
function requireCsrf(req, res, next) {
  const supplied = req.get("x-csrf-token");
  const expected = req.session?.csrfToken;

  if (!supplied || !expected) {
    return res.status(403).json({
      message: "Invalid security token",
    });
  }

  const a = Buffer.from(supplied);
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

// Accept only editable property fields.
function cleanHouseInput(body) {
  const allowed = [
    "title",
    "description",
    "city",
    "area",
    "monthlyRentLkr",
    "facilities",
    "imageUrl",
    "availability",
  ];

  const clean = {};

  for (const field of allowed) {
    if (Object.hasOwn(body, field)) {
      clean[field] = body[field];
    }
  }

  return clean;
}

// Validate common route parameters.
function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid boarding house ID",
    });
  }

  next();
}

// GET /api/houses
// Anyone can search active properties.
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const { city, maxRent } = req.query;

    const filter = { status: "ACTIVE" };

    if (city !== undefined) {
      if (typeof city !== "string" || city.length > 80) {
        return res.status(400).json({
          message: "Invalid location filter",
        });
      }

      const escaped = city.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      if (escaped) {
        const search = new RegExp(escaped, "i");

        filter.$or = [
          { city: search },
          { area: search },
        ];
      }
    }

    if (maxRent !== undefined) {
      const price = Number(maxRent);

      if (
        typeof maxRent !== "string" ||
        !Number.isFinite(price) ||
        price <= 0
      ) {
        return res.status(400).json({
          message: "Invalid maximum rent",
        });
      }

      filter.monthlyRentLkr = { $lte: price };
    }

    const houses = await BoardingHouse.find(filter)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json(houses);
  })
);

// GET /api/houses/mine
// Owners can see their own properties.
router.get(
  "/mine",
  requireOwner,
  asyncRoute(async (req, res) => {
    const houses = await BoardingHouse.find({
      ownerId: req.session.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(houses);
  })
);

// GET /api/houses/:id
// Public details for active properties.
router.get(
  "/:id",
  validId,
  asyncRoute(async (req, res) => {
    const house = await BoardingHouse.findOne({
      _id: req.params.id,
      status: "ACTIVE",
    }).lean();

    if (!house) {
      return res.status(404).json({
        message: "Boarding house not found",
      });
    }

    res.json(house);
  })
);

// POST /api/houses
// Owners create new properties.
router.post(
  "/",
  requireOwner,
  requireCsrf,
  asyncRoute(async (req, res) => {
    const data = cleanHouseInput(req.body || {});

    const house = await BoardingHouse.create({
      ...data,
      ownerId: req.session.userId,
    });

    res.status(201).json(house);
  })
);

// PATCH /api/houses/:id
// Owners modify only their own active properties.
router.patch(
  "/:id",
  requireOwner,
  requireCsrf,
  validId,
  asyncRoute(async (req, res) => {
    const updates = cleanHouseInput(req.body || {});

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No editable fields provided",
      });
    }

    const house = await BoardingHouse.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId: req.session.userId,
        status: "ACTIVE",
      },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!house) {
      return res.status(404).json({
        message: "Your active listing was not found",
      });
    }

    res.json(house);
  })
);

// DELETE /api/houses/:id
// Archive the property rather than deleting its data.
router.delete(
  "/:id",
  requireOwner,
  requireCsrf,
  validId,
  asyncRoute(async (req, res) => {
    const house = await BoardingHouse.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId: req.session.userId,
        status: "ACTIVE",
      },
      { $set: { status: "ARCHIVED" } },
      { returnDocument: "after" }
    );

    if (!house) {
      return res.status(404).json({
        message: "Your active listing was not found",
      });
    }

    res.json({
      message: "Boarding house archived",
    });
  })
);

module.exports = router;
