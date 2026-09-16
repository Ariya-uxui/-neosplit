import React, { useState } from "react";
import "../App.css";

function Rewards({
  setPage,
  userPoints = 0,
  tripRewards = [],
  tripRedeems = [],
  currentTrip,
  userProfile,
  requestRedeem,
  confirmRedeem,
  setSelectedRedeem,
}) {
  const [selectedReward, setSelectedReward] = useState(null);
  const [error, setError] = useState("");

  const currentUserName = userProfile?.name;
  const isCreator = !!currentTrip?.creator && currentTrip.creator === currentUserName;

  const selected = tripRewards.find((r) => r.id === selectedReward);
  const canAfford = selected ? userPoints >= selected.points : false;

  const myRequests = tripRedeems
    .filter((r) => r.memberName === currentUserName)
    .sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));

  const pendingForCreator = tripRedeems
    .filter((r) => r.status === "Pending")
    .sort((a, b) => (a.requestedAt || 0) - (b.requestedAt || 0));

  const handleRedeem = () => {
    if (!selected) return;
    if (!canAfford) {
      setError(`ไม่พอครับ ต้องการ ${selected.points} pts แต่มีแค่ ${userPoints} pts`);
      return;
    }
    if (requestRedeem) requestRedeem(selected);
    setSelectedReward(null);
    setError("");
  };

  if (!currentTrip) {
    return (
      <div className="ns-screen">
        <div className="ns-page-header">
          <span className="ns-display">Rewards</span>
        </div>
        <div className="ns-card" style={{ textAlign: "center", padding: 32, color: "var(--ns-muted)" }}>
          Select a trip first to see its gang rewards.
        </div>
      </div>
    );
  }

  return (
    <div className="ns-screen">

      {/* ── Header ── */}
      <div className="ns-page-header">
        <span className="ns-display">Rewards</span>
        <div style={{
          padding: "6px 12px", borderRadius: 100,
          background: "color-mix(in srgb, var(--ns-g) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--ns-g) 20%, transparent)",
          fontSize: 12, fontWeight: 700, color: "var(--ns-g)", textAlign: "right",
        }}>
          Available Points<br />
          <span style={{ fontSize: 15 }}>{userPoints} pts</span>
        </div>
      </div>

      {/* ── Creator: pending confirmations ── */}
      {isCreator && pendingForCreator.length > 0 && (
        <>
          <div className="ns-section-label">Pending Redemptions</div>
          {pendingForCreator.map((req) => (
            <div key={req.id} className="ns-card" style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 10,
              border: "1px solid color-mix(in srgb, var(--ns-y) 30%, transparent)", background: "color-mix(in srgb, var(--ns-y) 6%, transparent)",
            }}>
              <span style={{ fontSize: 24 }}>{req.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ns-text)" }}>{req.rewardName}</div>
                <div style={{ fontSize: 12, color: "var(--ns-muted)" }}>{req.memberName} · {req.points} pts</div>
              </div>
              <button
                type="button"
                className="ns-btn ns-btn-primary"
                style={{ width: "auto", padding: "8px 14px", fontSize: 12 }}
                onClick={() => confirmRedeem && confirmRedeem(req.id)}
              >
                Confirm
              </button>
            </div>
          ))}
        </>
      )}

      {/* ── Rewards list ── */}
      <div className="ns-section-label" style={{ marginBottom: 2 }}>Gang Rewards</div>
      <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 12 }}>
        Rewards created by your gang 🎁
      </div>

      {tripRewards.length === 0 ? (
        <div className="ns-card" style={{ textAlign: "center", padding: 28, color: "var(--ns-muted)", marginBottom: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎁</div>
          <div style={{ fontWeight: 700, color: "var(--ns-text)", marginBottom: 4 }}>No gang rewards yet</div>
          <div style={{ fontSize: 13 }}>
            {isCreator ? "Create one below to get started" : "Ask your trip creator to add some"}
          </div>
        </div>
      ) : (
        tripRewards.map((reward) => {
          const isSelected = selectedReward === reward.id;
          const affordable = userPoints >= reward.points;
          return (
            <div
              key={reward.id}
              onClick={() => { setSelectedReward(reward.id); setError(""); }}
              className="ns-card ns-clickable"
              style={{
                display: "flex", alignItems: "center", gap: 14, marginBottom: 10,
                border: `1px solid ${isSelected ? "color-mix(in srgb, var(--ns-g) 40%, transparent)" : "var(--ns-border)"}`,
                background: isSelected ? "color-mix(in srgb, var(--ns-g) 8%, transparent)" : "var(--ns-card)",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 28 }}>{reward.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ns-text)", marginBottom: 3 }}>{reward.name}</div>
                {reward.description && (
                  <div style={{ fontSize: 11, color: "var(--ns-muted)", marginBottom: 4 }}>{reward.description}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ns-text2)" }}>{reward.points} pts</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: affordable ? "var(--ns-g)" : "var(--ns-muted)" }}>
                    {affordable ? "✓ Available to redeem" : `You need ${reward.points - userPoints} more pts`}
                  </span>
                </div>
              </div>
              {isSelected && <span style={{ color: "var(--ns-g)", fontSize: 18, fontWeight: 800 }}>✓</span>}
            </div>
          );
        })
      )}

      {isCreator && (
        <button className="ns-btn ns-btn-dark" style={{ marginBottom: 14 }} onClick={() => setPage("createreward")}>
          + Create Reward
        </button>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: "12px 16px", background: "color-mix(in srgb, var(--ns-r) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--ns-r) 20%, transparent)", borderRadius: 12, fontSize: 13, color: "var(--ns-r)", marginBottom: 14 }}>
          {error}
        </div>
      )}

      <button
        className="ns-btn ns-btn-primary"
        disabled={!selectedReward || !canAfford}
        onClick={handleRedeem}
        style={{ opacity: (!selectedReward || !canAfford) ? 0.5 : 1 }}
      >
        {selected ? `🎁 Request Redeem — ${selected.points} pts` : "🎁 Select a reward above"}
      </button>

      {/* ── My own requests ── */}
      {myRequests.length > 0 && (
        <>
          <div className="ns-section-label">My Redeem Requests</div>
          {myRequests.map((req) => {
            const isConfirmed = req.status === "Confirmed";
            return (
              <div
                key={req.id}
                className={`ns-card ${isConfirmed ? "ns-clickable" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, cursor: isConfirmed ? "pointer" : "default" }}
                onClick={() => {
                  if (!isConfirmed) return;
                  if (setSelectedRedeem) setSelectedRedeem(req);
                  setPage("yourredeem");
                }}
              >
                <span style={{ fontSize: 22 }}>{req.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ns-text)" }}>{req.rewardName}</div>
                  <div style={{ fontSize: 11, color: "var(--ns-muted)" }}>{req.points} pts</div>
                </div>
                <span className={`ns-badge ${isConfirmed ? "ns-badge-green" : "ns-badge-yellow"}`}>
                  {isConfirmed ? "✅ Confirmed" : "⏳ Pending approval"}
                </span>
              </div>
            );
          })}
        </>
      )}

      <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setPage("mypoints")}>
        ← My Points
      </button>
    </div>
  );
}

export default Rewards;