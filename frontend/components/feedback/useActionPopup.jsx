"use client";

import { useCallback } from "react";
import Swal from "sweetalert2";

export function useActionPopup() {
  const showSuccess = useCallback((message, title = "Success") => {
    Swal.fire({
      title,
      text: message,
      icon: "success",
      confirmButtonColor: "#0f766e", // teal-700
      confirmButtonText: "Close",
      padding: "1.5rem",
      customClass: {
        popup: "rounded-2xl",
        title: "text-lg font-bold text-slate-800",
        confirmButton: "rounded-xl font-bold tracking-wider",
      },
    });
  }, []);

  const showError = useCallback((message, title = "Error") => {
    Swal.fire({
      title,
      text: message,
      icon: "error",
      confirmButtonColor: "#e11d48", // rose-600
      confirmButtonText: "Close",
      padding: "1.5rem",
      customClass: {
        popup: "rounded-2xl",
        title: "text-lg font-bold text-slate-800",
        confirmButton: "rounded-xl font-bold tracking-wider",
      },
    });
  }, []);

  const closeAlert = useCallback(() => {
    Swal.close();
  }, []);

  const requestDeleteConfirmation = useCallback(async (optionsOrText = "Are you sure you want to delete this?", titleOrUndefined = "Confirm Deletion") => {
    let text = optionsOrText;
    let title = titleOrUndefined;
    let confirmText = "Yes, delete it";

    if (typeof optionsOrText === "object" && optionsOrText !== null) {
      text = optionsOrText.hasOwnProperty("message") ? optionsOrText.message : (optionsOrText.hasOwnProperty("text") ? optionsOrText.text : "");
      title = optionsOrText.title || "Confirm Deletion";
      confirmText = optionsOrText.approveLabel || optionsOrText.confirmText || "Yes, delete it";
    }

    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: confirmText,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        popup: "rounded-2xl",
        title: "text-lg font-bold text-slate-800",
      },
    });
    return result.isConfirmed;
  }, []);

  const requestConfirmation = useCallback(async (text, title = "Are you sure?", confirmText = "Yes, proceed", cancelText = "Cancel") => {
    const result = await Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0f766e",
      cancelButtonColor: "#64748b",
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      customClass: {
        popup: "rounded-2xl",
        title: "text-lg font-bold text-slate-800",
      },
    });
    return result.isConfirmed;
  }, []);

  const requestPrompt = useCallback(async (text, title = "Input Required", placeholder = "", confirmText = "Submit") => {
    const { value: result } = await Swal.fire({
      title,
      text,
      input: "text",
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonColor: "#0f766e",
      cancelButtonColor: "#64748b",
      confirmButtonText: confirmText,
      reverseButtons: true,
      customClass: {
        popup: "rounded-2xl",
        title: "text-lg font-bold text-slate-800",
        input: "rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500",
      },
    });
    return result; // returns the string or undefined if cancelled
  }, []);

  return {
    showSuccess,
    showError,
    requestDeleteConfirmation,
    requestConfirmation,
    requestPrompt,
    popupNode: null,
    closeAlert,
  };
}
