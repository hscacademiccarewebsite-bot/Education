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

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Initial scale down if very large (prevent memory issues)
        const maxInitialDimension = 2500;
        if (width > maxInitialDimension || height > maxInitialDimension) {
          const ratio = Math.min(maxInitialDimension / width, maxInitialDimension / height);
          width *= ratio;
          height *= ratio;
        }

        let quality = 0.9;
        let scale = 1.0;

        const attemptResize = () => {
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create image blob."));
                return;
              }

              if (blob.size <= maxSizeBytes || (quality <= 0.5 && scale <= 0.3)) {
                // If it's still bigger but we've reached our limits, just return what we have
                // with a filename to make it a File object if possible
                const resizedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                // Reduce quality first
                if (quality > 0.5) {
                  quality -= 0.1;
                } else {
                  // Then reduce scale
                  scale -= 0.1;
                  quality = 0.8; // reset quality slightly for smaller dimensions
                }
                attemptResize();
              }
            },
            "image/jpeg",
            quality
          );
        };

        attemptResize();
      };
      img.onerror = () => reject(new Error("Failed to load image for resizing."));
    };
    reader.onerror = () => reject(new Error("Failed to read file for resizing."));
  });
}
