import React, { useState } from "react";
import "../App.css";

function EditTrip({ setPage, currentTrip, tripMembers = [], tripBills = [], userProfile, updateTripDetails, addMember, removeMember, editMember, claimTripCreator }) {
  const [tripName, setTripName] = useState(currentTrip?.title || "");
  const [date, setDate] = useState(currentTrip?.date || "");
  const [location, setLocation] = useState(currentTrip?.location || "");
  const [memberInput, setMemberInput] = useState("");
  const [editingMember, setEditingMember] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const [errors, setErrors] = useState({});

  const memberHasData = (name) =>
    tripBills.some((b) => b.paidBy === name || (Array.isArray(b.sharedBy) && b.sharedBy.includes(name)));

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (!trimmed) return;
    if (tripMembers.includes(trimmed)) {
      setEditError("That name is already in this trip");
      return;
    }
    addMember(trimmed);
    setMemberInput("");
    setEditError("");
  };

  const handleRemoveMember = (name) => {
    if (memberHasData(name)) {
      const ok = window.confirm(
        `${name} has existing expenses in this trip.\n\nRemoving them may affect settlement calculations. Their past bills and points stay on record — they just won't be listed as a trip member anymore.\n\nRemove anyway?`
      );
      if (!ok) return;
    } else {
      if (!window.confirm(`Remove ${name} from this trip?`)) return;
    }
    removeMember(name);
    if (editingMember === name) {
      setEditingMember(null);
      setEditValue("");
    }
  };

  const startEditMember = (member) => {
    setEditingMember(member);
    setEditValue(member);
    setEditError("");
  };

  const cancelEditMember = () => {
    setEditingMember(null);
    setEditValue("");
    setEditError("");
  };

  const saveEditMember = () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditError("Name can't be empty");
      return;
    }
    const isDuplicate = tripMembers.some(
      (m) => m !== editingMember && m.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setEditError("That name is already used");
      return;
    }
    if (trimmed !== editingMember) {
      editMember(editingMember, trimmed);
    }
    setEditingMember(null);
    setEditValue("");
    setEditError("");
  };

  const validate = () => {
    const e = {};
    if (!tripName.trim()) e.tripName = "Please enter trip name";
    if (!date.trim()) e.date = "Please enter trip date";
    if (!location.trim()) e.location = "Please enter location";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    updateTripDetails({ title: tripName.trim(), date: date.trim(), location: location.trim() });
    setPage("tripdetail");
  };

  // Lets you recover creator access on a trip whose stored "creator"
  // field never matched your profile name (e.g. an older trip created
  // before the auto-add-yourself logic existed, or after a rename that
  // predates the cascading-rename fix). Also makes sure you're listed
  // as a member, since a trip's creator should always be part of it.
  const isAlreadyCreator = !!currentTrip?.creator && currentTrip.creator === userProfile?.name;
  const handleClaimCreator = () => {
    if (!userProfile?.name) return;
    const ok = window.confirm(
      `Make "${userProfile.name}" the creator of this trip?\n\nThis gives you access to Edit Milestones, Create Reward, and Confirm Redeem for "${currentTrip?.title || "this trip"}".`
    );
    if (!ok) return;
    claimTripCreator && claimTripCreator();
  };

  return (
    <div className="ns-screen">

      {/* ── Header ── */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("tripdetail")}>‹</button>
        <span className="ns-title">Edit Trip</span>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Trip details ── */}
      <div className="ns-card">
        <div className="ns-input-group">
          <label className="ns-input-label">Trip Name</label>
          <input className="ns-input" value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="e.g. Taipei" />
          {errors.tripName && <p className="ns-error">{errors.tripName}</p>}
        </div>
        <div className="ns-input-group">
          <label className="ns-input-label">Date</label>
          <input className="ns-input" value={date} onChange={(e) => setDate(e.target.value)} placeholder="31/10/26" />
          {errors.date && <p className="ns-error">{errors.date}</p>}
        </div>
        <div className="ns-input-group" style={{ marginBottom: 0 }}>
          <label className="ns-input-label">Location</label>
          <input className="ns-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bangkok" />
          {errors.location && <p className="ns-error">{errors.location}</p>}
        </div>
      </div>

      {/* ── Creator access — only shown when it's actually out of sync ── */}
      {!isAlreadyCreator && userProfile?.name && (
        <div className="ns-card" style={{
          background: "color-mix(in srgb, var(--ns-g) 6%, transparent)",
          border: "1px solid color-mix(in srgb, var(--ns-g) 25%, transparent)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-text)", marginBottom: 4 }}>
            👑 Creator access
          </div>
          <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 10 }}>
            This trip's creator is currently{" "}
            <strong style={{ color: "var(--ns-text2)" }}>{currentTrip?.creator || "not set"}</strong>,
            which doesn't match your profile name ({userProfile.name}). That's why you can't
            edit milestones or confirm redeems here.
          </div>
          <button
            type="button"
            className="ns-btn ns-btn-dark"
            onClick={handleClaimCreator}
          >
            Make {userProfile.name} the creator
          </button>
        </div>
      )}

      {/* ── Members ── */}
      <div className="ns-card">
        <label className="ns-input-label">Members ({tripMembers.length})</label>
        <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 10, marginTop: -4 }}>
          Tap a name to rename it — their past bills and points stay linked to them.
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            className="ns-input"
            placeholder="Add a name..."
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddMember(); } }}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={handleAddMember}
            style={{
              padding: "0 16px", borderRadius: 12, flexShrink: 0,
              background: "color-mix(in srgb, var(--ns-g) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--ns-g) 30%, transparent)",
              color: "var(--ns-g)", fontWeight: 800, fontSize: 18, cursor: "pointer",
            }}
          >+</button>
        </div>

        {editError && <p className="ns-error" style={{ marginBottom: 10 }}>{editError}</p>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {tripMembers.map((m) =>
            editingMember === m ? (
              <div
                key={m}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 6px 4px 10px", borderRadius: 100,
                  background: "var(--ns-card2)", border: "1px solid rgba(0,255,133,0.4)",
                }}
              >
                <input
                  className="ns-input"
                  value={editValue}
                  onChange={(e) => { setEditValue(e.target.value); setEditError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); saveEditMember(); }
                    if (e.key === "Escape") { e.preventDefault(); cancelEditMember(); }
                  }}
                  autoFocus
                  style={{ width: 92, padding: "4px 8px", fontSize: 12, marginBottom: 0, borderRadius: 100 }}
                />
                <button type="button" onClick={saveEditMember} title="Save" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ns-g)", fontSize: 15, lineHeight: 1, padding: 0 }}>✓</button>
                <button type="button" onClick={cancelEditMember} title="Cancel" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ns-muted)", fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
              </div>
            ) : (
              <div
                key={m}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 10px 5px 12px", borderRadius: 100,
                  background: "var(--ns-card2)", border: "1px solid var(--ns-border)",
                  fontSize: 12, fontWeight: 600, color: "var(--ns-text2)",
                }}
              >
                <span onClick={() => startEditMember(m)} title="Tap to rename" style={{ cursor: "pointer" }}>
                  {m}{memberHasData(m) ? " •" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(m)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,59,92,0.7)", fontSize: 16, lineHeight: 1, padding: "0 0 0 2px" }}
                >
                  &times;
                </button>
              </div>
            )
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--ns-muted)", marginTop: 10 }}>
          • = has expenses in this trip already
        </div>
      </div>

      <button className="ns-btn ns-btn-primary" onClick={handleSave}>Save Changes ✓</button>
      <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setPage("tripdetail")}>Cancel</button>
    </div>
  );
}

export default EditTrip;