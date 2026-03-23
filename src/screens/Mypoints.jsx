import React from "react";
import "../App.css";
 
function MyPoints({ setPage, userPoints = 0 }) {
  const level = userPoints < 50 ? "Beginner" : userPoints < 150 ? "Splitter" : userPoints < 300 ? "Top Splitter" : "Legend";
  const levelIcon = userPoints < 50 ? "🌱" : userPoints < 150 ? "⭐" : userPoints < 300 ? "🏅" : "👑";
  const nextLevel = userPoints < 50 ? 50 : userPoints < 150 ? 150 : userPoints < 300 ? 300 : 999;
  const progress = Math.min((userPoints / nextLevel) * 100, 100);
 
  return (
    <div className="ns-screen">
 
      {/* ── Header ── */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("trophy")}>‹</button>
        <span className="ns-title">My Points</span>
        <div style={{ width: 36 }} />
      </div>
 
      {/* ── Points hero ── */}
      <div className="ns-card" style={{
        background: "linear-gradient(135deg, rgba(0,255,133,0.12), rgba(0,255,133,0.03))",
        border: "1px solid rgba(0,255,133,0.3)",
        textAlign: "center", padding: "28px 20px", marginBottom: 14,
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{levelIcon}</div>
        <div style={{ fontFamily: "var(--ns-syne)", fontSize: 56, fontWeight: 800, color: "var(--ns-g)", letterSpacing: "-2px", lineHeight: 1 }}>
          {userPoints}
        </div>
        <div style={{ fontSize: 14, color: "var(--ns-muted)", marginTop: 6 }}>Total Points</div>
        <div style={{ marginTop: 12, display: "inline-block", padding: "4px 14px", borderRadius: 100, background: "rgba(0,255,133,0.15)", border: "1px solid rgba(0,255,133,0.3)", fontSize: 13, fontWeight: 700, color: "var(--ns-g)" }}>
          {level}
        </div>
      </div>
 
      {/* ── Progress to next level ── */}
      {userPoints < 999 && (
        <div className="ns-card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-text)" }}>Progress to next level</span>
            <span style={{ fontSize: 13, color: "var(--ns-muted)" }}>{userPoints}/{nextLevel} pts</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 100, background: "var(--ns-g)", width: `${progress}%`, transition: "width 0.6s ease" }} />
          </div>
        </div>
      )}
 
      {/* ── How to earn ── */}
      <div className="ns-section-label">How to Earn Points</div>
      <div className="ns-card">
        {[
          { icon: "🤝", text: "Settle all bills", pts: "+10 pts/bill" },
          { icon: "➕", text: "Add a new bill", pts: "+5 pts" },
          { icon: "🎯", text: "Complete a trip", pts: "+50 pts" },
        ].map((item) => (
          <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--ns-border)" }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: 14, color: "var(--ns-text)" }}>{item.text}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-g)" }}>{item.pts}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
          <span style={{ fontSize: 22 }}>🎁</span>
          <span style={{ flex: 1, fontSize: 14, color: "var(--ns-text)" }}>Redeem rewards</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-r)" }}>-pts</span>
        </div>
      </div>
 
      <button className="ns-btn ns-btn-primary" style={{ marginTop: 14 }} onClick={() => setPage("rewardslist")}>
        🎁 Redeem Rewards
      </button>
      <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setPage("trophy")}>
        🏆 View Leaderboard
      </button>
    </div>
  );
}
 
export default MyPoints;