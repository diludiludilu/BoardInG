const mongoose = require("mongoose");
const issueSchema = new mongoose.Schema({
  boardingHouseId: { type: mongoose.Schema.Types.ObjectId, ref: "BoardingHouse", required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 4, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
  status: { type: String, enum: ["OPEN", "IN_PROGRESS", "RESOLVED"], default: "OPEN" },
}, { timestamps: true });
module.exports = mongoose.model("MaintenanceIssue", issueSchema);
