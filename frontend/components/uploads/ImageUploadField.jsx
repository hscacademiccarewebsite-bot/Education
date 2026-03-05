"use client";

import { useId, useState } from "react";
import { useSelector } from "react-redux";
import { selectToken } from "@/lib/features/auth/authSlice";
import { isCloudinaryUploadConfigured, uploadImageToCloudinary } from "@/lib/utils/cloudinaryUpload";

export default function ImageUploadField({
  label = "Image Upload",
  asset = null,
  onChange,
  folder = "hsc-courses",
  previewAlt = "Uploaded image",
  className = "",
}) {
  const inputId = useId();
  const token = useSelector(selectToken);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const isConfigured = isCloudinaryUploadConfigured(token);

  const handleSelectFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const uploaded = await uploadImageToCloudinary(file, folder, {
        onProgress: (value) => setProgress(value),
        token,
      });
      onChange?.(uploaded);
    } catch (uploadError) {
      setError(uploadError?.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-3 ${className}`}>
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</p>

      {!isConfigured ? (
        <p className="mt-2 text-xs text-slate-600">
          Upload is unavailable. Login first or set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and
          `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label
            htmlFor={inputId}
            className="cursor-pointer rounded-lg bg-cyan-600 px-3 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-700"
          >
            {uploading ? "Uploading..." : "Choose Image"}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleSelectFile}
            disabled={uploading}
            className="hidden"
          />

          {asset?.url ? (
            <button
              type="button"
              onClick={() => onChange?.(null)}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-rose-700 transition hover:bg-rose-100"
            >
              Remove
            </button>
          ) : null}
        </div>
      )}

      {uploading ? (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-cyan-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </p>
      ) : null}

      {asset?.url ? (
        <img src={asset.url} alt={previewAlt} className="mt-3 h-28 w-full rounded-xl object-cover" />
      ) : null}
    </div>
  );
}
