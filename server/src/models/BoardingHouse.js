const mongoose = require("mongoose");

const LOCAL_DEMO_PATH_REGEX =
  /^\/demo\/houses\/[a-zA-Z0-9_-]+\.(jpe?g|png|webp|svg|avif)$/i;

function isValidImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const trimmed = value.trim();
  if (trimmed.length > 500) return false;

  // Reject protocol-relative URLs
  if (trimmed.startsWith("//")) return false;

  // Local demo images: strictly restricted to approved directory /demo/houses/
  if (trimmed.startsWith("/")) {
    let decoded;
    try {
      decoded = decodeURIComponent(trimmed);
    } catch {
      return false;
    }

    // Reject path traversals, backslashes, and protocol-relative attempts in decoded forms
    if (
      decoded.includes("..") ||
      decoded.includes("\\") ||
      decoded.startsWith("//")
    ) {
      return false;
    }

    return (
      LOCAL_DEMO_PATH_REGEX.test(trimmed) &&
      LOCAL_DEMO_PATH_REGEX.test(decoded)
    );
  }

  // Remote HTTPS URL
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidImageUrlOrEmpty(value) {
  if (!value) return true;
  return isValidImageUrl(value);
}

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
        validator: isValidImageUrlOrEmpty,
        message: "Invalid image URL",
      },
    },

    imageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (items) =>
          Array.isArray(items) &&
          items.length <= 5 &&
          items.every(
            (item) =>
              typeof item === "string" &&
              isValidImageUrl(item)
          ),
        message: "Invalid image URLs (maximum 5 valid HTTPS or safe local paths)",
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

// Synchronize imageUrl and imageUrls on document validation/save
boardingHouseSchema.pre("validate", function () {
  if (Array.isArray(this.imageUrls) && this.imageUrls.length > 0) {
    this.imageUrl = this.imageUrls[0];
  } else if (this.imageUrl) {
    this.imageUrls = [this.imageUrl];
  } else {
    this.imageUrl = "";
    this.imageUrls = [];
  }
});

// Synchronize imageUrl and imageUrls on findOneAndUpdate queries
boardingHouseSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (!update) return;

  const setObj = update.$set || update;

  if (Object.hasOwn(setObj, "imageUrls")) {
    if (Array.isArray(setObj.imageUrls) && setObj.imageUrls.length > 0) {
      setObj.imageUrl = setObj.imageUrls[0];
    } else {
      setObj.imageUrl = "";
      setObj.imageUrls = [];
    }
  } else if (Object.hasOwn(setObj, "imageUrl")) {
    setObj.imageUrls = setObj.imageUrl ? [setObj.imageUrl] : [];
  }
});

module.exports = mongoose.model(
  "BoardingHouse",
  boardingHouseSchema
);
