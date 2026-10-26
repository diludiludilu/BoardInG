const mongoose = require("mongoose");
const requestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  boardingHouseId: { type: mongoose.Schema.Types.ObjectId, ref: "BoardingHouse", required: true, index: true },
  message: { type: String, default: "", maxlength: 300, trim: true },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });
requestSchema.index({ studentId: 1, boardingHouseId: 1 }, { unique: true });
module.exports = mongoose.model("AccommodationRequest", requestSchema);
