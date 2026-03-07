const mongoose = require("mongoose");
const Batch = require("../model/batchSchema");
const User = require("../model/userSchema");
const SiteContent = require("../model/siteContentSchema");
const {
  normalizeCloudinaryAsset,
  deleteCloudinaryAssetByPublicId,
} = require("../utils/cloudinaryAsset");

const normalizeRole = (role) =>
  role === "admin" ? "Admin" : role === "moderator" ? "Moderator" : "Teacher";

const parseBoolean = (value, fallbackValue = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallbackValue;
};

const parsePriority = (value, fallbackValue = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return Math.max(0, Number(fallbackValue) || 0);
  }
  return Math.max(0, Math.floor(parsed));
};

const parseStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeFooterLinks = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const raw = item?.toObject ? item.toObject() : item || {};
      const label = String(raw.label || "").trim();
      const href = String(raw.href || "").trim();

      if (!label || !href || !href.startsWith("/")) {
        return null;
      }

      return {
        label,
        href,
        requiresAuth: parseBoolean(raw.requiresAuth, false),
      };
    })
    .filter(Boolean)
    .slice(0, 12);
};

class PublicController {
  static async getOrCreateSiteContent() {
    let content = await SiteContent.findOne({ key: "default" });
    if (!content) {
      content = await SiteContent.create({
        key: "default",
      });
    }
    return content;
  }

  static normalizeHeroSlide(slide, fallbackPriority = 0) {
    const raw = slide?.toObject ? slide.toObject() : slide || {};
    const imageAsset = normalizeCloudinaryAsset(raw.image || raw.imageUrl);

    const resolvedPriority = parsePriority(raw.priority, fallbackPriority);

    return {
      id: raw._id ? String(raw._id) : "",
      image: imageAsset || undefined,
      imageUrl: imageAsset?.url || "",
      priority: resolvedPriority,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  static normalizeGeneralSection(general) {
    const raw = general?.toObject ? general.toObject() : general || {};
    const logoAsset = normalizeCloudinaryAsset(raw.logo || raw.logoUrl);
    const footerLinks = normalizeFooterLinks(raw.footerLinks);

    return {
      siteName: String(raw.siteName || "").trim(),
      siteTagline: String(raw.siteTagline || "").trim(),
      footerText: String(raw.footerText || "").trim(),
      footerCopyright: String(raw.footerCopyright || "").trim(),
      footerLinks,
      logo: logoAsset || undefined,
      logoUrl: logoAsset?.url || "",
    };
  }

  static sortHeroSlides(slides = []) {
    return [...slides].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });
  }

  static async ensureHeroSlideIds(siteContent) {
    const slides = siteContent.heroSlides || [];
    let hasChanges = false;

    const normalizedSlides = slides.map((slide, index) => {
      const raw = slide?.toObject ? slide.toObject() : slide;
      const resolvedPriority = parsePriority(raw?.priority, index);
      if (!raw?._id || raw?.priority !== resolvedPriority) {
        hasChanges = true;
      }

      return {
        ...raw,
        _id: raw?._id || new mongoose.Types.ObjectId(),
        priority: resolvedPriority,
      };
    });

    if (hasChanges) {
      siteContent.heroSlides = normalizedSlides;
      await siteContent.save();
    }
  }

  static mapFaculty(users) {
    return users.map((user) => ({
      id: user._id,
      fullName: user.fullName,
      role: normalizeRole(user.role),
      email: user.email || "",
      phone: user.phone || "",
      profilePhotoUrl: user.profilePhoto?.url || "",
      assignedBatches: (user.assignedBatches || []).map((batch) => ({
        id: batch._id,
        name: batch.name,
      })),
    }));
  }

