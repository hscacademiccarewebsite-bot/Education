const { isCloudinaryConfigured } = require("../config/cloudinary");
const {
  uploadImageFromDataUri,
  deleteCloudinaryAssetByPublicId,
} = require("../utils/cloudinaryAsset");

class UploadController {
  static async uploadImage(req, res) {
    try {
      const { dataUri, folder } = req.body;

      if (!dataUri) {
        return res.status(400).json({
          success: false,
          message: "dataUri is required.",
        });
      }

      // Enforce size limits on backend
      const folderName = String(folder || "").toLowerCase();
      let limit = 500 * 1024; // Default 500 KB

      if (folderName.includes("slider")) {
        limit = 3 * 1024 * 1024; // 3 MB
      } else if (folderName.includes("course")) {
        limit = 1.5 * 1024 * 1024; // 1.5 MB
      }
      
      // Approximate size from base64 (Data URI)
      // Base64 is ~33% larger than raw data, so we adjust the limit check
      const base64Length = dataUri.split(",")[1]?.length || 0;
      const approximateSizeBytes = (base64Length * 3) / 4;

      if (approximateSizeBytes > limit) {
        const readableLimit = limit < 1024 * 1024 ? "500 KB" : `${limit / (1024 * 1024)} MB`;
        return res.status(400).json({
          success: false,
          message: `Image is too large. Max allowed size is ${readableLimit}.`,
        });
      }

      if (!isCloudinaryConfigured()) {
        return res.status(503).json({
          success: false,
          message: "Cloudinary is not configured on backend.",
        });
      }

      const uploaded = await uploadImageFromDataUri(dataUri, folder);

      return res.status(201).json({
        success: true,
        data: uploaded,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image.",
        error: error.message,
      });
    }
  }

  static async deleteImage(req, res) {
    try {
      const { publicId } = req.body;

      const normalizedPublicId = String(publicId || "").trim();
      if (!normalizedPublicId) {
        return res.status(400).json({
          success: false,
          message: "publicId is required.",
        });
      }

      if (!isCloudinaryConfigured()) {
        return res.status(503).json({
          success: false,
          message: "Cloudinary is not configured on backend.",
        });
      }

      await deleteCloudinaryAssetByPublicId(normalizedPublicId);

      return res.status(200).json({
        success: true,
        message: "Image deleted successfully.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete image.",
        error: error.message,
      });
    }
  }
}

module.exports = UploadController;
