const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const BoardingHouse = require("../models/BoardingHouse");
const Membership = require("../models/Membership");

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const requireRole = (...roles) => asyncRoute(async (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: "Please log in first" });
  if (!mongoose.isValidObjectId(req.session.userId)) return res.status(401).json({ message: "Invalid session" });
  const user = await User.findById(req.session.userId);
  if (!user) return res.status(401).json({ message: "Account no longer exists" });
  if (roles.length && !roles.includes(user.role)) return res.status(403).json({ message: "You don't have permission for this action" });
  req.currentUser = user;
  next();
});

function requireCsrf(req, res, next) {
  const supplied = req.get("x-csrf-token");
  const expected = req.session?.csrfToken;
  if (typeof supplied !== "string" || typeof expected !== "string") {
    return res.status(403).json({ message: "Invalid security token" });
  }
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return res.status(403).json({ message: "Invalid security token" });
  }
  next();
}

function requireObjectId(paramName) {
  return (req, res, next) => {
    if (!mongoose.isObjectIdOrHexString(req.params[paramName])) {
      return res.status(400).json({ message: `Invalid ${paramName}` });
    }
    next();
  };
}

// Called *after* authentication; determines access to one specific community.
const requireCommunityAccess = asyncRoute(async (req, res, next) => {
  const houseId = req.params.houseId;
  if (!mongoose.isObjectIdOrHexString(houseId)) return res.status(400).json({ message: "Invalid houseId" });
  const house = await BoardingHouse.findOne({ _id: houseId, status: "ACTIVE" });
  if (!house) return res.status(404).json({ message: "Boarding house not found" });
  if (req.currentUser.role === "OWNER" && String(house.ownerId) === String(req.currentUser._id)) {
    req.house = house;
    return next();
  }
  if (req.currentUser.role === "STUDENT") {
    const membership = await Membership.exists({ studentId: req.currentUser._id, boardingHouseId: house._id, status: "ACTIVE" });
    if (membership) {
      req.house = house;
      return next();
    }
  }
  res.status(403).json({ message: "Only this house's owner and active residents can access its community" });
});

module.exports = { asyncRoute, requireRole, requireCsrf, requireObjectId, requireCommunityAccess };
