import React, { useState } from "react";
import "../App.css";
 
const CATEGORIES = [
  { id: "Food", icon: "🍜" },
  { id: "Ticket", icon: "🎫" },
  { id: "Transport", icon: "🚕" },
  { id: "Merch", icon: "🛍️" },
  { id: "Hotel", icon: "🏨" },
  { id: "Other", icon: "💸" },
];
 
function AddExpense({ setPage, addExpense, tripMembers = [], addMember, removeMember }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(tripMembers[0] || "");
  const [category, setCategory] = useState("Food");
  const [sharedBy, setSharedBy] = useState([...tripMembers]);
  const [newMemberName, setNewMemberName] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
 
  const handleAddMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    if (addMember) addMember(trimmed);
    setSharedBy((prev) => [...prev, trimmed]);
    if (!paidBy) setPaidBy(trimmed);
    setNewMemberName("");
    setShowAddMember(false);
  };
 
  const handleRemoveMember = (member) => {
    if (removeMember) removeMember(member);
    setSharedBy((prev) => prev.filter((m) => m !== member));
    if (paidBy === member) {
      const remaining = tripMembers.filter((m) => m !== member);
      setPaidBy(remaining[0] || "");
    }
  };
 
  const toggleMember = (member) =>
    setSharedBy((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
    );
 
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || sharedBy.length === 0) return;
    addExpense({
      name,
      amount: Number(amount),
      paidBy,
      pax: sharedBy.length,
      category,
      sharedBy,
      status: "Pending",
      date: new Date().toLocaleDateString("en-GB"),
    });
    setPage("receipt");
  };
 
  const perPerson =
    amount && sharedBy.length > 0
      ? (Number(amount) / sharedBy.length).toFixed(2)
      : null;
 
  return (
    <div className="ns-screen">
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("receipt")}>
          ‹
        </button>
        <span className="ns-title">Add Bill</span>
        <div style={{ width: 36 }} />
      </div>
 
      <form onSubmit={handleSubmit}>
        <div className="ns-card">
 
          {/* Expense Name */}
          <div className="ns-input-group">
            <label className="ns-input-label">Expense Name</label>
            <input
              className="ns-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dinner, Taxi, Tickets"
            />
          </div>
 
          {/* Amount */}
          <div className="ns-input-group">
            <label className="ns-input-label">Amount (THB)</label>
            <input
              className="ns-input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
 
          {/* Paid By + Manage Members */}
          <div className="ns-input-group">
            <label className="ns-input-label">Paid By</label>
            <select
              className="ns-input"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
            >
              {tripMembers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
 
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ns-muted)",
                  marginBottom: 8,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Manage Members
              </div>
 
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}>
                {tripMembers.map((m) => (
                  <div
                    key={m}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "5px 10px 5px 12px",
                      borderRadius: 100,
                      background: "var(--ns-card2)",
                      border: "1px solid var(--ns-border)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ns-text2)",
                    }}
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,59,92,0.7)",
                        fontSize: 16,
                        lineHeight: 1,
                        padding: "0 0 0 2px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
 
                <button
                  type="button"
                  onClick={() => setShowAddMember((v) => !v)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 100,
                    cursor: "pointer",
                    background: showAddMember ? "rgba(0,255,133,0.12)" : "var(--ns-card2)",
                    border: `1px solid ${showAddMember ? "rgba(0,255,133,0.4)" : "var(--ns-border)"}`,
                    color: showAddMember ? "var(--ns-g)" : "var(--ns-muted)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  + Add Name
                </button>
              </div>
 
              {showAddMember && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="ns-input"
                    style={{ flex: 1, marginBottom: 0 }}
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddMember();
                      }
                    }}
                    placeholder="Enter name..."
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 12,
                      cursor: "pointer",
                      background: "rgba(0,255,133,0.15)",
                      border: "1px solid rgba(0,255,133,0.3)",
                      color: "var(--ns-g)",
                      fontSize: 13,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Add ✓
                  </button>
                </div>
              )}
            </div>
          </div>
 
          {/* Category */}
          <div className="ns-input-group">
            <label className="ns-input-label">Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 100,
                    border: `1px solid ${category === c.id ? "rgba(0,255,133,0.4)" : "var(--ns-border)"}`,
                    background: category === c.id ? "rgba(0,255,133,0.1)" : "var(--ns-card2)",
                    color: category === c.id ? "var(--ns-g)" : "var(--ns-text2)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {c.icon} {c.id}
                </button>
              ))}
            </div>
          </div>
 
          {/* Shared By */}
          <div className="ns-input-group" style={{ marginBottom: 0 }}>
            <label className="ns-input-label">
              Shared By ({sharedBy.length} selected)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tripMembers.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMember(m)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 100,
                    border: `1px solid ${sharedBy.includes(m) ? "rgba(0,255,133,0.4)" : "var(--ns-border)"}`,
                    background: sharedBy.includes(m) ? "rgba(0,255,133,0.1)" : "var(--ns-card2)",
                    color: sharedBy.includes(m) ? "var(--ns-g)" : "var(--ns-text2)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {sharedBy.includes(m) ? "✓ " : ""}
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
 
        {/* Per person preview */}
        {perPerson && (
          <div
            style={{
              padding: "14px 18px",
              marginBottom: 14,
              background: "rgba(0,255,133,0.06)",
              border: "1px solid rgba(0,255,133,0.15)",
              borderRadius: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--ns-muted)" }}>Each person pays</span>
            <span
              style={{
                fontFamily: "var(--ns-syne)",
                fontSize: 22,
                fontWeight: 800,
                color: "var(--ns-g)",
              }}
            >
              {perPerson} THB
            </span>
          </div>
        )}
 
        <button type="submit" className="ns-btn ns-btn-primary">
          Save Bill ✓
        </button>
        <button
          type="button"
          className="ns-btn ns-btn-ghost"
          style={{ marginTop: 10 }}
          onClick={() => setPage("receipt")}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
 
export default AddExpense;