const express = require("express");
const BoardingHouse = require("../models/BoardingHouse");
const AccommodationRequest = require("../models/AccommodationRequest");
const Membership = require("../models/Membership");
const { asyncRoute, requireRole, requireCsrf, requireObjectId } = require("../middleware/access");

const router = express.Router();

router.post("/houses/:houseId/requests", requireRole("STUDENT"), requireCsrf, requireObjectId("houseId"), asyncRoute(async (req, res) => {
  const message = req.body?.message ?? "";
  if (typeof message !== "string" || message.trim().length > 300) return res.status(400).json({ message: "Message must be 300 characters or fewer" });
  const house = await BoardingHouse.findOne({ _id: req.params.houseId, status: "ACTIVE" });
  if (!house) return res.status(404).json({ message: "Boarding house not found" });
  if (house.availability !== "AVAILABLE") return res.status(409).json({ message: "This boarding house is currently full" });
  const existing = await AccommodationRequest.exists({ studentId: req.currentUser._id, boardingHouseId: house._id });
  if (existing) return res.status(409).json({ message: "You already requested this boarding house" });
  const request = await AccommodationRequest.create({ studentId: req.currentUser._id, boardingHouseId: house._id, message: message.trim() });
  res.status(201).json({ message: "Request submitted", request });
}));

router.get("/requests/mine", requireRole("STUDENT"), asyncRoute(async (req, res) => {
  const results = await AccommodationRequest.find({ studentId: req.currentUser._id })
    .populate("boardingHouseId", "title city area monthlyRentLkr status")
    .sort({ createdAt: -1 }).lean();
  res.json(results);
}));

router.get("/memberships/mine", requireRole("STUDENT"), asyncRoute(async (req, res) => {
  const memberships = await Membership.find({ studentId: req.currentUser._id, status: "ACTIVE" })
    .populate("boardingHouseId", "title city status")
    .sort({ createdAt: -1 }).lean();
  res.json(memberships.filter((m) => m.boardingHouseId?.status === "ACTIVE"));
}));

router.get("/owner/requests", requireRole("OWNER"), asyncRoute(async (req, res) => {
  const houses = await BoardingHouse.find({ ownerId: req.currentUser._id }).select("_id");
  const requests = await AccommodationRequest.find({ boardingHouseId: { $in: houses.map((h) => h._id) } })
    .populate("studentId", "name email")
    .populate("boardingHouseId", "title city status")
    .sort({ createdAt: -1 }).lean();
  res.json(requests);
}));

router.post("/requests/:id/approve", requireRole("OWNER"), requireCsrf, requireObjectId("id"), asyncRoute(async (req, res) => {
  let request = await AccommodationRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });
  const house = await BoardingHouse.findOne({ _id: request.boardingHouseId, ownerId: req.currentUser._id });
  if (!house) return res.status(403).json({ message: "Only the property owner can approve requests" });
  if (request.status === "REJECTED") return res.status(409).json({ message: "Rejected requests cannot be approved" });
  const membershipFilter = { studentId: request.studentId, boardingHouseId: request.boardingHouseId };
  const membership = await Membership.findOne(membershipFilter);
  if (membership?.status === "REVOKED") return res.status(409).json({ message: "A revoked membership cannot be reactivated through an old request" });
  if (request.status === "PENDING") {
    if (house.status !== "ACTIVE" || house.availability !== "AVAILABLE") {
      return res.status(409).json({ message: "This boarding house is not available" });
    }
    const updated = await AccommodationRequest.findOneAndUpdate(
      { _id: request._id, status: "PENDING" },
      { $set: { status: "APPROVED", reviewedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(409).json({ message: "Request changed. Refresh and try again" });
    request = updated;
  }
  // Retry-safe membership creation: an already APPROVED request can repair a missing membership.
  // This MVP uses two writes without a transaction; production should use MongoDB transactions.
  await Membership.findOneAndUpdate(membershipFilter,
    { $setOnInsert: { ...membershipFilter, status: "ACTIVE", joinedAt: new Date() } },
    { returnDocument: "after", upsert: true, runValidators: true }
  );
  res.json({ message: "Resident approved", request });
}));

router.post("/requests/:id/reject", requireRole("OWNER"), requireCsrf, requireObjectId("id"), asyncRoute(async (req, res) => {
  const request = await AccommodationRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });
  const house = await BoardingHouse.findOne({ _id: request.boardingHouseId, ownerId: req.currentUser._id });
  if (!house) return res.status(403).json({ message: "Only the property owner can reject requests" });
  const updated = await AccommodationRequest.findOneAndUpdate(
    { _id: request._id, status: "PENDING" },
    { $set: { status: "REJECTED", reviewedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!updated) return res.status(409).json({ message: "Only pending requests can be rejected" });
  res.json({ message: "Request rejected", request: updated });
}));

router.get("/houses/:houseId/members", requireRole("OWNER"), requireObjectId("houseId"), asyncRoute(async (req, res) => {
  const house = await BoardingHouse.findOne({ _id: req.params.houseId, ownerId: req.currentUser._id });
  if (!house) return res.status(404).json({ message: "Your property was not found" });
  const members = await Membership.find({ boardingHouseId: house._id, status: "ACTIVE" })
    .populate("studentId", "name email").sort({ joinedAt: -1 }).lean();
  res.json(members);
}));

router.delete("/houses/:houseId/members/:studentId", requireRole("OWNER"), requireCsrf, requireObjectId("houseId"), requireObjectId("studentId"), asyncRoute(async (req, res) => {
  const house = await BoardingHouse.findOne({ _id: req.params.houseId, ownerId: req.currentUser._id });
  if (!house) return res.status(404).json({ message: "Your property was not found" });
  const membership = await Membership.findOneAndUpdate(
    { boardingHouseId: house._id, studentId: req.params.studentId, status: "ACTIVE" },
    { $set: { status: "REVOKED", revokedAt: new Date() } }, { returnDocument: "after" }
  );
  if (!membership) return res.status(404).json({ message: "Active membership not found" });
  res.json({ message: "Resident access revoked" });
}));

module.exports = router;
