const {
  cloudinary,
  initializeCloudinary,
  isCloudinaryConfigured,
} = require("../config/cloudinary");

const DEFAULT_UPLOAD_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || "hsc-academic/courses";

const normalizeCloudinaryAsset = (asset) => {
  if (!asset) {
    return null;
  }

  if (typeof asset === "string") {
    const url = asset.trim();
    return url ? { url, publicId: "" } : null;
  }

  if (typeof asset === "object") {
    const url = String(asset.url || "").trim();
    const publicId = String(asset.publicId || "").trim();
    return url ? { url, publicId } : null;
  }

  return null;
};

const uploadImageFromDataUri = async (dataUri, folder = DEFAULT_UPLOAD_FOLDER) => {
  if (!dataUri) {
    return null;
  }

  if (!isCloudinaryConfigured() || !initializeCloudinary()) {
    throw new Error("Cloudinary is not configured on backend.");
  }

  const payload = String(dataUri).trim();
  if (!payload.startsWith("data:")) {
    throw new Error("Invalid image payload. Expected data URI format.");
  }

  const uploaded = await cloudinary.uploader.upload(payload, {
    folder,
    resource_type: "image",
    overwrite: true,
  });

  return {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
};

const deleteCloudinaryAssetByPublicId = async (publicId) => {
  if (!publicId) {
    return;
  }

  if (!isCloudinaryConfigured() || !initializeCloudinary()) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (error) {
    console.warn("Cloudinary asset deletion skipped:", error.message);
  }
};

module.exports = {
  normalizeCloudinaryAsset,
  uploadImageFromDataUri,
  deleteCloudinaryAssetByPublicId,
};
