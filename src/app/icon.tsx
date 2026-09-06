import { ImageResponse } from "next/og";

export const size = { width: 256, height: 256 };
export const contentType = "image/png";

// Brand primary green from globals.css
const PRIMARY = "#078660";
const DARK = "#172023";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PRIMARY,
          color: "#fff",
          fontSize: 184,
          fontWeight: 700,
          letterSpacing: -8,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          borderRadius: 48,
          boxShadow: `inset 0 -16px 0 0 ${DARK}33`,
        }}
      >
        D
      </div>
    ),
    size,
  );
}