  static async getHome(req, res) {
    try {
      const [siteContent, runningCourses, facultyUsers] = await Promise.all([
        PublicController.getOrCreateSiteContent(),
        Batch.find({ status: { $in: ["active", "upcoming"] } })
          .select(
            "_id name slug description monthlyFee currency status banner thumbnail facebookGroupUrl startsAt"
          )
          .sort({ status: 1, startsAt: 1, createdAt: -1 })
          .limit(12),
        User.find({
          role: { $in: ["teacher", "moderator"] },
          isActive: true,
        })
          .select("_id fullName role email phone profilePhoto assignedBatches")
          .populate("assignedBatches", "name")
          .sort({ fullName: 1 })
          .limit(24),
      ]);

      await PublicController.ensureHeroSlideIds(siteContent);

      const heroSlides = PublicController.sortHeroSlides(
        (siteContent.heroSlides || [])
          .map((slide, index) => PublicController.normalizeHeroSlide(slide, index))
          .filter((slide) => slide.imageUrl)
      );

      return res.status(200).json({
        success: true,
        data: {
          general: PublicController.normalizeGeneralSection(siteContent.general),
          heroSlides,
          runningCourses,
          about: siteContent.about,
          contact: siteContent.contact,
          faculty: PublicController.mapFaculty(facultyUsers),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load homepage data.",
        error: error.message,
      });
    }
  }

  static async getHeroSlidesForAdmin(req, res) {
    try {
      const siteContent = await PublicController.getOrCreateSiteContent();
      await PublicController.ensureHeroSlideIds(siteContent);

      const heroSlides = PublicController.sortHeroSlides(
        (siteContent.heroSlides || []).map((slide, index) =>
          PublicController.normalizeHeroSlide(slide, index)
        )
      );

      return res.status(200).json({
        success: true,
        count: heroSlides.length,
        data: heroSlides,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load hero slides.",
        error: error.message,
      });
    }
  }

  static async createHeroSlide(req, res) {
    try {
      const siteContent = await PublicController.getOrCreateSiteContent();
      await PublicController.ensureHeroSlideIds(siteContent);

      const imageAsset = normalizeCloudinaryAsset(req.body.image || req.body.imageUrl);
      const priority = parsePriority(req.body.priority, siteContent.heroSlides.length);

      if (!imageAsset?.url) {
        return res.status(400).json({
          success: false,
          message: "image is required.",
        });
      }

      siteContent.heroSlides.push({
        image: imageAsset,
        imageUrl: imageAsset.url,
        priority,
      });
      siteContent.updatedBy = req.user?._id;
      await siteContent.save();

      const createdSlide = siteContent.heroSlides[siteContent.heroSlides.length - 1];
      return res.status(201).json({
        success: true,
        message: "Hero slide created successfully.",
        data: PublicController.normalizeHeroSlide(createdSlide, priority),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create hero slide.",
        error: error.message,
      });
    }
  }

  static async updateHeroSlide(req, res) {
    try {
      const { slideId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(slideId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid slideId.",
        });
      }

      const siteContent = await PublicController.getOrCreateSiteContent();
      await PublicController.ensureHeroSlideIds(siteContent);

      const slide = siteContent.heroSlides.id(slideId);
      if (!slide) {
        return res.status(404).json({
          success: false,
          message: "Hero slide not found.",
        });
      }

      const previousPublicId = slide?.image?.publicId || "";

      if (req.body.priority !== undefined) {
        const nextPriority = parsePriority(req.body.priority, slide.priority ?? 0);
        slide.priority = nextPriority;
      }

      const removeImage = parseBoolean(req.body.removeImage, false);
      const hasImagePayload = req.body.image !== undefined || req.body.imageUrl !== undefined;

      if (removeImage && !hasImagePayload) {
        return res.status(400).json({
          success: false,
          message: "image is required. Use delete endpoint to remove a slide.",
        });
      }

      if (hasImagePayload) {
        const nextAsset = normalizeCloudinaryAsset(req.body.image || req.body.imageUrl);
        if (!nextAsset?.url) {
          return res.status(400).json({
            success: false,
            message: "image is invalid.",
          });
        }

        slide.image = nextAsset;
        slide.imageUrl = nextAsset.url;
        const nextPublicId = nextAsset.publicId || "";
        if (previousPublicId && previousPublicId !== nextPublicId) {
          await deleteCloudinaryAssetByPublicId(previousPublicId);
        }
      }

      const normalizedAsset = normalizeCloudinaryAsset(slide.image || slide.imageUrl);
      if (!normalizedAsset?.url) {
        return res.status(400).json({
          success: false,
          message: "image is required.",
        });
      }
      slide.image = normalizedAsset;
      slide.imageUrl = normalizedAsset.url;

      siteContent.updatedBy = req.user?._id;
      await siteContent.save();

      return res.status(200).json({
        success: true,
        message: "Hero slide updated successfully.",
        data: PublicController.normalizeHeroSlide(slide),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update hero slide.",
        error: error.message,
      });
    }
  }

