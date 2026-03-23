import React from "react";
import "../App.css";
 
const CATEGORY_COLORS = {
  Food:      "#FF6B35",
  Ticket:    "#00FF85",
  Transport: "#FFD400",
  Travel:    "#FFD400",
  Merch:     "#FF3B5C",
  Hotel:     "#8B5CF6",
  Other:     "#6B7280",
};
 
function ExpenseChart({ tripBills = [] }) {
  if (!tripBills.length) return null;
 
  const catMap = {};
  tripBills.forEach((b) => {
    const cat = b.category || "Other";
    catMap[cat] = (catMap[cat] || 0) + (Number(b.amount) || 0);
  });
 
  const total = Object.values(catMap).reduce((s, v) => s + v, 0);
  if (total === 0) return null;
 
  const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
 
  // Build donut segments
  let cumulative = 0;
  const radius = 54;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * radius;
 
  const segments = entries.map(([cat, amt]) => {
    const pct = amt / total;
    const offset = circumference * (1 - pct);
    const rotation = cumulative * 360;
    cumulative += pct;
    return { cat, amt, pct, offset, rotation };
  });
 
  const getIcon = (cat) =>
    ({ Food:"🍜", Ticket:"🎫", Transport:"🚕", Travel:"🚕", Merch:"🛍️", Hotel:"🏨" }[cat] || "💸");
 
  return (
    <div className="ns-card">
      <div className="ns-section-label" style={{ margin: "0 0 16px" }}>Spending Chart</div>
 
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* Donut */}
        <svg width={140} height={140} style={{ flexShrink: 0 }}>
          {segments.map(({ cat, offset, rotation }) => (
            <circle
              key={cat}
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={CATEGORY_COLORS[cat] || "#6B7280"}
              strokeWidth={20}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(${rotation - 90} ${cx} ${cy})`}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          ))}
          {/* Center hole */}
          <circle cx={cx} cy={cy} r={36} fill="var(--ns-card, #1a1a1a)" />
          <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--ns-text, #fff)" fontSize={11} fontWeight={700}>
            Total
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--ns-g, #00ff85)" fontSize={13} fontWeight={800}>
            {(total / 1000).toFixed(1)}k
          </text>
        </svg>
 
        {/* Legend */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {entries.map(([cat, amt]) => (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                background: CATEGORY_COLORS[cat] || "#6B7280",
              }} />
              <span style={{ fontSize: 12, color: "var(--ns-text2, #aaa)", flex: 1 }}>
                {getIcon(cat)} {cat}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ns-text, #fff)" }}>
                {((amt / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
 
export default ExpenseChart;