
const mongoose = require("mongoose");

const boardingHouseSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 1500,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    area: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    monthlyRentLkr: {
      type: Number,
      required: true,
      min: 1,
      max: 1000000,
      validate: Number.isInteger,
    },

    facilities: {
      type: [String],
      default: [],
      validate: {
        validator: (items) =>
          items.length <= 10 &&
          items.every(
            (item) =>
              typeof item === "string" &&
              item.length <= 40
          ),
        message: "Invalid facilities",
      },
    },

    imageUrl: {
      type: String,
      default: "",
      maxlength: 500,
      validate: {
        validator(value) {
          if (!value) return true;

          try {
            return new URL(value).protocol === "https:";
          } catch {
            return false;
          }
        },
      },
    },

    availability: {
      type: String,
      enum: ["AVAILABLE", "FULL"],
      default: "AVAILABLE",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "BoardingHouse",
  boardingHouseSchema
);
