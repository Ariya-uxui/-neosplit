import React, { useEffect, useState } from "react";
import "../App.css";
import { db } from "../firebase";
import { ref, onValue, set } from "firebase/database";

// Fallback used only when a trip hasn't set its own milestones yet —
// so the feature works immediately with zero setup required.
const DEFAULT_GANG_REWARDS = [
  { threshold: 100, label: "Restaurant Picker 🍔", desc: "Winner picks the next restaurant" },
  { threshold: 250, label: "Dessert Round 🍰", desc: "Group treats everyone to dessert" },
  { threshold: 500, label: "Trip MVP Crown 👑", desc: "Ultimate bragging rights for the trip" },
];

function Leaderboard({ setPage, authReady, currentGangId, gangName, gangCreatorId, currentTrip, userProfile, tripMembers = [], gangMembers = [], tripMilestones = [], addGangMilestone, deleteGangMilestone }) {
  const currentUserId = userProfile?.id || null;
  // Ranking is gang-wide now, not just this trip's roster — someone can
  // be in the gang (and show up here) without having joined this
  // particular trip. Falls back to tripMembers for the very first paint,
  // before the gang's own member list has loaded in.
  const memberPool = gangMembers.length > 0 ? gangMembers : tripMembers;
  // Points (scores) are keyed by member id, never by name, so a rename
  // can never split someone's history into a second ranking entry. Their
  // points stay on the board even after they're removed from the gang
  // (removing someone doesn't erase their history), so the fallback here
  // matters: without it, a removed member's row would show their raw
  // internal id instead of a readable label.
  const nameOf = (id) => memberPool.find((m) => m.id === id)?.name || (id ? "Former member" : "");
  const [scores, setScores] = useState({});
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [newThreshold, setNewThreshold] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  // Gang-level permission now — rewards/milestones belong to the gang,
  // which can span trips with different creators, so the gatekeeper is
  // whoever created the GANG, not necessarily this one trip.
  const isCreator = !!gangCreatorId && gangCreatorId === currentUserId;

  // Ranking and the Gang Reward milestone both read from
  // memberLifetimePoints — the pool that only ever goes up, shared
  // across every trip under this gang. Redeeming a reward spends from a
  // *different* pool (Reward Points, tracked in Rewards.jsx), so cashing
  // in a reward never knocks anyone's rank down.
  useEffect(() => {
    if (!authReady || !currentGangId) {
      setScores({});
      return;
    }
    const unsub = onValue(ref(db, `gangs/${currentGangId}/memberLifetimePoints`), (snap) => {
      setScores(snap.val() || {});
    });
    return () => unsub();
  }, [authReady, currentGangId]);

  const allIds = Array.from(new Set([
    ...memberPool.map((m) => m.id),
    ...Object.keys(scores),
    ...(currentUserId ? [currentUserId] : []),
  ]));

  const allUsers = allIds
    .map((id) => ({
      id,
      name: nameOf(id),
      points: scores[id] || 0,
      isMe: id === currentUserId,
    }))
    .sort((a, b) => b.points - a.points);

  // Competition ranking ("1224"): equal points share the same rank
  // number, and the next distinct score skips ahead accordingly — so
  // two people tied at 0 pts both show as Rank #2 instead of one
  // silently outranking the other just from sort/insertion order.
  const ranks = allUsers.map((u, i) =>
    i === 0 || u.points !== allUsers[i - 1].points ? i + 1 : null
  );
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] === null) ranks[i] = ranks[i - 1];
  }

  const groupTotal = allUsers.reduce((sum, u) => sum + u.points, 0);
  const hasAnyPoints = allUsers.some((u) => u.points > 0);
  const activeMilestones = tripMilestones.length > 0
    ? [...tripMilestones].sort((a, b) => a.threshold - b.threshold)
    : DEFAULT_GANG_REWARDS;
  const nextReward = activeMilestones.find((r) => groupTotal < r.threshold);
  const prevThreshold = activeMilestones.filter((r) => r.threshold <= groupTotal).slice(-1)[0]?.threshold || 0;
  const rewardProgress = nextReward
    ? Math.min(100, ((groupTotal - prevThreshold) / (nextReward.threshold - prevThreshold)) * 100)
    : 100;

  const handleAddMilestone = () => {
    if (!newThreshold || Number(newThreshold) <= 0 || !newLabel.trim()) return;
    addGangMilestone({ threshold: newThreshold, label: newLabel.trim(), desc: newDesc.trim() });
    setNewThreshold("");
    setNewLabel("");
    setNewDesc("");
    setShowMilestoneForm(false);
  };

  const medals = ["👑", "🥈", "🥉"];

  // Reset clears this GANG's game state (both lifetime rank points and
  // whatever's sitting in the spendable Reward Points pool) — every trip
  // under this gang shares the same pools, so this resets all of them at
  // once, not just the one you're looking at. Global XP (userPoints,
  // shown on My Points) is never touched by this.
  const handleReset = () => {
    if (!authReady || !currentGangId) return;
    if (!window.confirm("Reset คะแนนของแก๊งนี้ทุกคนเป็น 0 ใช่ไหม? (มีผลกับทุกทริปในแก๊งนี้)")) return;
    setShowMenu(false);
    const resetObj = {};
    allUsers.forEach((u) => { resetObj[u.id] = 0; });
    set(ref(db, `gangs/${currentGangId}/memberLifetimePoints`), resetObj);
    set(ref(db, `gangs/${currentGangId}/memberPoints`), resetObj);
  };

  if (!currentGangId) {
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
    <div className="ns-screen" onClick={() => showMenu && setShowMenu(false)}>

      {/* Header — just the title now, no crowded button row */}
      <div className="ns-page-header">
        <span className="ns-display">Leaderboard</span>
      </div>
      {gangName && (
        <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: -10, marginBottom: 14 }}>
          👥 {gangName} — shared across every trip in this gang
        </div>
      )}

      {/* Gang Reward progress */}
      <div className="ns-card" style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--ns-g) 10%, transparent), color-mix(in srgb, var(--ns-g) 3%, transparent))",
        border: "1px solid color-mix(in srgb, var(--ns-g) 20%, transparent)", marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "color-mix(in srgb, var(--ns-g) 70%, transparent)", marginBottom: 4 }}>
          🏆 Gang Reward
        </div>
        <div style={{ fontSize: 11, color: "var(--ns-muted)", marginBottom: 8 }}>
          Unlocks when the whole gang's Gang Pts (below) add up to the target — redeeming a reward never lowers this.
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

      {/* Creator-only: manage milestones */}
      {isCreator && (
        <div style={{ marginBottom: 16 }}>
          {tripMilestones.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              {activeMilestones.map((m) => (
                <div key={m.id} className="ns-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
                  <div style={{ flex: 1, fontSize: 12, color: "var(--ns-text2)" }}>
                    {m.threshold} pts — {m.label}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteGangMilestone && deleteGangMilestone(m.id); }}
                    style={{ background: "none", border: "none", color: "var(--ns-r)", cursor: "pointer", fontSize: 13, padding: 0 }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {showMilestoneForm ? (
            <div className="ns-card" onClick={(e) => e.stopPropagation()}>
              <div className="ns-input-group">
                <label className="ns-input-label">Points Threshold</label>
                <input className="ns-input" type="number" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} placeholder="100" />
              </div>
              <div className="ns-input-group">
                <label className="ns-input-label">Label</label>
                <input className="ns-input" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Movie Picker 🎬" />
              </div>
              <div className="ns-input-group" style={{ marginBottom: 0 }}>
                <label className="ns-input-label">Description (optional)</label>
                <input className="ns-input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="e.g. Winner picks the movie" />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="ns-btn ns-btn-primary" style={{ flex: 1 }} onClick={handleAddMilestone}>Add</button>
                <button className="ns-btn ns-btn-ghost" style={{ flex: 1 }} onClick={() => setShowMilestoneForm(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="ns-btn ns-btn-dark" onClick={(e) => { e.stopPropagation(); setShowMilestoneForm(true); }}>
              + Edit Milestones
            </button>
          )}
        </div>
      )}

      {/* My Points row — Reset moved into ••• since it's rare/destructive
          and shouldn't carry the same visual weight as My Points */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, position: "relative" }}>
        <button className="ns-btn ns-btn-primary" style={{ flex: 1 }} onClick={() => setPage("mypoints")}>
          My Points →
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          style={{
            width: 46, borderRadius: 14, flexShrink: 0,
            background: "var(--ns-card2)", border: "1px solid var(--ns-border)",
            color: "var(--ns-muted)", fontSize: 18, fontWeight: 800, cursor: "pointer",
          }}
        >
          •••
        </button>
        {showMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute", top: 52, right: 0, zIndex: 20,
              background: "var(--ns-card2)", border: "1px solid var(--ns-border)",
              borderRadius: 12, overflow: "hidden", minWidth: 170,
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            {isCreator && (
              <button
                type="button"
                onClick={() => { setShowMenu(false); setPage("gangsettings"); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "10px 14px", background: "none", border: "none",
                  borderBottom: "1px solid var(--ns-border)",
                  color: "var(--ns-text2)", fontSize: 13, cursor: "pointer",
                }}
              >
                ⚙️ Manage Gang
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "10px 14px", background: "none", border: "none",
                color: "var(--ns-r)", fontSize: 13, cursor: "pointer",
              }}
            >
              🔄 Reset Leaderboard
            </button>
          </div>
        )}
      </div>

      {hasAnyPoints ? (
        <>
          {/* Top 3 podium */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, marginBottom: 20, padding: "20px 0" }}>
            {[1, 0, 2].map((userIndex, i) => {
              const user = allUsers[userIndex];
              if (!user) return <div key={i} style={{ width: 90 }} />;
              const heights = [80, 100, 60];
              // Medal reflects this person's actual (possibly tied) rank,
              // not just which podium slot they're drawn in — so two
              // people tied for 2nd both get 🥈, not 🥈 and 🥉.
              const rank = ranks[userIndex];
              return (
                <div key={user.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 24 }}>{medals[rank - 1] || "⭐"}</div>
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
                  {/* Long names (e.g. "NongTaeyoung") now wrap onto a
                      second line instead of being clipped to "NongTaey…" */}
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: user.isMe ? "var(--ns-g)" : "var(--ns-text2)",
                    textAlign: "center", maxWidth: 82,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    lineHeight: 1.25, wordBreak: "break-word",
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
          <div className="ns-section-label" style={{ marginBottom: 2 }}>Rankings</div>
          <div style={{ fontSize: 11, color: "var(--ns-muted)", marginBottom: 10, marginTop: -4 }}>
            Gang Pts = lifetime points earned in this trip. Different from your Reward Points balance (spendable, see My Points) — redeeming a reward never changes your rank here.
          </div>
          {allUsers.map((user, index) => (
            <div
              key={user.id}
              className="ns-card"
              style={{
                display: "flex", alignItems: "center", gap: 14, marginBottom: 10,
                border: user.isMe ? "1px solid color-mix(in srgb, var(--ns-g) 30%, transparent)" : "1px solid var(--ns-border)",
                background: user.isMe ? "color-mix(in srgb, var(--ns-g) 6%, transparent)" : "var(--ns-card)",
              }}
            >
              <div style={{ fontSize: 20, width: 28, textAlign: "center" }}>
                {medals[ranks[index] - 1] || `#${ranks[index]}`}
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
                <div style={{ fontSize: 11, color: "var(--ns-muted)" }}>Rank #{ranks[index]}</div>
              </div>
              <div style={{ fontFamily: "var(--ns-syne)", fontSize: 18, fontWeight: 800, color: user.isMe ? "var(--ns-g)" : "var(--ns-text)" }}>
                {user.points}
                <span style={{ fontSize: 11, color: "var(--ns-muted)", marginLeft: 3 }}>Gang Pts</span>
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
    </div>
  );
}

export default Leaderboard;