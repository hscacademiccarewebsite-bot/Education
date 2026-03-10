const express = require("express");
const UploadController = require("../controllers/uploadController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(AuthMiddleware.requireAuth);
router.post("/image", UploadController.uploadImage);
router.delete("/image", UploadController.deleteImage);

module.exports = router;
