const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

function isUnsignedCloudinaryConfigured() {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
}

function canUseBackendUpload(token) {
  return Boolean(API_BASE_URL && token);
}

export function isCloudinaryUploadConfigured(token) {
  return isUnsignedCloudinaryConfigured() || canUseBackendUpload(token);
}

function uploadWithXhr({ url, body, headers = {}, onProgress }) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);

    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        request.setRequestHeader(key, value);
      }
    });

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== "function") {
        return;
      }
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };

    request.onload = () => {
      let payload = {};
      try {
        payload = JSON.parse(request.responseText || "{}");
      } catch (parseError) {
        reject(new Error("Invalid upload server response."));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(payload?.message || payload?.error?.message || "Image upload failed."));
        return;
      }

      resolve(payload?.data || payload);
    };

    request.onerror = () => {
      reject(new Error("Image upload failed. Please try again."));
    };

    request.send(body);
  });
}

function readFileAsDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageToCloudinary(file, folder = "hsc-courses", options = {}) {
  if (!file) {
    throw new Error("No image file selected.");
  }

  const { onProgress, token } = options;

  if (isUnsignedCloudinaryConfigured()) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const uploaded = await uploadWithXhr({
      url: uploadUrl,
      body: formData,
      onProgress,
    });

    return {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    };
  }

  if (canUseBackendUpload(token)) {
    const dataUri = await readFileAsDataUri(file);
    const uploaded = await uploadWithXhr({
      url: `${API_BASE_URL}/uploads/image`,
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dataUri, folder }),
      onProgress,
    });

    return {
      url: uploaded.url,
      publicId: uploaded.publicId || "",
    };
  }

  throw new Error(
    "Image upload is not configured. Set Cloudinary public env or login to use backend upload."
  );
}
