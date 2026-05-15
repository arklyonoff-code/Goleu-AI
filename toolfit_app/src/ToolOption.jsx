import React from "react";
import { MaterialIcon } from "./components/MaterialIcon";

function ToolOption({ name, logo, icon, checked, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        border: checked ? "2px solid #4c51bf" : "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 16,
        background: checked ? "#f0f5ff" : "#fff",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: checked ? "0 2px 8px #4c51bf22" : "none",
        transition: "all 0.2s",
        position: "relative"
      }}
    >
      {logo && <img src={logo} alt={name} style={{ width: 32, height: 32, borderRadius: 8 }} />}
      {icon && <span style={{ fontSize: 32 }}>{icon}</span>}
      <span style={{ fontWeight: 600, fontSize: 16 }}>{name}</span>
      <span style={{ flex: 1 }} />
      <span>
        <MaterialIcon
          name="check_circle"
          size={22}
          color={checked ? "#4c51bf" : "#e2e8f0"}
          fill={checked ? 1 : 0}
          style={{ transition: "color 0.2s" }}
        />
      </span>
    </div>
  );
}

export default ToolOption; 