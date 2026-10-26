const express = require("express");
const MaintenanceIssue = require("../models/MaintenanceIssue");
const BoardingHouse = require("../models/BoardingHouse");
const { requireRole, requireCsrf, requireObjectId, requireCommunityAccess, asyncRoute } = require("../middleware/access");
const router = express.Router();

router.get("/houses/:houseId/issues", requireRole("STUDENT", "OWNER"), requireCommunityAccess, asyncRoute(async (req, res) => {
  const owner = req.currentUser.role === "OWNER";
  const filter = { boardingHouseId: req.house._id };
  if (!owner) filter.studentId = req.currentUser._id;
  const issues = await MaintenanceIssue.find(filter).populate("studentId", "name").sort({ createdAt: -1 }).limit(100).lean();
  res.json(issues);
}));

router.post("/houses/:houseId/issues", requireRole("STUDENT"), requireCsrf, requireCommunityAccess, asyncRoute(async (req, res) => {
  const { title, description } = req.body || {};
  if (typeof title !== "string" || title.trim().length < 4 || title.trim().length > 100 ||
      typeof description !== "string" || description.trim().length < 10 || description.trim().length > 1000) {
    return res.status(400).json({ message: "Enter a title (4–100 chars) and description (10–1000 chars)" });
  }
  const issue = await MaintenanceIssue.create({
    boardingHouseId: req.house._id, studentId: req.currentUser._id,
    title: title.trim(), description: description.trim(),
  });
  res.status(201).json(issue);
}));

router.patch("/issues/:id", requireRole("OWNER"), requireCsrf, requireObjectId("id"), asyncRoute(async (req, res) => {
  const { status } = req.body || {};
  if (!["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) return res.status(400).json({ message: "Invalid issue status" });
  const issue = await MaintenanceIssue.findById(req.params.id);
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  const house = await BoardingHouse.findOne({ _id: issue.boardingHouseId, ownerId: req.currentUser._id, status: "ACTIVE" });
  if (!house) return res.status(403).json({ message: "Only this property's owner can update issues" });
  issue.status = status;
  await issue.save();
  res.json(issue);
}));
module.exports = router;
