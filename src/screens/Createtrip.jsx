import React, { useState } from "react";
import "../App.css";

// Trip date is stored as "DD/MM/YYYY" (en-GB), matching how it's shown
// elsewhere (Home trip cards, Edit Trip, etc.), but the native
// <input type="date"> — which gives a tap-to-scroll date picker on phones —
// only speaks "YYYY-MM-DD". These convert between the two so the stored
// format never has to change. Unlike a bill's date, a trip's date can be
// in the future (e.g. a concert date), so there's no "max" cap here.
const todayInput = () => new Date().toISOString().slice(0, 10);
const toDisplayDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Member identity: every member is a permanent { id, name } pair, not a
// plain name string. Your own entry reuses userProfile.id (the device's
// own permanent id) so this new trip's "you" is provably the same person
// as your Profile from the moment the trip is created — nothing to link
// up later, nothing to orphan on a future rename.
const makeMemberId = () => `member-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function CreateTrip({ setPage, addTrip, userProfile, gangs = [], createGang }) {
  const creatorName = userProfile?.name?.trim();
  const creatorId = userProfile?.id;
  const [tripName, setTripName] = useState("");
  const [date, setDate] = useState(todayInput());
  const [location, setLocation] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState(() =>
    creatorName && creatorId ? [{ id: creatorId, name: creatorName }] : []
  );
  const [errors, setErrors] = useState({});

  // ── Gang: every trip belongs to exactly one, so this is resolved
  // right here before the trip is even saved — either "use one that
  // already exists" (picking it pre-fills the member list from the
  // gang's REAL member ids, so points/rewards earned here land on the
  // same people as their other trips) or "start a brand-new one" (the
  // default — a solo/first trip just gets its own 1-trip gang, same as
  // before Gangs existed, just explicit now).
  const [gangMode, setGangMode] = useState(gangs.length > 0 ? "existing" : "new");
  const [selectedGangId, setSelectedGangId] = useState("");
  const [newGangName, setNewGangName] = useState("");

  const applyGang = (gang) => {
    const members_ = gang.members
      ? Object.entries(gang.members).map(([id, name]) => ({ id, name }))
      : [];
    const hasSelf = creatorId && members_.some((m) => m.id === creatorId);
    const finalMembers = hasSelf || !creatorName
      ? members_
      : [...members_, { id: creatorId, name: creatorName }];
    setMembers(finalMembers);
    setSelectedGangId(gang.id);
    setErrors((e) => ({ ...e, members: "", gang: "" }));
  };

  const addMember = () => {
    const name = memberInput.trim();
    if (!name) return;
    if (members.some((m) => m.name === name)) {
      setErrors(e => ({ ...e, member: "มีชื่อนี้แล้วครับ" }));
      return;
    }
    setMembers(prev => [...prev, { id: makeMemberId(), name }]);
    setMemberInput("");
    setErrors(e => ({ ...e, member: "" }));
  };

  const removeMember = (id) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const validate = () => {
    const e = {};
    if (!tripName.trim()) e.tripName = "Please enter trip name";
    if (!date.trim()) e.date = "Please enter trip date";
    if (!location.trim()) e.location = "Please enter location";
    if (members.length === 0) e.members = "Please add at least 1 member";
    if (gangMode === "existing" && !selectedGangId) e.gang = "Please choose a gang, or create a new one";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const displayDate = toDisplayDate(date);

  const handleSave = () => {
    if (!validate()) return;

    let gangId = selectedGangId;
    if (gangMode === "new") {
      const name = newGangName.trim() || `${tripName.trim()} Gang`;
      gangId = createGang ? createGang(name, members) : null;
    }
    if (!gangId) {
      setErrors((e) => ({ ...e, gang: "Couldn't set up the gang — try again" }));
      return;
    }

    addTrip({ title: tripName, members: members.length, memberList: members, total: "0", date: displayDate, location, creator: creatorId || "", gangId });
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
          <input className="ns-input" placeholder="NCT127 Bangkok Concert" value={tripName} onChange={(e) => setTripName(e.target.value)} maxLength={60} />
          {errors.tripName && <p className="ns-error">{errors.tripName}</p>}
        </div>

        {/* Date — defaults to today; tapping it opens the phone's native
            scroll-wheel date picker to pick a different day */}
        <div className="ns-input-group">
          <label className="ns-input-label">Date</label>
          <input
            className="ns-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && <p className="ns-error">{errors.date}</p>}
        </div>

        <div className="ns-input-group" style={{ marginBottom: 0 }}>
          <label className="ns-input-label">Location</label>
          <input className="ns-input" placeholder="Bangkok" value={location} onChange={(e) => setLocation(e.target.value)} />
          {errors.location && <p className="ns-error">{errors.location}</p>}
        </div>
      </div>

      {/* ── Gang — which persistent group owns this trip's rewards/points.
          Picking an existing one means points earned here add to the
          same pool as this gang's other trips, instead of starting from
          zero. ── */}
      <div className="ns-card">
        <label className="ns-input-label">Gang</label>
        <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 10, marginTop: -4 }}>
          Rewards and points belong to the gang, not just this one trip.
        </div>

        {gangs.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setGangMode("existing")}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
                background: gangMode === "existing" ? "rgba(0,255,133,0.15)" : "var(--ns-card2)",
                border: `1px solid ${gangMode === "existing" ? "rgba(0,255,133,0.35)" : "var(--ns-border)"}`,
                color: gangMode === "existing" ? "var(--ns-g)" : "var(--ns-text2)",
                fontSize: 13, fontWeight: 700,
              }}
            >
              Use Existing
            </button>
            <button
              type="button"
              onClick={() => setGangMode("new")}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
                background: gangMode === "new" ? "rgba(0,255,133,0.15)" : "var(--ns-card2)",
                border: `1px solid ${gangMode === "new" ? "rgba(0,255,133,0.35)" : "var(--ns-border)"}`,
                color: gangMode === "new" ? "var(--ns-g)" : "var(--ns-text2)",
                fontSize: 13, fontWeight: 700,
              }}
            >
              Create New
            </button>
          </div>
        )}

        {gangMode === "existing" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {gangs.map((gang) => {
              const memberCount = gang.members ? Object.keys(gang.members).length : 0;
              const isSelected = selectedGangId === gang.id;
              return (
                <button
                  key={gang.id}
                  type="button"
                  onClick={() => applyGang(gang)}
                  style={{
                    padding: "7px 14px", borderRadius: 100, cursor: "pointer",
                    background: isSelected ? "rgba(0,255,133,0.15)" : "var(--ns-card2)",
                    border: `1px solid ${isSelected ? "rgba(0,255,133,0.35)" : "var(--ns-border)"}`,
                    color: isSelected ? "var(--ns-g)" : "var(--ns-text2)", fontSize: 12, fontWeight: 600,
                  }}
                >
                  👥 {gang.name} ({memberCount})
                </button>
              );
            })}
          </div>
        ) : (
          <input
            className="ns-input"
            placeholder={tripName ? `${tripName} Gang` : "e.g. Bangkok Gang"}
            value={newGangName}
            onChange={(e) => setNewGangName(e.target.value)}
            maxLength={40}
          />
        )}
        {errors.gang && <p className="ns-error">{errors.gang}</p>}
      </div>

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
            maxLength={40}
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
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 100,
              background: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.25)",
              fontSize: 13, fontWeight: 600, color: "var(--ns-g)",
            }}>
              {m.name}{m.id === creatorId ? " (you)" : ""}
              <button
                type="button"
                onClick={() => removeMember(m.id)}
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
            {members.length} members · {location || "Location"} {displayDate ? `· ${displayDate}` : ""}
          </div>
        </div>
      )}

      <button className="ns-btn ns-btn-primary" onClick={handleSave}>Save Trip 🚀</button>
      <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setPage("home")}>Cancel</button>
    </div>
  );
}

export default CreateTrip;