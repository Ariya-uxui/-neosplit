import React, { useState } from "react";
import "../App.css";
 
function CreateTrip({ setPage, addTrip }) {
  const [tripName,  setTripName]  = useState("");
  const [date,      setDate]      = useState("");
  const [members,   setMembers]   = useState("");
  const [location,  setLocation]  = useState("");
  const [errors,    setErrors]    = useState({});
 
  const validate = () => {
    const e = {};
    if (!tripName.trim())             e.tripName = "Please enter trip name";
    if (!date.trim())                 e.date     = "Please enter trip date";
    if (!location.trim())             e.location = "Please enter location";
    if (!members || Number(members) <= 0) e.members = "Members must be more than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  const handleSave = () => {
    if (!validate()) return;
    addTrip({ title: tripName, members: Number(members), total: "0", date, location });
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
          <input
            className="ns-input"
            placeholder="NCT127 Bangkok Concert"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
          />
          {errors.tripName && <p className="ns-error">{errors.tripName}</p>}
        </div>
 
        <div className="ns-input-group">
          <label className="ns-input-label">Date</label>
          <input
            className="ns-input"
            placeholder="10/04/2026"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && <p className="ns-error">{errors.date}</p>}
        </div>
 
        <div className="ns-input-group">
          <label className="ns-input-label">Location</label>
          <input
            className="ns-input"
            placeholder="Bangkok"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          {errors.location && <p className="ns-error">{errors.location}</p>}
        </div>
 
        <div className="ns-input-group" style={{ marginBottom: 0 }}>
          <label className="ns-input-label">Number of Members</label>
          <input
            className="ns-input"
            type="number"
            placeholder="3"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
          />
          {errors.members && <p className="ns-error">{errors.members}</p>}
        </div>
      </div>
 
      {/* ── Preview card ── */}
      {(tripName || location || members) && (
        <div
          className="ns-card"
          style={{
            background: "linear-gradient(135deg, rgba(0,255,133,0.08), rgba(0,255,133,0.02))",
            border: "1px solid rgba(0,255,133,0.2)",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,255,133,0.7)", marginBottom: 8 }}>
            Preview
          </div>
          <div style={{ fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800, color: "var(--ns-text)", marginBottom: 6 }}>
            {tripName || "Your trip name"}
          </div>
          <div style={{ fontSize: 13, color: "var(--ns-muted)" }}>
            {members || 0} members · {location || "Location"} {date ? `· ${date}` : ""}
          </div>
        </div>
      )}
 
      <button className="ns-btn ns-btn-primary" onClick={handleSave}>
        Save Trip 🚀
      </button>
      <button
        className="ns-btn ns-btn-ghost"
        style={{ marginTop: 10 }}
        onClick={() => setPage("home")}
      >
        Cancel
      </button>
 
    </div>
  );
}
 
export default CreateTrip;