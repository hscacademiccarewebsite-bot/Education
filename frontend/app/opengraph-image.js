import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/src/shared/seo/site";

export const alt = SITE_NAME;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #ecfdf5 0%, #f8fafc 48%, #e0f2fe 100%)",
          padding: "56px",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              height: "72px",
              width: "72px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "22px",
              background: "#0f172a",
              color: "#ffffff",
              fontSize: "26px",
              fontWeight: 800,
            }}
          >
            HSC
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div
              style={{
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#0f766e",
              }}
            >
              Academic Care
            </div>
            <div
              style={{
                fontSize: "18px",
                color: "#475569",
              }}
            >
              Best HSC coaching center in Rangamati
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            maxWidth: "920px",
          }}
        >
          <div
            style={{
              fontSize: "58px",
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            The best coaching center in Rangamati for HSC Science, board exams, and admission preparation.
          </div>
          <div
            style={{
              display: "flex",
              gap: "18px",
              fontSize: "22px",
              color: "#334155",
            }}
          >
            <span>Rangamati</span>
            <span>HSC Science</span>
            <span>Admissions</span>
            <span>Results</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
