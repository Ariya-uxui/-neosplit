import React, { useEffect, useState } from "react";
import "../App.css";
import { db } from "../firebase";
import { ref, onValue, set } from "firebase/database";

// Shared milestones the whole group works toward together — this is what
// gives the leaderboard a reason to exist beyond just bragging rights.
const GANG_REWARDS = [
  { threshold: 100, label: "Movie Picker 🎬", desc: "Winner picks the next movie night" },
  { threshold: 250, label: "Dessert Round 🍰", desc: "Group treats everyone to dessert" },
  { threshold: 500, label: "Trip MVP Crown 👑", desc: "Ultimate bragging rights for the trip" },
];

function Leaderboard({ setPage, authReady, currentTripId, currentTrip, userProfile, tripMembers = [] }) {
  const currentUser = userProfile?.name || "NongTaeyoung";
  const [scores, setScores] = useState({});

  // โหลดคะแนนของทริปนี้จาก Firebase — points are scoped per trip now,
  // so a different trip's leaderboard is a completely separate pool.
  // App.jsx's addPoints/confirmRedeem own all the writes; this screen
  // only reads and (via handleReset) clears the pool.
  // Gated on authReady, same as every other trip-scoped listener in the
  // app — querying before the anonymous sign-in finishes would fail
  // against rules that require auth != null.
  useEffect(() => {
    if (!authReady || !currentTripId) {
      setScores({});
      return;
    }
    const unsub = onValue(ref(db, `trips/${currentTripId}/memberPoints`), (snap) => {
      setScores(snap.val() || {});
    });
    return () => unsub();
  }, [authReady, currentTripId]);

  // รวม members ทั้งหมด
  const allNames = Array.from(new Set([
    ...tripMembers,
    ...Object.keys(scores),
    currentUser,
  ]));

  const allUsers = allNames
    .map((name) => ({
      name,
      points: scores[name] || 0,
      isMe: name === currentUser,
    }))
    .sort((a, b) => b.points - a.points);

  const groupTotal = allUsers.reduce((sum, u) => sum + u.points, 0);
  const hasAnyPoints = allUsers.some((u) => u.points > 0);
  const nextReward = GANG_REWARDS.find((r) => groupTotal < r.threshold);
  const prevThreshold = GANG_REWARDS.filter((r) => r.threshold <= groupTotal).slice(-1)[0]?.threshold || 0;
  const rewardProgress = nextReward
    ? Math.min(100, ((groupTotal - prevThreshold) / (nextReward.threshold - prevThreshold)) * 100)
    : 100;

  const medals = ["👑", "🥈", "🥉"];

  const handleReset = () => {
    if (!authReady || !currentTripId) return;
    if (!window.confirm("Reset คะแนนของทริปนี้ทุกคนเป็น 0 ใช่ไหม?")) return;
    const resetObj = {};
    allUsers.forEach((u) => { resetObj[u.name] = 0; });
    set(ref(db, `trips/${currentTripId}/memberPoints`), resetObj);
    // Global XP (Level) is untouched — resetting a trip's leaderboard
    // shouldn't wipe anyone's lifetime progress.
  };

  if (!currentTripId) {
    return (
      <div className="ns-screen">
        <div className="ns-page-header">
          <span className="ns-display">Leaderboard</span>
        </div>
        <div className="ns-card" style={{ textAlign: "center", padding: 32, color: "var(--ns-muted)" }}>
          Select a trip first to see its leaderboard.
        </div>
      </div>
    );
  }

  return (
    <div className="ns-screen">

      {/* Header */}
      <div className="ns-page-header">
        <span className="ns-display">Leaderboard</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="ns-btn ns-btn-ghost"
            style={{ width: "auto", padding: "8px 12px", fontSize: 12 }}
            onClick={handleReset}
          >
            🔄 Reset
          </button>
          <button
            className="ns-btn ns-btn-ghost"
            style={{ width: "auto", padding: "8px 14px", fontSize: 13 }}
            onClick={() => setPage("mypoints")}
          >
            My Points
          </button>
        </div>
      </div>

      {/* Gang Reward progress — the reason the leaderboard matters */}
      <div className="ns-card" style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--ns-g) 10%, transparent), color-mix(in srgb, var(--ns-g) 3%, transparent))",
        border: "1px solid color-mix(in srgb, var(--ns-g) 20%, transparent)", marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "color-mix(in srgb, var(--ns-g) 70%, transparent)", marginBottom: 8 }}>
          🏆 Gang Reward
        </div>
        {nextReward ? (
          <>
            <div style={{ fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800, color: "var(--ns-text)", marginBottom: 6 }}>
              {nextReward.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 10 }}>
              {nextReward.desc}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ns-text)" }}>
                {groupTotal} / {nextReward.threshold} pts
              </span>
              <span style={{ fontSize: 12, color: "var(--ns-g)", fontWeight: 700 }}>
                {nextReward.threshold - groupTotal} pts to unlock
              </span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 100, background: "var(--ns-g)", width: `${rewardProgress}%`, transition: "width 0.6s ease" }} />
            </div>
          </>
        ) : (
          <div style={{ fontFamily: "var(--ns-syne)", fontSize: 18, fontWeight: 800, color: "var(--ns-g)" }}>
            🎉 All Gang Rewards unlocked!
          </div>
        )}
      </div>

      {hasAnyPoints ? (
        <>
          {/* Top 3 podium */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, marginBottom: 20, padding: "20px 0" }}>
            {[allUsers[1], allUsers[0], allUsers[2]].map((user, i) => {
              if (!user) return <div key={i} style={{ width: 90 }} />;
              const heights = [80, 100, 60];
              const rank = i === 1 ? 0 : i === 0 ? 1 : 2;
              return (
                <div key={user.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 24 }}>{medals[rank] || "⭐"}</div>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: user.isMe ? "color-mix(in srgb, var(--ns-g) 20%, transparent)" : "rgba(255,255,255,0.08)",
                    border: `2px solid ${user.isMe ? "var(--ns-g)" : "var(--ns-border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800,
                    color: user.isMe ? "var(--ns-g)" : "var(--ns-text)",
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: user.isMe ? "var(--ns-g)" : "var(--ns-text2)",
                    textAlign: "center", maxWidth: 70,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {user.isMe ? "You" : user.name}
                  </div>
                  <div style={{
                    width: 70, height: heights[i], borderRadius: "8px 8px 0 0",
                    background: i === 1 ? "color-mix(in srgb, var(--ns-g) 20%, transparent)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${i === 1 ? "color-mix(in srgb, var(--ns-g) 30%, transparent)" : "var(--ns-border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--ns-syne)", fontWeight: 800, fontSize: 14,
                    color: i === 1 ? "var(--ns-g)" : "var(--ns-text2)",
                  }}>
                    {user.points}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full list */}
          <div className="ns-section-label">Rankings</div>
          {allUsers.map((user, index) => (
            <div
              key={user.name}
              className="ns-card"
              style={{
                display: "flex", alignItems: "center", gap: 14, marginBottom: 10,
                border: user.isMe ? "1px solid color-mix(in srgb, var(--ns-g) 30%, transparent)" : "1px solid var(--ns-border)",
                background: user.isMe ? "color-mix(in srgb, var(--ns-g) 6%, transparent)" : "var(--ns-card)",
              }}
            >
              <div style={{ fontSize: 20, width: 28, textAlign: "center" }}>
                {medals[index] || `#${index + 1}`}
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: user.isMe ? "color-mix(in srgb, var(--ns-g) 15%, transparent)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${user.isMe ? "color-mix(in srgb, var(--ns-g) 30%, transparent)" : "var(--ns-border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--ns-syne)", fontWeight: 800, fontSize: 16,
                color: user.isMe ? "var(--ns-g)" : "var(--ns-text2)",
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: user.isMe ? "var(--ns-g)" : "var(--ns-text)" }}>
                  {user.isMe ? `${user.name} (You)` : user.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--ns-muted)" }}>Rank #{index + 1}</div>
              </div>
              <div style={{ fontFamily: "var(--ns-syne)", fontSize: 18, fontWeight: 800, color: user.isMe ? "var(--ns-g)" : "var(--ns-text)" }}>
                {user.points}
                <span style={{ fontSize: 11, color: "var(--ns-muted)", marginLeft: 3 }}>pts</span>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="ns-card" style={{ textAlign: "center", padding: 32, marginBottom: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🚀</div>
          <div style={{ fontFamily: "var(--ns-syne)", fontSize: 18, fontWeight: 800, color: "var(--ns-text)", marginBottom: 6 }}>
            No ranking yet
          </div>
          <div style={{ fontSize: 13, color: "var(--ns-muted)" }}>
            Complete settlements to earn your first points
          </div>
        </div>
      )}

      <button className="ns-btn ns-btn-primary" style={{ marginTop: 8 }} onClick={() => setPage("mypoints")}>
        My Points →
      </button>
    </div>
  );
}

export default Leaderboard;