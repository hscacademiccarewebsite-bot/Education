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

    const title = String(raw.title || "").trim();
    const caption = String(raw.caption ?? raw.description ?? "").trim();
    const imageAsset = normalizeCloudinaryAsset(raw.image || raw.imageUrl);

    const resolvedPriority =
      raw.priority !== undefined
        ? parsePriority(raw.priority, fallbackPriority)
        : parsePriority(raw.displayOrder, fallbackPriority);

    const resolvedButtonText = String(raw.buttonText || raw.ctaLabel || "Explore Courses").trim();
    const resolvedButtonHref = String(raw.buttonHref || raw.ctaHref || "/courses").trim();
    const buttonEnabled =
      raw.buttonEnabled !== undefined
        ? parseBoolean(raw.buttonEnabled, true)
        : Boolean(resolvedButtonText || resolvedButtonHref);

    return {
      id: raw._id ? String(raw._id) : "",
      title,
      caption,
      image: imageAsset || undefined,
      imageUrl: imageAsset?.url || "",
      buttonEnabled,
      buttonText: resolvedButtonText || "Explore Courses",
      buttonHref: resolvedButtonHref || "/courses",
      priority: resolvedPriority,
      isActive: raw.isActive !== false,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  static normalizeGeneralSection(general) {
    const raw = general?.toObject ? general.toObject() : general || {};
    const logoAsset = normalizeCloudinaryAsset(raw.logo || raw.logoUrl);

    return {
      siteName: String(raw.siteName || "").trim(),
      siteTagline: String(raw.siteTagline || "").trim(),
      footerText: String(raw.footerText || "").trim(),
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
      if (raw?._id) {
        return raw;
      }

      hasChanges = true;
      return {
        ...raw,
        _id: new mongoose.Types.ObjectId(),
        priority: parsePriority(raw?.priority ?? raw?.displayOrder, index),
        displayOrder: parsePriority(raw?.priority ?? raw?.displayOrder, index),
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
          .filter((slide) => slide.isActive && slide.imageUrl)
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

      const title = String(req.body.title || "").trim();
      const caption = String(req.body.caption ?? req.body.description ?? "").trim();
      const imageAsset = normalizeCloudinaryAsset(req.body.image || req.body.imageUrl);
      const buttonEnabled = parseBoolean(req.body.buttonEnabled, true);
      const buttonText = String(req.body.buttonText || req.body.ctaLabel || "Explore Courses").trim();
      const buttonHref = String(req.body.buttonHref || req.body.ctaHref || "/courses").trim();
      const isActive = parseBoolean(req.body.isActive, true);
      const priority = parsePriority(
        req.body.priority ?? req.body.displayOrder,
        siteContent.heroSlides.length
      );

      if (!title) {
        return res.status(400).json({
          success: false,
          message: "title is required.",
        });
      }

      if (!imageAsset?.url) {
        return res.status(400).json({
          success: false,
          message: "image is required.",
        });
      }

      const resolvedButtonText = buttonEnabled ? buttonText || "Explore Courses" : "";
      const resolvedButtonHref = buttonEnabled ? buttonHref || "/courses" : "";

      siteContent.heroSlides.push({
        title,
        caption,
        description: caption,
        image: imageAsset,
        imageUrl: imageAsset.url,
        buttonEnabled,
        buttonText: resolvedButtonText,
        buttonHref: resolvedButtonHref,
        ctaLabel: resolvedButtonText,
        ctaHref: resolvedButtonHref,
        priority,
        displayOrder: priority,
        isActive,
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

      const previousPublicId = slide?.image?.publicId;

      if (req.body.title !== undefined) {
        const title = String(req.body.title || "").trim();
        if (!title) {
          return res.status(400).json({
            success: false,
            message: "title cannot be empty.",
          });
        }
        slide.title = title;
      }

      if (req.body.caption !== undefined || req.body.description !== undefined) {
        const caption = String(req.body.caption ?? req.body.description ?? "").trim();
        slide.caption = caption;
        slide.description = caption;
      }

      if (req.body.isActive !== undefined) {
        slide.isActive = parseBoolean(req.body.isActive, slide.isActive !== false);
      }

      if (req.body.priority !== undefined || req.body.displayOrder !== undefined) {
        const nextPriority = parsePriority(
          req.body.priority ?? req.body.displayOrder,
          slide.priority ?? slide.displayOrder ?? 0
        );
        slide.priority = nextPriority;
        slide.displayOrder = nextPriority;
      }

      if (req.body.buttonEnabled !== undefined) {
        slide.buttonEnabled = parseBoolean(req.body.buttonEnabled, slide.buttonEnabled !== false);
      }

      if (req.body.buttonText !== undefined || req.body.ctaLabel !== undefined) {
        const nextButtonText = String(req.body.buttonText ?? req.body.ctaLabel ?? "").trim();
        slide.buttonText = nextButtonText;
        slide.ctaLabel = nextButtonText;
      }

      if (req.body.buttonHref !== undefined || req.body.ctaHref !== undefined) {
        const nextButtonHref = String(req.body.buttonHref ?? req.body.ctaHref ?? "").trim();
        slide.buttonHref = nextButtonHref;
        slide.ctaHref = nextButtonHref;
      }

      const removeImage = parseBoolean(req.body.removeImage, false);
      const hasImagePayload = req.body.image !== undefined || req.body.imageUrl !== undefined;
      if (removeImage || hasImagePayload) {
        if (removeImage) {
          slide.image = undefined;
          slide.imageUrl = "";
          if (previousPublicId) {
            await deleteCloudinaryAssetByPublicId(previousPublicId);
          }
        } else {
          const nextAsset = normalizeCloudinaryAsset(req.body.image || req.body.imageUrl);
          if (!nextAsset?.url) {
            return res.status(400).json({
              success: false,
              message: "image is invalid.",
            });
          }

          slide.image = nextAsset;
          slide.imageUrl = nextAsset.url;
          const nextPublicId = nextAsset.publicId;
          if (previousPublicId && previousPublicId !== nextPublicId) {
            await deleteCloudinaryAssetByPublicId(previousPublicId);
          }
        }
      }

      const isButtonEnabled = parseBoolean(slide.buttonEnabled, true);
      slide.buttonEnabled = isButtonEnabled;
      if (!isButtonEnabled) {
        slide.buttonText = "";
        slide.buttonHref = "";
        slide.ctaLabel = "";
        slide.ctaHref = "";
      } else {
        const resolvedButtonText = String(slide.buttonText || slide.ctaLabel || "Explore Courses").trim();
        const resolvedButtonHref = String(slide.buttonHref || slide.ctaHref || "/courses").trim();
        slide.buttonText = resolvedButtonText || "Explore Courses";
        slide.buttonHref = resolvedButtonHref || "/courses";
        slide.ctaLabel = slide.buttonText;
        slide.ctaHref = slide.buttonHref;
      }

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
            : parsePriority(slide.priority ?? slide.displayOrder, index);
        slide.priority = nextPriority;
        slide.displayOrder = nextPriority;
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
