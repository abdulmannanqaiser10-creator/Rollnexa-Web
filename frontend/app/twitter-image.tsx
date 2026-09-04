import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Rollnexa marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#fbbf24", color: "#111827", fontFamily: "sans-serif", padding: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", borderRadius: 24, padding: 56, background: "white" }}>
          <div style={{ fontSize: 28, fontWeight: 700, textTransform: "uppercase" }}>Rollnexa</div>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1 }}>Heavy equipment buyers and sellers meet here.</div>
          <div style={{ fontSize: 24 }}>Trusted inventory · Verified dealers · Fast discovery</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
