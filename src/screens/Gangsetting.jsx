import React, { useState } from "react";
import "../App.css";

// A Gang's membership is independent of any one trip's roster — someone
// can belong to the gang (and show up on its leaderboard/rewards) without
// having joined every trip under it. This screen manages THAT list, not
// any single trip's member list (that's still EditTrip.jsx).
function GangSettings({
  setPage,
  currentGangId,
  gangName = "",
  gangCreatorId,
  gangMembers = [],
  userProfile,
  addGangMember,
  removeGangMember,
  renameGang,
}) {
  const currentUserId = userProfile?.id;
  const isCreator = !!gangCreatorId && gangCreatorId === currentUserId;

  const [memberInput, setMemberInput] = useState("");
  const [nameInput, setNameInput] = useState(gangName);
  const [editingName, setEditingName] = useState(false);
  const [error, setError] = useState("");

  if (!currentGangId) {
    return (
      <div className="ns-screen">
        <div className="ns-page-header">
          <button className="ns-back-btn" onClick={() => setPage("trophy")}>‹</button>
          <span className="ns-title">Manage Gang</span>
          <div style={{ width: 36 }} />
        </div>
        <div className="ns-card" style={{ textAlign: "center", padding: 32, color: "var(--ns-muted)" }}>
          Select a trip first.
        </div>
      </div>
    );
  }

  const handleAddMember = () => {
    const name = memberInput.trim();
    if (!name) return;
    const id = addGangMember && addGangMember(currentGangId, name);
    if (id) {
      setMemberInput("");
      setError("");
    } else {
      setError("That name is already in this gang");
    }
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    if (renameGang) renameGang(currentGangId, trimmed);
    setEditingName(false);
  };

  return (
    <div className="ns-screen">

      {/* ── Header ── */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("trophy")}>‹</button>
        <span className="ns-title">Manage Gang</span>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Gang name ── */}
      <div className="ns-card">
        <label className="ns-input-label">Gang Name</label>
        {editingName ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="ns-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={{ flex: 1 }}
              maxLength={40}
            />
            <button className="ns-btn ns-btn-primary" style={{ width: "auto", padding: "0 16px" }} onClick={handleSaveName}>
              Save
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--ns-syne)", fontSize: 18, fontWeight: 800, color: "var(--ns-text)" }}>
              👥 {gangName || "Unnamed Gang"}
            </span>
            {isCreator && (
              <button
                type="button"
                onClick={() => { setNameInput(gangName); setEditingName(true); }}
                style={{ background: "none", border: "none", color: "var(--ns-muted)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
              >
                Rename
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: -8, marginBottom: 14 }}>
        Points and rewards are shared by everyone here, across every trip linked to this gang — not just the trip you're viewing now.
      </div>

      {/* ── Members ── */}
      <div className="ns-card">
        <label className="ns-input-label">Gang Members ({gangMembers.length})</label>

        {isCreator && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, marginTop: 8 }}>
              <input
                className="ns-input"
                placeholder="ชื่อสมาชิกใหม่"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                style={{ flex: 1 }}
                maxLength={40}
              />
              <button
                type="button"
                onClick={handleAddMember}
                style={{
                  padding: "0 16px", borderRadius: 12, flexShrink: 0,
                  background: "rgba(0,255,133,0.15)", border: "1px solid rgba(0,255,133,0.3)",
                  color: "var(--ns-g)", fontWeight: 800, fontSize: 18, cursor: "pointer",
                }}
              >+</button>
            </div>
            {error && <p className="ns-error">{error}</p>}
          </>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {gangMembers.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 10,
                background: "var(--ns-card2)", border: "1px solid var(--ns-border)",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ns-text)" }}>
                {m.name}{m.id === currentUserId ? " (you)" : ""}{m.id === gangCreatorId ? " 👑" : ""}
              </span>
              {isCreator && m.id !== gangCreatorId && (
                <button
                  type="button"
                  onClick={() => removeGangMember && removeGangMember(currentGangId, m.id)}
                  style={{ background: "none", border: "none", color: "var(--ns-r)", cursor: "pointer", fontSize: 12 }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {gangMembers.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--ns-muted)", textAlign: "center", padding: 12 }}>
              No members yet
            </div>
          )}
        </div>
      </div>

      {!isCreator && (
        <div style={{ fontSize: 12, color: "var(--ns-muted)", textAlign: "center", marginBottom: 10 }}>
          Only the gang's creator can rename it or add/remove members
        </div>
      )}

      <button className="ns-btn ns-btn-ghost" onClick={() => setPage("trophy")}>
        ← Back to Leaderboard
      </button>
    </div>
  );
}

export default GangSettings;