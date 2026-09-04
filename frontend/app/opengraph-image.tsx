import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Rollnexa marketplace for heavy equipment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#111827", color: "#fbbf24", fontFamily: "sans-serif", padding: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", border: "2px solid #fbbf24", borderRadius: 24, padding: 56 }}>
          <div style={{ fontSize: 32, textTransform: "uppercase", letterSpacing: 6, opacity: 0.8 }}>Rollnexa</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05 }}>Buy & Sell Heavy Machinery</div>
            <div style={{ fontSize: 28, color: "#f3f4f6", maxWidth: 800 }}>Trusted listings, premium dealers, and ready-to-buy equipment across the industry.</div>
          </div>
          <div style={{ fontSize: 24, color: "#fbbf24" }}>rollnexa.com</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
