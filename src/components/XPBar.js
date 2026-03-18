import React from "react";

function XPBar({ xp }) {
  const percent = xp % 100;

  return (
    <div style={{ marginTop: "10px" }}>
      <p style={{ marginBottom: "8px" }}>XP {xp}/100</p>

      <div
        style={{
          height: "12px",
          background: "#d9d9d9",
          borderRadius: "999px",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            height: "12px",
            width: percent + "%",
            background: "#111",
            borderRadius: "999px",
            transition: "0.4s"
          }}
        />
      </div>
    </div>
  );
}

export default XPBar;