import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const PRIMARY = "#078660";
const DARK = "#172023";

export default function AppleIcon() {
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
          fontSize: 132,
          fontWeight: 700,
          letterSpacing: -6,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          // Apple touch icon is masked into a rounded square by iOS — we still
          // emit a square with subtle accent so it's clean if served raw.
          borderRadius: 32,
          boxShadow: `inset 0 -12px 0 0 ${DARK}33`,
        }}
      >
        D
      </div>
    ),
    size,
  );
}
