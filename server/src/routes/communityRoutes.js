const express = require("express");
const CommunityPost = require("../models/CommunityPost");
const BoardingHouse = require("../models/BoardingHouse");
const { asyncRoute, requireRole, requireCsrf, requireObjectId, requireCommunityAccess } = require("../middleware/access");

const router = express.Router();
router.get("/houses/:houseId/posts", requireRole("STUDENT", "OWNER"), requireCommunityAccess, asyncRoute(async (req, res) => {
  const posts = await CommunityPost.find({ boardingHouseId: req.house._id })
    .sort({ createdAt: -1 }).limit(100)
    .populate("authorId", "name role").lean();
  res.json({ house: { _id: req.house._id, title: req.house.title }, posts });
}));

router.post("/houses/:houseId/posts", requireRole("STUDENT", "OWNER"), requireCsrf, requireCommunityAccess, asyncRoute(async (req, res) => {
  const content = req.body?.content;
  if (typeof content !== "string" || content.trim().length < 1 || content.trim().length > 2000) {
    return res.status(400).json({ message: "Post content must be 1–2000 characters" });
  }
  const type = req.currentUser.role === "OWNER" ? "ANNOUNCEMENT" : "POST";
  const post = await CommunityPost.create({
    boardingHouseId: req.house._id, authorId: req.currentUser._id, type, content: content.trim(),
  });
  await post.populate("authorId", "name role");
  res.status(201).json(post);
}));

router.delete("/posts/:postId", requireRole("STUDENT", "OWNER"), requireCsrf, requireObjectId("postId"), asyncRoute(async (req, res) => {
  const post = await CommunityPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: "Post not found" });
  const house = await BoardingHouse.findOne({ _id: post.boardingHouseId, status: "ACTIVE" });
  if (!house) return res.status(404).json({ message: "Boarding house not found" });
  if (String(post.authorId) !== String(req.currentUser._id)) return res.status(403).json({ message: "You may only delete your own posts" });
  const ownsHouse = req.currentUser.role === "OWNER" && String(house.ownerId) === String(req.currentUser._id);
  const Membership = require("../models/Membership");
  const member = req.currentUser.role === "STUDENT" && await Membership.exists({
    boardingHouseId: house._id, studentId: req.currentUser._id, status: "ACTIVE",
  });
  if (!ownsHouse && !member) return res.status(403).json({ message: "Community access revoked" });
  await CommunityPost.deleteOne({ _id: post._id, authorId: req.currentUser._id });
  res.json({ message: "Post deleted" });
}));

module.exports = router;
