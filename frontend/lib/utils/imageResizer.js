/**
 * Resizes and compresses an image file to be under a specific size limit.
 * 
 * @param {File} file - The original image file.
 * @param {number} maxSizeBytes - The maximum allowed size in bytes.
 * @returns {Promise<File|Blob>} - A promise that resolves to the resized File or Blob.
 */
export async function resizeImage(file, maxSizeBytes) {
  if (file.size <= maxSizeBytes) {
    return file;
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(imageUrl);
    };

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const maxInitialDimension = 2500;
        if (width > maxInitialDimension || height > maxInitialDimension) {
          const ratio = Math.min(maxInitialDimension / width, maxInitialDimension / height);
          width *= ratio;
          height *= ratio;
        }

        let quality = 0.9;
        let scale = 1.0;

        const attemptResize = () => {
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            cleanup();
            reject(new Error("Failed to create image canvas."));
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                cleanup();
                reject(new Error("Failed to create image blob."));
                return;
              }

              if (blob.size <= maxSizeBytes || (quality <= 0.5 && scale <= 0.3)) {
                cleanup();
                const resizedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                if (quality > 0.5) {
                  quality -= 0.1;
                } else {
                  scale -= 0.1;
                  quality = 0.8;
                }
                attemptResize();
              }
            },
            "image/jpeg",
            quality
          );
        };

        attemptResize();
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error("Failed to resize image."));
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("Failed to load image for resizing."));
    };

    img.src = imageUrl;
  });
}
