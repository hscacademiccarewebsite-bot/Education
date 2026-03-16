const mongoose = require("mongoose");
const { cloudinaryAssetSchema } = require("./subSchemas");

const heroSlideSchema = new mongoose.Schema(
  {
    image: { type: cloudinaryAssetSchema, default: undefined },
    imageUrl: { type: String, trim: true },
    priority: { type: Number, default: 0, min: 0 },
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

const footerLinkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    href: { type: String, trim: true },
    requiresAuth: { type: Boolean, default: false },
  },
  { _id: false }
);

const generalSectionSchema = new mongoose.Schema(
  {
    siteTagline: { type: String, trim: true },
    footerText: { type: String, trim: true },
    footerCopyright: { type: String, trim: true },
    footerLinks: { type: [footerLinkSchema], default: () => [] },
    logo: { type: cloudinaryAssetSchema, default: undefined },
    logoUrl: { type: String, trim: true },
    gpa5Count: { type: Number, default: 0, min: 0 },
    publicAdmissionCount: { type: Number, default: 0, min: 0 },
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
    mapEmbedUrl: { type: String, trim: true },
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
