const mongoose = require("mongoose");
const membershipSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  boardingHouseId: { type: mongoose.Schema.Types.ObjectId, ref: "BoardingHouse", required: true, index: true },
  status: { type: String, enum: ["ACTIVE", "REVOKED"], default: "ACTIVE" },
  joinedAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null },
}, { timestamps: true });
membershipSchema.index({ studentId: 1, boardingHouseId: 1 }, { unique: true });
module.exports = mongoose.model("Membership", membershipSchema);
