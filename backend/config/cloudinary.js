const { v2: cloudinary } = require("cloudinary");

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

let initialized = false;

const initializeCloudinary = () => {
  if (initialized) {
    return isCloudinaryConfigured();
  }

  if (!isCloudinaryConfigured()) {
    return false;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  initialized = true;
  return true;
};

module.exports = {
  cloudinary,
  initializeCloudinary,
  isCloudinaryConfigured,
};
