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

function readFileAsDataUri(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== "function") {
        return;
      }
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageToCloudinary(file, folder = "hsc-courses", options = {}) {
  if (!file) {
    throw new Error("No image file selected.");
  }

  const { onProgress, onStage, token } = options;

  if (isUnsignedCloudinaryConfigured()) {
    if (typeof onStage === "function") {
      onStage("Uploading image...");
    }
    if (typeof onProgress === "function") {
      onProgress(5);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const uploaded = await uploadWithXhr({
      url: uploadUrl,
      body: formData,
      onProgress: (value) => {
        if (typeof onProgress === "function") {
          onProgress(Math.min(98, Math.max(5, value)));
        }
      },
    });

    if (typeof onProgress === "function") {
      onProgress(100);
    }

    return {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    };
  }

  if (canUseBackendUpload(token)) {
    if (typeof onStage === "function") {
      onStage("Preparing image...");
    }
    if (typeof onProgress === "function") {
      onProgress(5);
    }

    const dataUri = await readFileAsDataUri(file, (value) => {
      if (typeof onProgress === "function") {
        const mapped = Math.round(5 + value * 0.3);
        onProgress(Math.min(35, Math.max(5, mapped)));
      }
    });

    if (typeof onStage === "function") {
      onStage("Uploading image...");
    }

    const uploaded = await uploadWithXhr({
      url: `${API_BASE_URL}/uploads/image`,
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dataUri, folder }),
      onProgress: (value) => {
        if (typeof onProgress === "function") {
          const mapped = Math.round(35 + value * 0.57);
          onProgress(Math.min(92, Math.max(35, mapped)));
        }
      },
    });

    if (typeof onStage === "function") {
      onStage("Finalizing...");
    }
    if (typeof onProgress === "function") {
      onProgress(100);
    }

    return {
      url: uploaded.url,
      publicId: uploaded.publicId || "",
    };
  }

  throw new Error(
    "Image upload is not configured. Set Cloudinary public env or login to use backend upload."
  );
}

export async function deleteImageFromCloudinary(publicId, options = {}) {
  const normalizedPublicId = String(publicId || "").trim();
  if (!normalizedPublicId) {
    return { success: true, skipped: true };
  }

  const { token } = options;
  if (!canUseBackendUpload(token)) {
    throw new Error("Login required to delete this image from Cloudinary.");
  }

  const response = await fetch(`${API_BASE_URL}/uploads/image`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ publicId: normalizedPublicId }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to delete image from Cloudinary.");
  }

  return payload;
}
