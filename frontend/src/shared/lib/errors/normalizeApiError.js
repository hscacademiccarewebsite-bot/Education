export function normalizeApiError(error, fallbackMessage = "Request failed.") {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error?.data?.message) {
    return error.data.message;
  }

  if (error?.error) {
    return error.error;
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackMessage;
}

