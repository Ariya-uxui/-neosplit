import React, { useEffect, useState } from "react";
import "../App.css";
 
const CATEGORIES = [
  { id: "Food",      icon: "🍜" },
  { id: "Ticket",    icon: "🎫" },
  { id: "Transport", icon: "🚕" },
  { id: "Merch",     icon: "🛍️" },
  { id: "Hotel",     icon: "🏨" },
  { id: "Other",     icon: "💸" },
];
 
function EditExpense({ setPage, editingExpense, updateExpense, tripMembers = [] }) {
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount]           = useState("");
  const [paidBy, setPaidBy]           = useState("");
  const [category, setCategory]       = useState("Food");
  const [sharedBy, setSharedBy]       = useState([]);
  const [errors, setErrors]           = useState({});
 
  useEffect(() => {
    if (editingExpense) {
      const initialSharedBy =
        editingExpense.sharedBy?.length > 0
          ? editingExpense.sharedBy
          : tripMembers.slice(0, editingExpense.pax || tripMembers.length);
      setExpenseName(editingExpense.name || "");
      setAmount(editingExpense.amount || "");
      setPaidBy(editingExpense.paidBy || "");
      setCategory(editingExpense.category || "Food");
      setSharedBy(initialSharedBy);
    }
  }, [editingExpense, tripMembers]);
 
  const toggleMember = (member) =>
    setSharedBy((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
    );
 
  const validate = () => {
    const e = {};
    if (!expenseName.trim())   e.expenseName = "Please enter expense name";
    if (!amount || Number(amount) <= 0) e.amount = "Amount must be more than 0";
    if (!paidBy.trim())        e.paidBy = "Please select payer";
    if (!sharedBy.length)      e.sharedBy = "Please select at least 1 participant";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  const perPerson =
    Number(amount) > 0 && sharedBy.length > 0
      ? (Number(amount) / sharedBy.length).toFixed(2)
      : null;
 
  const handleSave = () => {
    if (!editingExpense || !validate()) return;
    updateExpense({
      ...editingExpense,
      name: expenseName,
      amount: Number(amount),
      paidBy,
      pax: sharedBy.length,
      category,
      sharedBy,
    });
  };
 
  return (
    <div className="ns-screen">
 
      {/* Header */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("tripdetail")}>‹</button>
        <span className="ns-title">Edit Expense</span>
        <div style={{ width: 36 }} />
      </div>
 
      <div className="ns-card">
 
        {/* Expense Name */}
        <div className="ns-input-group">
          <label className="ns-input-label">Expense Name</label>
          <input
            className="ns-input"
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
            placeholder="e.g. Dinner, Taxi, Tickets"
          />
          {errors.expenseName && (
            <div style={{ fontSize: 11, color: "var(--ns-r)", marginTop: 4 }}>{errors.expenseName}</div>
          )}
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
          {errors.amount && (
            <div style={{ fontSize: 11, color: "var(--ns-r)", marginTop: 4 }}>{errors.amount}</div>
          )}
        </div>
 
        {/* Paid By */}
        <div className="ns-input-group">
          <label className="ns-input-label">Paid By</label>
          <select className="ns-input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            <option value="">Select payer</option>
            {tripMembers.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {errors.paidBy && (
            <div style={{ fontSize: 11, color: "var(--ns-r)", marginTop: 4 }}>{errors.paidBy}</div>
          )}
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
                  padding: "7px 14px", borderRadius: 100,
                  border: `1px solid ${category === c.id ? "rgba(0,255,133,0.4)" : "var(--ns-border)"}`,
                  background: category === c.id ? "rgba(0,255,133,0.1)" : "var(--ns-card2)",
                  color: category === c.id ? "var(--ns-g)" : "var(--ns-text2)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {c.icon} {c.id}
              </button>
            ))}
          </div>
        </div>
 
        {/* Shared By */}
        <div className="ns-input-group" style={{ marginBottom: 0 }}>
          <label className="ns-input-label">Shared By ({sharedBy.length} selected)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tripMembers.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMember(m)}
                style={{
                  padding: "7px 14px", borderRadius: 100,
                  border: `1px solid ${sharedBy.includes(m) ? "rgba(0,255,133,0.4)" : "var(--ns-border)"}`,
                  background: sharedBy.includes(m) ? "rgba(0,255,133,0.1)" : "var(--ns-card2)",
                  color: sharedBy.includes(m) ? "var(--ns-g)" : "var(--ns-text2)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                {sharedBy.includes(m) ? "✓ " : ""}{m}
              </button>
            ))}
          </div>
          {errors.sharedBy && (
            <div style={{ fontSize: 11, color: "var(--ns-r)", marginTop: 4 }}>{errors.sharedBy}</div>
          )}
        </div>
      </div>
 
      {/* Per person preview */}
      {perPerson && (
        <div style={{
          padding: "14px 18px", marginBottom: 14,
          background: "rgba(0,255,133,0.06)",
          border: "1px solid rgba(0,255,133,0.15)",
          borderRadius: 16, display: "flex",
          justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: "var(--ns-muted)" }}>Each person pays</span>
          <span style={{ fontFamily: "var(--ns-syne)", fontSize: 22, fontWeight: 800, color: "var(--ns-g)" }}>
            {perPerson} THB
          </span>
        </div>
      )}
 
      <button className="ns-btn ns-btn-primary" onClick={handleSave}>
        Update Expense ✓
      </button>
      <button
        className="ns-btn ns-btn-ghost"
        style={{ marginTop: 10 }}
        onClick={() => setPage("tripdetail")}
      >
        Cancel
      </button>
    </div>
  );
}
 
export default EditExpense;