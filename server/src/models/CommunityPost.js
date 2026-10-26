const mongoose = require("mongoose");
const postSchema = new mongoose.Schema({
  boardingHouseId: { type: mongoose.Schema.Types.ObjectId, ref: "BoardingHouse", required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["POST", "ANNOUNCEMENT"], required: true },
  content: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
}, { timestamps: true });
postSchema.index({ boardingHouseId: 1, createdAt: -1 });
module.exports = mongoose.model("CommunityPost", postSchema);
