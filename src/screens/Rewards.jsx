import React, { useState } from "react";
import "../App.css";
 
const REWARDS = [
  { id: 1, points: 350, text: "1 Free Hotel Night", icon: "🏨" },
  { id: 2, points: 250, text: "Free Meal", icon: "🍜" },
  { id: 3, points: 200, text: "Skip Paying Bill", icon: "💸" },
  { id: 4, points: 150, text: "Choose Restaurant", icon: "🍽️" },
];
 
function Rewards({ setPage, userPoints = 0, onRedeem }) {
  const [selectedReward, setSelectedReward] = useState(null);
  const [error, setError] = useState("");
 
  const selected = REWARDS.find(r => r.id === selectedReward);
  const canAfford = selected ? userPoints >= selected.points : false;
 
  const handleRedeem = () => {
    if (!selected) return;
    if (!canAfford) {
      setError(`ไม่พอครับ ต้องการ ${selected.points} pts แต่มีแค่ ${userPoints} pts`);
      return;
    }
    if (onRedeem) onRedeem(selected.points);
    setPage("yourredeem");
  };
 
  return (
    <div className="ns-screen">
 
      {/* ── Header ── */}
      <div className="ns-page-header">
        <span className="ns-display">Rewards</span>
        <div style={{
          padding: "6px 12px", borderRadius: 100,
          background: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.2)",
          fontSize: 13, fontWeight: 700, color: "var(--ns-g)",
        }}>
          {userPoints} pts
        </div>
      </div>
 
      {/* ── Rewards list ── */}
      {REWARDS.map((reward) => {
        const isSelected = selectedReward === reward.id;
        const affordable = userPoints >= reward.points;
        return (
          <div
            key={reward.id}
            onClick={() => { setSelectedReward(reward.id); setError(""); }}
            className="ns-card ns-clickable"
            style={{
              display: "flex", alignItems: "center", gap: 14, marginBottom: 10,
              border: `1px solid ${isSelected ? "rgba(0,255,133,0.4)" : "var(--ns-border)"}`,
              background: isSelected ? "rgba(0,255,133,0.08)" : "var(--ns-card)",
              opacity: affordable ? 1 : 0.5,
              cursor: affordable ? "pointer" : "not-allowed",
            }}
          >
            <span style={{ fontSize: 28 }}>{reward.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ns-text)", marginBottom: 3 }}>{reward.text}</div>
              <div style={{ fontSize: 12, color: affordable ? "var(--ns-g)" : "var(--ns-r)", fontWeight: 700 }}>
                {reward.points} pts {!affordable && `(ขาด ${reward.points - userPoints} pts)`}
              </div>
            </div>
            {isSelected && <span style={{ color: "var(--ns-g)", fontSize: 18, fontWeight: 800 }}>✓</span>}
          </div>
        );
      })}
 
      {/* ── Error ── */}
      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(255,59,92,0.1)", border: "1px solid rgba(255,59,92,0.2)", borderRadius: 12, fontSize: 13, color: "var(--ns-r)", marginBottom: 14 }}>
          {error}
        </div>
      )}
 
      {/* ── Confirm ── */}
      {selected && (
        <div style={{ padding: "12px 16px", background: "rgba(0,255,133,0.06)", border: "1px solid rgba(0,255,133,0.2)", borderRadius: 14, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "var(--ns-muted)" }}>Selected: {selected.text}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: canAfford ? "var(--ns-g)" : "var(--ns-r)" }}>
            -{selected.points} pts
          </span>
        </div>
      )}
 
      <button
        className="ns-btn ns-btn-primary"
        disabled={!selectedReward || !canAfford}
        onClick={handleRedeem}
        style={{ opacity: (!selectedReward || !canAfford) ? 0.5 : 1 }}
      >
        Redeem Reward 🎁
      </button>
      <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setPage("mypoints")}>
        ← My Points
      </button>
    </div>
  );
}
 
export default Rewards;