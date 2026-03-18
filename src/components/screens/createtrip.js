import React, { useState } from "react";
import "../App.css";

function CreateTrip({ setPage, addTrip }) {
  const [tripName, setTripName] = useState("");
  const [date, setDate] = useState("");
  const [members, setMembers] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!tripName.trim()) newErrors.tripName = "Please enter trip name";
    if (!date.trim()) newErrors.date = "Please enter trip date";
    if (!location.trim()) newErrors.location = "Please enter location";
    if (!members || Number(members) <= 0) {
      newErrors.members = "Members must be more than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    addTrip({
      title: tripName,
      members: Number(members),
      total: "0",
      date,
      location
    });

    setPage("home");
  };

  return (
    <div className="screen-yellow">
      <div className="top-pill">Create Trip</div>

      <div className="white-panel mt-20">
        <label className="field-label">Trip Name</label>
        <input
          className="input-pill"
          placeholder="NCT127 Bangkok Concert"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
        />
        {errors.tripName && <p className="error-text">{errors.tripName}</p>}

        <label className="field-label">Date</label>
        <input
          className="input-pill"
          placeholder="10 / 04 / 2026"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {errors.date && <p className="error-text">{errors.date}</p>}

        <label className="field-label">Location</label>
        <input
          className="input-pill"
          placeholder="Bangkok"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        {errors.location && <p className="error-text">{errors.location}</p>}

        <label className="field-label">Members</label>
        <input
          className="input-pill"
          type="number"
          placeholder="3"
          value={members}
          onChange={(e) => setMembers(e.target.value)}
        />
        {errors.members && <p className="error-text">{errors.members}</p>}

        <div className="trip-preview-card mt-16">
          <div className="trip-preview-label">Preview</div>
          <div className="trip-preview-title">{tripName || "Your trip name"}</div>
          <div className="trip-preview-meta">
            {members || 0} members • {location || "Location"}
          </div>
        </div>
      </div>

      <button className="btn-black mt-20" onClick={handleSave}>
        Save Trip
      </button>

      <button className="btn-gray mt-12" onClick={() => setPage("home")}>
        Cancel
      </button>
    </div>
  );
}

export default CreateTrip;