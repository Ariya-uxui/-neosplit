import React, { useEffect, useState } from "react";
import "../App.css";

function YourRedeem({ setPage, selectedRedeem }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const icon = selectedRedeem?.icon || "🎁";
  const rewardName = selectedRedeem?.rewardName || "Your reward";
  const points = selectedRedeem?.points;

  return (
    <div className="ns-screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>

      <div style={{ fontSize: 64, marginBottom: 8, opacity: show ? 1 : 0, transition: "opacity 0.4s ease" }}>{icon}</div>

      <div style={{
        fontFamily: "var(--ns-syne)", fontSize: 26, fontWeight: 800,
        color: "var(--ns-text)", marginBottom: 6, textAlign: "center",
        opacity: show ? 1 : 0, transition: "opacity 0.4s ease 0.1s",
      }}>
        {rewardName}
      </div>

      <div style={{
        fontSize: 14, color: "var(--ns-muted)", marginBottom: 28,
        opacity: show ? 1 : 0, transition: "opacity 0.4s ease 0.15s",
      }}>
        {selectedRedeem
          ? "Confirmed by your trip creator"
          : "No reward selected — pick a confirmed one from Rewards"}
      </div>

      <div style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--ns-g) 12%, transparent), color-mix(in srgb, var(--ns-g) 4%, transparent))",
        border: "1px solid color-mix(in srgb, var(--ns-g) 30%, transparent)",
        borderRadius: 24, padding: "28px 36px",
        textAlign: "center", marginBottom: 28, width: "100%",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.5s ease 0.2s",
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ns-g)" }}>
          Confirmed!
        </div>
        {points != null && (
          <div style={{ fontSize: 13, color: "var(--ns-muted)", marginTop: 6 }}>
            -{points} pts · คะแนนถูกหักแล้ว รอรับของรางวัลได้เลย
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", opacity: show ? 1 : 0, transition: "opacity 0.4s ease 0.3s" }}>
        <button className="ns-btn ns-btn-primary" onClick={() => setPage("rewardslist")}>
          🎁 Back to Rewards
        </button>
        <button className="ns-btn ns-btn-ghost" onClick={() => setPage("home")}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default YourRedeem;