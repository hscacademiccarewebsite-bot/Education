const express = require("express");
const PublicController = require("../controllers/publicController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/home", PublicController.getHome);
router.get("/settings", PublicController.getSiteSettings);
router.get("/about", PublicController.getAbout);
router.get("/faculty", PublicController.getFaculty);
router.get("/contact", PublicController.getContact);

router.get(
  "/admin/site-settings",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  PublicController.getAdminSiteSettings
);
router.patch(
  "/admin/site-settings",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  PublicController.updateAdminSiteSettings
);

router.get(
  "/admin/hero-slides",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  PublicController.getHeroSlidesForAdmin
);
router.post(
  "/admin/hero-slides",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  PublicController.createHeroSlide
);
router.patch(
  "/admin/hero-slides/reorder",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  PublicController.reorderHeroSlides
);
router.patch(
  "/admin/hero-slides/:slideId",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  PublicController.updateHeroSlide
);
router.delete(
  "/admin/hero-slides/:slideId",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  PublicController.deleteHeroSlide
);

module.exports = router;
