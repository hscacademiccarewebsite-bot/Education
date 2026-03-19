export default function JsonLd({ data, id }) {
  const payload = Array.isArray(data) ? data.filter(Boolean) : [data].filter(Boolean);

  if (!payload.length) {
    return null;
  }

  return (
    <script
      id={id}
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload.length === 1 ? payload[0] : payload),
      }}
    />
  );
}
