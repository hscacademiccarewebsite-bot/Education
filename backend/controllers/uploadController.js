const { isCloudinaryConfigured } = require("../config/cloudinary");
const { uploadImageFromDataUri } = require("../utils/cloudinaryAsset");

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
}

module.exports = UploadController;
