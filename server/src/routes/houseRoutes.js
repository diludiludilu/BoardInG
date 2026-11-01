const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");

const User = require("../models/User");
const BoardingHouse = require("../models/BoardingHouse");
const AccommodationRequest = require("../models/AccommodationRequest");
const Membership = require("../models/Membership");
const CommunityPost = require("../models/CommunityPost");
const MaintenanceIssue = require("../models/MaintenanceIssue");

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

// Accept only editable property fields with robust image synchronization.
function cleanHouseInput(body) {
  const allowed = [
    "title",
    "description",
    "city",
    "area",
    "monthlyRentLkr",
    "facilities",
    "imageUrl",
    "imageUrls",
    "availability",
  ];

  const clean = {};

  for (const field of allowed) {
    if (Object.hasOwn(body, field)) {
      clean[field] = body[field];
    }
  }

  if (Object.hasOwn(clean, "imageUrls")) {
    if (Array.isArray(clean.imageUrls)) {
      clean.imageUrl = clean.imageUrls.length > 0 ? clean.imageUrls[0] : "";
    }
  } else if (Object.hasOwn(clean, "imageUrl")) {
    clean.imageUrls = clean.imageUrl ? [clean.imageUrl] : [];
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
    const { city, maxRent, sort } = req.query;

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

    let sortOption = { createdAt: -1 };

    if (sort !== undefined) {
      if (typeof sort !== "string") {
        return res.status(400).json({
          message: "Invalid sort option",
        });
      }

      const normalizedSort = sort.trim().toLowerCase();
      if (normalizedSort === "newest" || normalizedSort === "") {
        sortOption = { createdAt: -1 };
      } else if (
        normalizedSort === "rent_asc" ||
        normalizedSort === "rent-asc" ||
        normalizedSort === "rent_low_to_high"
      ) {
        sortOption = { monthlyRentLkr: 1, createdAt: -1 };
      } else if (
        normalizedSort === "rent_desc" ||
        normalizedSort === "rent-desc" ||
        normalizedSort === "rent_high_to_low"
      ) {
        sortOption = { monthlyRentLkr: -1, createdAt: -1 };
      } else {
        return res.status(400).json({
          message: "Invalid sort option",
        });
      }
    }

    const houses = await BoardingHouse.find(filter)
      .sort(sortOption)
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

// Permanent deletion handler: checks owner authorization, seed manifest, and linked records
async function handlePermanentDelete(req, res) {
  const house = await BoardingHouse.findById(req.params.id);

  if (!house) {
    return res.status(404).json({
      message: "Boarding house not found",
    });
  }

  if (String(house.ownerId) !== String(req.session.userId)) {
    return res.status(403).json({
      message: "You may only delete your own boarding house",
    });
  }

  // Protect demonstration houses listed in _seed_manifest
  if (!mongoose.connection || !mongoose.connection.db) {
    return res.status(500).json({
      message: "Database connection unavailable for property verification",
    });
  }

  try {
    const seedManifest = await mongoose.connection.collection("_seed_manifest").findOne({
      $or: [
        { "insertedIds.boardinghouses": house._id },
        { "insertedIds.boardinghouses": String(house._id) },
        { "insertedIds.boardinghouses": new mongoose.Types.ObjectId(req.params.id) },
      ],
    });

    if (seedManifest) {
      return res.status(403).json({
        message: "Demonstration boarding houses cannot be permanently deleted",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Failed to verify property protection status",
    });
  }

  // Reject any property linked to requests, memberships, community posts or maintenance issues
  const [requestCount, membershipCount, postCount, issueCount] = await Promise.all([
    AccommodationRequest.countDocuments({ boardingHouseId: house._id }),
    Membership.countDocuments({ boardingHouseId: house._id }),
    CommunityPost.countDocuments({ boardingHouseId: house._id }),
    MaintenanceIssue.countDocuments({ boardingHouseId: house._id }),
  ]);

  const linked = [];
  if (requestCount > 0) linked.push(`${requestCount} accommodation request(s)`);
  if (membershipCount > 0) linked.push(`${membershipCount} membership(s)`);
  if (postCount > 0) linked.push(`${postCount} community post(s)`);
  if (issueCount > 0) linked.push(`${issueCount} maintenance issue(s)`);

  if (linked.length > 0) {
    return res.status(409).json({
      message: `Cannot delete property: linked to ${linked.join(", ")}. Only unreferenced properties can be permanently deleted.`,
    });
  }

  await BoardingHouse.deleteOne({ _id: house._id });

  return res.json({
    message: "Boarding house permanently deleted",
    deletedId: house._id,
  });
}

// DELETE /api/houses/:id/permanent
// Permanently delete a newly created, unreferenced boarding house.
router.delete(
  "/:id/permanent",
  requireOwner,
  requireCsrf,
  validId,
  asyncRoute(handlePermanentDelete)
);

// DELETE /api/houses/:id
// Archive the property rather than deleting its data (or permanently delete if permanent=true query param provided).
router.delete(
  "/:id",
  requireOwner,
  requireCsrf,
  validId,
  asyncRoute(async (req, res, next) => {
    if (req.query.permanent === "true") {
      return handlePermanentDelete(req, res, next);
    }

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