  static async reorderHeroSlides(req, res) {
    try {
      const { orderedSlideIds } = req.body;
      if (!Array.isArray(orderedSlideIds) || orderedSlideIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "orderedSlideIds must be a non-empty array.",
        });
      }

      const hasInvalidId = orderedSlideIds.some((id) => !mongoose.Types.ObjectId.isValid(id));
      if (hasInvalidId) {
        return res.status(400).json({
          success: false,
          message: "orderedSlideIds contains invalid ObjectId.",
        });
      }

      const siteContent = await PublicController.getOrCreateSiteContent();
      await PublicController.ensureHeroSlideIds(siteContent);

      const orderMap = new Map(orderedSlideIds.map((id, index) => [String(id), index]));
      siteContent.heroSlides.forEach((slide, index) => {
        const mappedPriority = orderMap.get(String(slide._id));
        const nextPriority =
          mappedPriority !== undefined
            ? mappedPriority
            : parsePriority(slide.priority, index);
        slide.priority = nextPriority;
      });

      siteContent.updatedBy = req.user?._id;
      await siteContent.save();

      const sorted = PublicController.sortHeroSlides(
        siteContent.heroSlides.map((slide, index) =>
          PublicController.normalizeHeroSlide(slide, index)
        )
      );

      return res.status(200).json({
        success: true,
        message: "Hero slide priority updated successfully.",
        data: sorted,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to reorder hero slides.",
        error: error.message,
      });
    }
  }

  static async deleteHeroSlide(req, res) {
    try {
      const { slideId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(slideId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid slideId.",
        });
      }

      const siteContent = await PublicController.getOrCreateSiteContent();
      await PublicController.ensureHeroSlideIds(siteContent);

      const slide = siteContent.heroSlides.id(slideId);
      if (!slide) {
        return res.status(404).json({
          success: false,
          message: "Hero slide not found.",
        });
      }

      const previousPublicId = slide?.image?.publicId;
      slide.deleteOne();
      siteContent.updatedBy = req.user?._id;
      await siteContent.save();

      if (previousPublicId) {
        await deleteCloudinaryAssetByPublicId(previousPublicId);
      }

      return res.status(200).json({
        success: true,
        message: "Hero slide deleted successfully.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete hero slide.",
        error: error.message,
      });
    }
  }

  static async getAbout(req, res) {
    try {
      const siteContent = await PublicController.getOrCreateSiteContent();
      return res.status(200).json({
        success: true,
        data: siteContent.about,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load about us data.",
        error: error.message,
      });
    }
  }

  static async getSiteSettings(req, res) {
    try {
      const siteContent = await PublicController.getOrCreateSiteContent();
      return res.status(200).json({
        success: true,
        data: {
          general: PublicController.normalizeGeneralSection(siteContent.general),
          about: siteContent.about,
          contact: siteContent.contact,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load site settings.",
        error: error.message,
      });
    }
  }

  static async getAdminSiteSettings(req, res) {
    try {
      const siteContent = await PublicController.getOrCreateSiteContent();
      return res.status(200).json({
        success: true,
        data: {
          general: PublicController.normalizeGeneralSection(siteContent.general),
          about: siteContent.about,
          contact: siteContent.contact,
          metadata: {
            updatedAt: siteContent.updatedAt,
            heroSlidesCount: (siteContent.heroSlides || []).length,
          },
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load admin site settings.",
        error: error.message,
      });
    }
  }

  static async updateAdminSiteSettings(req, res) {
    try {
      const siteContent = await PublicController.getOrCreateSiteContent();
      const { general, about, contact } = req.body || {};

      siteContent.general = siteContent.general || {};
      siteContent.about = siteContent.about || {};
      siteContent.contact = siteContent.contact || {};

      if (general && typeof general === "object") {
        if (general.siteName !== undefined) {
          siteContent.general.siteName = String(general.siteName || "").trim();
        }

        if (general.siteTagline !== undefined) {
          siteContent.general.siteTagline = String(general.siteTagline || "").trim();
        }

        if (general.footerText !== undefined) {
          siteContent.general.footerText = String(general.footerText || "").trim();
        }

        if (general.footerCopyright !== undefined) {
          siteContent.general.footerCopyright = String(general.footerCopyright || "").trim();
        }

        if (general.footerLinks !== undefined) {
          siteContent.general.footerLinks = normalizeFooterLinks(general.footerLinks);
        }

        if (
          general.logo !== undefined ||
          general.logoUrl !== undefined ||
          general.removeLogo !== undefined
        ) {
          const previousPublicId = siteContent.general?.logo?.publicId;
          const removeLogo = parseBoolean(general.removeLogo, false);

          if (removeLogo) {
            siteContent.general.logo = undefined;
            siteContent.general.logoUrl = "";
            if (previousPublicId) {
              await deleteCloudinaryAssetByPublicId(previousPublicId);
            }
          } else {
            const logoAsset = normalizeCloudinaryAsset(general.logo || general.logoUrl);
            if (!logoAsset?.url) {
              return res.status(400).json({
                success: false,
                message: "general.logo is invalid.",
              });
            }

            siteContent.general.logo = logoAsset;
            siteContent.general.logoUrl = logoAsset.url;
            const nextPublicId = logoAsset.publicId;
            if (previousPublicId && previousPublicId !== nextPublicId) {
              await deleteCloudinaryAssetByPublicId(previousPublicId);
            }
          }
        }
      }

      if (about && typeof about === "object") {
        if (about.heading !== undefined) {
          siteContent.about.heading = String(about.heading || "").trim();
        }

        if (about.description !== undefined) {
          siteContent.about.description = String(about.description || "").trim();
        }

        if (about.mission !== undefined) {
          siteContent.about.mission = String(about.mission || "").trim();
        }

        if (about.highlights !== undefined) {
          siteContent.about.highlights = parseStringArray(about.highlights);
        }
      }

      if (contact && typeof contact === "object") {
        if (contact.email !== undefined) {
          siteContent.contact.email = String(contact.email || "").trim();
        }

        if (contact.phone !== undefined) {
          siteContent.contact.phone = String(contact.phone || "").trim();
        }

        if (contact.address !== undefined) {
          siteContent.contact.address = String(contact.address || "").trim();
        }

        if (contact.officeHours !== undefined) {
          siteContent.contact.officeHours = String(contact.officeHours || "").trim();
        }

        if (contact.facebookPage !== undefined) {
          siteContent.contact.facebookPage = String(contact.facebookPage || "").trim();
        }

        if (contact.whatsapp !== undefined) {
          siteContent.contact.whatsapp = String(contact.whatsapp || "").trim();
        }
      }

      siteContent.updatedBy = req.user?._id;
      await siteContent.save();

      return res.status(200).json({
        success: true,
        message: "Site settings updated successfully.",
        data: {
          general: PublicController.normalizeGeneralSection(siteContent.general),
          about: siteContent.about,
          contact: siteContent.contact,
          metadata: {
            updatedAt: siteContent.updatedAt,
            heroSlidesCount: (siteContent.heroSlides || []).length,
          },
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update site settings.",
        error: error.message,
      });
    }
  }

  static async getFaculty(req, res) {
    try {
      const facultyUsers = await User.find({
        role: { $in: ["teacher", "moderator"] },
        isActive: true,
      })
        .select("_id fullName role email phone profilePhoto assignedBatches")
        .populate("assignedBatches", "name")
        .sort({ fullName: 1 });

      return res.status(200).json({
        success: true,
        count: facultyUsers.length,
        data: PublicController.mapFaculty(facultyUsers),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load faculty data.",
        error: error.message,
      });
    }
  }

  static async getContact(req, res) {
    try {
      const siteContent = await PublicController.getOrCreateSiteContent();
      return res.status(200).json({
        success: true,
        data: siteContent.contact,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load contact data.",
        error: error.message,
      });
    }
  }
}

module.exports = PublicController;
