import React, { useState } from "react";
import "../App.css";
 
function CreateTrip({ setPage, addTrip }) {
  const [tripName, setTripName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState([]);
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
    addTrip({ title: tripName, members: members.length, memberList: members, total: "0", date, location });
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
 
      {/* ── Members ── */}
      <div className="ns-card">
        <label className="ns-input-label">Members ({members.length})</label>
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {members.map((m) => (
            <div key={m} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 100,
              background: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.25)",
              fontSize: 13, fontWeight: 600, color: "var(--ns-g)",
            }}>
              {m}
              <button
                type="button"
                onClick={() => removeMember(m)}
                style={{ background: "none", border: "none", color: "var(--ns-r)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
              >×</button>
            </div>
          ))}
        </div>
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