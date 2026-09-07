import React, { useState } from "react";
import "../App.css";

const ICON_SUGGESTIONS = ["🎁", "🍜", "🍽️", "🚕", "🏨", "☕", "🎬", "👑", "😎", "🍰", "🎮", "🛍️"];

function CreateReward({ setPage, addReward }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎁");
  const [points, setPoints] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Please enter a reward name";
    if (!points || Number(points) <= 0) e.points = "Points must be more than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addReward({ name: name.trim(), icon, points: Number(points), description: description.trim() });
    setPage("rewardslist");
  };

  return (
    <div className="ns-screen">

      {/* Header */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("rewardslist")}>‹</button>
        <span className="ns-title">Create Reward</span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 14 }}>
        Rewards are agreed within your group — set your own gang's rules.
      </div>

      <div className="ns-card">
        {/* Icon picker */}
        <div className="ns-input-group">
          <label className="ns-input-label">Icon</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {ICON_SUGGESTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                style={{
                  width: 42, height: 42, borderRadius: 12, fontSize: 20,
                  border: `1px solid ${icon === emoji ? "color-mix(in srgb, var(--ns-g) 40%, transparent)" : "var(--ns-border)"}`,
                  background: icon === emoji ? "color-mix(in srgb, var(--ns-g) 10%, transparent)" : "var(--ns-card2)",
                  cursor: "pointer",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="ns-input-group">
          <label className="ns-input-label">Reward Name</label>
          <input
            className="ns-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pick the next restaurant"
          />
          {errors.name && <div style={{ fontSize: 11, color: "var(--ns-r)", marginTop: 4 }}>{errors.name}</div>}
        </div>

        {/* Points */}
        <div className="ns-input-group">
          <label className="ns-input-label">Points Required</label>
          <input
            className="ns-input"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="150"
          />
          {errors.points && <div style={{ fontSize: 11, color: "var(--ns-r)", marginTop: 4 }}>{errors.points}</div>}
        </div>

        {/* Description */}
        <div className="ns-input-group" style={{ marginBottom: 0 }}>
          <label className="ns-input-label">Description (optional)</label>
          <input
            className="ns-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Winner picks where the gang eats"
          />
        </div>
      </div>

      {/* Preview */}
      {name && (
        <div className="ns-card" style={{
          marginTop: 14,
          background: "linear-gradient(135deg, color-mix(in srgb, var(--ns-g) 8%, transparent), color-mix(in srgb, var(--ns-g) 2%, transparent))",
          border: "1px solid color-mix(in srgb, var(--ns-g) 20%, transparent)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 28 }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ns-text)" }}>{name}</div>
            {description && <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: 2 }}>{description}</div>}
          </div>
          <div style={{ fontFamily: "var(--ns-syne)", fontSize: 16, fontWeight: 800, color: "var(--ns-g)" }}>
            {points || 0} pts
          </div>
        </div>
      )}

      <button className="ns-btn ns-btn-primary" style={{ marginTop: 16 }} onClick={handleSave}>
        Create Reward 🎁
      </button>
      <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setPage("rewardslist")}>
        Cancel
      </button>
    </div>
  );
}

export default CreateReward;