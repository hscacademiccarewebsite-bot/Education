"use client";

import { useId, useState } from "react";
import { useSelector } from "react-redux";
import { selectToken } from "@/lib/features/auth/authSlice";
import Avatar from "@/components/Avatar";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import {
  deleteImageFromCloudinary,
  isCloudinaryUploadConfigured,
  uploadImageToCloudinary,
} from "@/lib/utils/cloudinaryUpload";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { resizeImage } from "@/lib/utils/imageResizer";

const GENERAL_LIMIT = 500 * 1024; // 500 KB
const SLIDER_LIMIT = 3 * 1024 * 1024; // 3 MB
const COURSE_LIMIT = 1.5 * 1024 * 1024; // 1.5 MB

function defaultPixelHint(folder, label, t) {
  const folderName = String(folder || "").toLowerCase();
  const labelText = String(label || "").toLowerCase();

  if (folderName.includes("slider")) {
    return t("uploadField.recommended.slider");
  }
  if (folderName.includes("course")) {
    return t("uploadField.recommended.course");
  }
  if (folderName.includes("profile") || folderName.includes("enrollment") || labelText.includes("photo")) {
    return t("uploadField.recommended.profile");
  }
  if (folderName.includes("site") || labelText.includes("logo")) {
    return t("uploadField.recommended.site");
  }

  return t("uploadField.recommended.default");
}

export default function ImageUploadField({
  label = "",
  asset = null,
  onChange,
  folder = "hsc-courses",
  previewAlt = "",
  className = "",
  previewClassName = "",
  recommendedPixels = "",
}) {
  const inputId = useId();
  const token = useSelector(selectToken);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [error, setError] = useState("");
  const { showSuccess, showError, requestDeleteConfirmation, popupNode } = useActionPopup();
  const { t } = useSiteLanguage();
  const resolvedLabel = label || t("uploadField.label");
  const resolvedPreviewAlt = previewAlt || t("uploadField.previewAlt");

  const isConfigured = isCloudinaryUploadConfigured(token);
  const pixelHint = recommendedPixels || defaultPixelHint(folder, resolvedLabel, t);

  const handleSelectFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      const validationMessage = t("uploadField.errors.invalidImage");
      setError(validationMessage);
      showError(validationMessage);
      return;
    }

    setError("");
    setUploading(true);
    setProgress(5);

    try {
      let finalFile = file;
      const folderName = String(folder || "").toLowerCase();
      let limit = GENERAL_LIMIT;

      if (folderName.includes("slider")) {
        limit = SLIDER_LIMIT;
      } else if (folderName.includes("course")) {
        limit = COURSE_LIMIT;
      }

      if (file.size > limit) {
        setUploadStage("Resizing large image...");
        finalFile = await resizeImage(file, limit);
        setProgress(15);
      }

      setUploadStage(t("uploadField.stage.preparing"));

      const uploaded = await uploadImageToCloudinary(finalFile, folder, {
        onProgress: (value) => setProgress(Math.max(15, value)),
        onStage: (value) => setUploadStage(value),
        token,
      });
      onChange?.(uploaded);
      showSuccess(t("uploadField.messages.uploaded"));
    } catch (uploadError) {
      const resolvedError = uploadError?.message || t("uploadField.errors.uploadFailed");
      setError(resolvedError);
      showError(resolvedError);
    } finally {
      setUploading(false);
      setUploadStage("");
    }
  };

  const handleRemove = async () => {
    if (!asset?.url) {
      return;
    }

    const confirmed = await requestDeleteConfirmation({
      title: t("uploadField.removeConfirm.title"),
      approveLabel: t("uploadField.removeConfirm.approveLabel"),
    });

    if (!confirmed) {
      return;
    }

    setError("");

    const publicId = String(asset?.publicId || "").trim();
    if (!publicId) {
      onChange?.(null);
      showSuccess(t("uploadField.messages.removed"));
      return;
    }

    setRemoving(true);
    try {
      await deleteImageFromCloudinary(publicId, { token });
      onChange?.(null);
      showSuccess(t("uploadField.messages.removedSuccess"));
    } catch (removeError) {
      const resolvedError = removeError?.message || t("uploadField.errors.removeFailed");
      setError(resolvedError);
      showError(resolvedError);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className={`rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-slate-50 p-3 shadow-[0_4px_10px_rgba(15,23,42,0.08)] ${className}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{resolvedLabel}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-500">{pixelHint}</p>

      {!isConfigured ? (
        <p className="mt-2 text-xs text-slate-600">
          {t("uploadField.unavailable")}
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label
            htmlFor={inputId}
            className="site-button-primary cursor-pointer px-3 py-2 text-xs"
          >
            {uploading ? t("uploadField.uploading") : t("uploadField.chooseImage")}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleSelectFile}
            disabled={uploading || removing}
            className="hidden"
          />

          {asset?.url ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || removing}
              className="site-button-secondary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
            >
              {removing ? t("uploadField.removing") : t("uploadField.remove")}
            </button>
          ) : null}
        </div>
      )}

      {uploading ? (
        <>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-600">
            <span>{uploadStage || t("uploadField.stage.uploadingImage")}</span>
            <span>{Math.min(100, Math.max(0, progress))}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[var(--action-start)] transition-all duration-200"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </p>
      ) : null}

      {asset?.url ? (
        <div className="mt-3">
          <Avatar
            src={asset.url}
            name={resolvedPreviewAlt}
            className={previewClassName || "h-20 w-20 rounded-xl border border-slate-200"}
            fallbackClassName="bg-slate-200 text-xs font-bold text-slate-500"
          />
        </div>
      ) : null}
      {popupNode}
    </div>
  );
}
