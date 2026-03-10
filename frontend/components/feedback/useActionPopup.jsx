"use client";

import { useCallback } from "react";

export function useActionPopup() {
  const showSuccess = useCallback(() => {}, []);
  const showError = useCallback(() => {}, []);
  const closeAlert = useCallback(() => {}, []);

  const requestDeleteConfirmation = useCallback(async () => true, []);

  return {
    showSuccess,
    showError,
    requestDeleteConfirmation,
    popupNode: null,
    closeAlert,
  };
}
