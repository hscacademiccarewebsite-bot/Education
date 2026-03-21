function normalizeWhatsappHref(raw = "") {
  const value = String(raw || "").trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (/^(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(value)) {
    return `https://${value}`;
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  // Accept common Bangladesh local formats and upgrade them to international format.
  if (digits.startsWith("880")) {
    return `https://wa.me/${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `https://wa.me/88${digits}`;
  }

  if (digits.startsWith("1") && digits.length === 10) {
    return `https://wa.me/880${digits}`;
  }

  return `https://wa.me/${digits}`;
}

export { normalizeWhatsappHref };
