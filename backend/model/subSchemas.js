const mongoose = require("mongoose");

// Reusable Cloudinary media descriptor.
const cloudinaryAssetSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

module.exports = {
  cloudinaryAssetSchema,
};
