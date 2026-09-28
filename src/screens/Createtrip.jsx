import React, { useState } from "react";
import "../App.css";

function CreateTrip({ setPage, addTrip, userProfile, teams = [], addTeam }) {
  const creatorName = userProfile?.name?.trim();
  const [tripName, setTripName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState(() => (creatorName ? [creatorName] : []));
  const [errors, setErrors] = useState({});

  const addMember = () => {
    const name = memberInput.trim();
    if (!name) return;
    if (members.includes(name)) {
      setErrors(e => ({ ...e, member: "มีชื่อนี้แล้วครับ" }));
      return;
    }
    setMembers(prev => [...prev, name]);
    setMemberInput("");
    setErrors(e => ({ ...e, member: "" }));
  };

  const removeMember = (name) => {
    setMembers(prev => prev.filter(m => m !== name));
  };

  // NOTE: named applyTeam (not "useTeam") on purpose — any function whose
  // name starts with "use" is treated by React's ESLint rules as a Hook,
  // which then breaks because it's called inside an onClick callback.
  const applyTeam = (team) => {
    const merged = Array.from(new Set([...(creatorName ? [creatorName] : []), ...team.memberList]));
    setMembers(merged);
    setErrors(e => ({ ...e, members: "" }));
  };

  const saveAsTeam = () => {
    if (members.length === 0) return;
    const name = window.prompt("Name this team (e.g. \"Bangkok Gang\"):", "");
    if (!name || !name.trim()) return;
    if (addTeam) addTeam({ name, memberList: members });
  };

  const validate = () => {
    const e = {};
    if (!tripName.trim()) e.tripName = "Please enter trip name";
    if (!date.trim()) e.date = "Please enter trip date";
    if (!location.trim()) e.location = "Please enter location";
    if (members.length === 0) e.members = "Please add at least 1 member";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addTrip({ title: tripName, members: members.length, memberList: members, total: "0", date, location, creator: creatorName || "" });
    setPage("home");
  };

  return (
    <div className="ns-screen">

      {/* ── Header ── */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("home")}>‹</button>
        <span className="ns-title">Create Trip</span>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Form ── */}
      <div className="ns-card">
        <div className="ns-input-group">
          <label className="ns-input-label">Trip Name</label>
          <input className="ns-input" placeholder="NCT127 Bangkok Concert" value={tripName} onChange={(e) => setTripName(e.target.value)} />
          {errors.tripName && <p className="ns-error">{errors.tripName}</p>}
        </div>

        <div className="ns-input-group">
          <label className="ns-input-label">Date</label>
          <input className="ns-input" placeholder="10/04/2026" value={date} onChange={(e) => setDate(e.target.value)} />
          {errors.date && <p className="ns-error">{errors.date}</p>}
        </div>

        <div className="ns-input-group" style={{ marginBottom: 0 }}>
          <label className="ns-input-label">Location</label>
          <input className="ns-input" placeholder="Bangkok" value={location} onChange={(e) => setLocation(e.target.value)} />
          {errors.location && <p className="ns-error">{errors.location}</p>}
        </div>
      </div>

      {/* ── Saved teams — reuse a member list instead of retyping it ── */}
      {teams.length > 0 && (
        <div className="ns-card">
          <label className="ns-input-label">Use a Saved Team</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => applyTeam(team)}
                style={{
                  padding: "7px 14px", borderRadius: 100, cursor: "pointer",
                  background: "var(--ns-card2)", border: "1px solid var(--ns-border)",
                  color: "var(--ns-text2)", fontSize: 12, fontWeight: 600,
                }}
              >
                👥 {team.name} ({team.memberList.length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Members ── */}
      <div className="ns-card">
        <label className="ns-input-label">Members ({members.length})</label>
        <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 10, marginTop: -4 }}>
          Add everyone joining this trip.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            className="ns-input"
            placeholder="ชื่อสมาชิก"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMember()}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={addMember}
            style={{
              padding: "0 16px", borderRadius: 12, flexShrink: 0,
              background: "rgba(0,255,133,0.15)", border: "1px solid rgba(0,255,133,0.3)",
              color: "var(--ns-g)", fontWeight: 800, fontSize: 18, cursor: "pointer",
            }}
          >+</button>
        </div>
        {errors.member && <p className="ns-error">{errors.member}</p>}
        {errors.members && <p className="ns-error">{errors.members}</p>}

        {/* Member chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: members.length > 0 ? 12 : 0 }}>
          {members.map((m) => (
            <div key={m} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 100,
              background: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.25)",
              fontSize: 13, fontWeight: 600, color: "var(--ns-g)",
            }}>
              {m}{m === creatorName ? " (you)" : ""}
              <button
                type="button"
                onClick={() => removeMember(m)}
                style={{ background: "none", border: "none", color: "var(--ns-r)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
              >×</button>
            </div>
          ))}
        </div>

        {members.length > 0 && (
          <button
            type="button"
            onClick={saveAsTeam}
            style={{
              background: "none", border: "none", color: "var(--ns-muted)",
              fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline",
            }}
          >
            💾 Save these {members.length} people as a team
          </button>
        )}
      </div>

      {/* ── Preview ── */}
      {(tripName || location || members.length > 0) && (
        <div className="ns-card" style={{
          background: "linear-gradient(135deg, rgba(0,255,133,0.08), rgba(0,255,133,0.02))",
          border: "1px solid rgba(0,255,133,0.2)", marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,255,133,0.7)", marginBottom: 8 }}>Preview</div>
          <div style={{ fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800, color: "var(--ns-text)", marginBottom: 6 }}>
            {tripName || "Your trip name"}
          </div>
          <div style={{ fontSize: 13, color: "var(--ns-muted)" }}>
            {members.length} members · {location || "Location"} {date ? `· ${date}` : ""}
          </div>
        </div>
      )}

      <button className="ns-btn ns-btn-primary" onClick={handleSave}>Save Trip 🚀</button>
      <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setPage("home")}>Cancel</button>
    </div>
  );
}

export default CreateTrip;