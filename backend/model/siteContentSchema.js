const mongoose = require("mongoose");
const { cloudinaryAssetSchema } = require("./subSchemas");

const heroSlideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    caption: { type: String, trim: true },
    description: { type: String, trim: true },
    image: { type: cloudinaryAssetSchema, default: undefined },
    imageUrl: { type: String, trim: true },
    buttonEnabled: { type: Boolean, default: true },
    buttonText: { type: String, trim: true },
    buttonHref: { type: String, trim: true },
    ctaLabel: { type: String, trim: true },
    ctaHref: { type: String, trim: true },
    priority: { type: Number, default: 0, min: 0 },
    displayOrder: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const aboutSectionSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    highlights: [{ type: String, trim: true }],
    mission: { type: String, trim: true },
  },
  { _id: false }
);

const generalSectionSchema = new mongoose.Schema(
  {
    siteName: { type: String, trim: true },
    siteTagline: { type: String, trim: true },
    footerText: { type: String, trim: true },
    logo: { type: cloudinaryAssetSchema, default: undefined },
    logoUrl: { type: String, trim: true },
  },
  { _id: false }
);

const contactSectionSchema = new mongoose.Schema(
  {
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    facebookPage: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    officeHours: { type: String, trim: true },
  },
  { _id: false }
);

const siteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "default",
      trim: true,
    },
    heroSlides: [heroSlideSchema],
    general: { type: generalSectionSchema, default: () => ({}) },
    about: { type: aboutSectionSchema, default: () => ({}) },
    contact: { type: contactSectionSchema, default: () => ({}) },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);
