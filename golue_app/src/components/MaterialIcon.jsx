import React from "react";

/** Google Material Symbols Outlined — `index.html`에서 폰트 로드. */
export function MaterialIcon({ name, size = 24, color, style = {}, fill = 0, ...rest }) {
  const opsz = Math.round(Math.min(48, Math.max(20, Number(size) || 24)));
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        color,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' ${opsz}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        verticalAlign: "middle",
        lineHeight: 1,
        ...style,
      }}
      aria-hidden
      {...rest}
    >
      {name}
    </span>
  );
}
