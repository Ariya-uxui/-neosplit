import React, { useEffect, useState } from "react";
import "../App.css";

// The bill is stored with its date as "DD/MM/YYYY" (en-GB) to match what's
// already shown elsewhere (Bill Detail, bill lists, etc.), but the native
// <input type="date"> — which gives a tap-to-scroll date picker on phones —
// only speaks "YYYY-MM-DD". These convert between the two so the stored
// format never has to change.
const todayInput = () => new Date().toISOString().slice(0, 10);
const toInputDate = (enGB) => {
  if (!enGB) return "";
  const [d, m, y] = enGB.split("/");
  if (!d || !m || !y) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};
const toDisplayDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

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
  const [date, setDate]               = useState(todayInput());
  const [sharedBy, setSharedBy]       = useState([]);
  const [errors, setErrors]           = useState({});

  useEffect(() => {
    if (editingExpense) {
      // tripMembers is [{id, name}] now; paidBy/sharedBy on the bill are
      // ids, so the fallback (no sharedBy saved yet) needs ids too.
      const allMemberIds = tripMembers.map((m) => m.id);
      const initialSharedBy =
        editingExpense.sharedBy?.length > 0
          ? editingExpense.sharedBy
          : allMemberIds.slice(0, editingExpense.pax || allMemberIds.length);
      setExpenseName(editingExpense.name || "");
      setAmount(editingExpense.amount || "");
      setPaidBy(editingExpense.paidBy || "");
      setCategory(editingExpense.category || "Food");
      setDate(toInputDate(editingExpense.date) || todayInput());
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
      date: toDisplayDate(date) || editingExpense.date,
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

      {/* This bill already went through Settlement — Settlement itself
          isn't a frozen record, just a live calculation off whatever's
          saved here, so changing the amount/payer/participants now
          quietly changes what that past settlement "was" too. Not
          blocked (there's no reason it has to be), just flagged. */}
      {editingExpense?.status === "Finished" && (
        <div style={{
          padding: "10px 14px", marginBottom: 14, borderRadius: 12,
          background: "color-mix(in srgb, var(--ns-y) 10%, transparent)",
          border: "1px solid color-mix(in srgb, var(--ns-y) 25%, transparent)",
          fontSize: 12, color: "var(--ns-text)",
        }}>
          ⚠️ This bill was already settled. Changes here won't undo or redo any points, and will change what the past settlement looked like.
        </div>
      )}

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

        {/* Date — defaults to the bill's existing date (or today if it
            doesn't have one); tapping it opens the phone's native
            scroll-wheel date picker to pick a different day */}
        <div className="ns-input-group">
          <label className="ns-input-label">Date</label>
          <input
            className="ns-input"
            type="date"
            value={date}
            max={todayInput()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Paid By */}
        <div className="ns-input-group">
          <label className="ns-input-label">Paid By</label>
          <select className="ns-input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            <option value="">Select payer</option>
            {tripMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
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
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                style={{
                  padding: "7px 14px", borderRadius: 100,
                  border: `1px solid ${sharedBy.includes(m.id) ? "rgba(0,255,133,0.4)" : "var(--ns-border)"}`,
                  background: sharedBy.includes(m.id) ? "rgba(0,255,133,0.1)" : "var(--ns-card2)",
                  color: sharedBy.includes(m.id) ? "var(--ns-g)" : "var(--ns-text2)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                {sharedBy.includes(m.id) ? "✓ " : ""}{m.name}
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