import React, { useState } from "react";
import "../App.css";
 
function Bills({ setPage, tripBills = [], setSelectedBill }) {
  const [filter, setFilter] = useState("All");
 
  const getIcon = (cat) =>
    ({ Food:"🍜", Ticket:"🎫", Transport:"🚕", Travel:"🚕", Merch:"🛍️", Hotel:"🏨" }[cat] || "🧾");
 
  const normalizeBill = (bill) => {
    const sharedBy    = Array.isArray(bill.sharedBy) ? bill.sharedBy : [];
    const peopleCount = sharedBy.length || Number(bill.pax) || Number(bill.people) || 1;
    return {
      ...bill,
      name:     bill.name || bill.title || "Untitled Expense",
      amount:   Number(bill.amount) || 0,
      paidBy:   bill.paidBy || "",
      category: bill.category || "Other",
      sharedBy,
      pax:      peopleCount,
      status:   bill.status || "Pending",
      date:     bill.date || "Recently added",
    };
  };
 
  const filters = ["All", "Pending", "Finished"];
 
  const filteredBills = tripBills
    .map(normalizeBill)
    .filter((b) => filter === "All" || b.status === filter)
    .sort((a, b) => (b.id || 0) - (a.id || 0));
 
  return (
    <div className="ns-screen">
 
      {/* ── Header ── */}
      <div className="ns-page-header">
        <span className="ns-display">Bills</span>
        <button
          className="ns-btn ns-btn-primary"
          style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
          onClick={() => setPage("addexpense")}
        >
          + Add
        </button>
      </div>
 
      {/* ── Quick actions ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button
          className="ns-btn ns-btn-dark"
          style={{ flex: 1, padding: "10px" }}
          onClick={() => setPage("billhistory")}
        >
          📋 History
        </button>
        <button
          className="ns-btn ns-btn-dark"
          style={{ flex: 1, padding: "10px" }}
          onClick={() => setPage("settlement")}
        >
          ⚖️ Settlement
        </button>
      </div>
 
      {/* ── Filter tabs ── */}
      <div className="ns-filter-row">
        {filters.map((f) => (
          <button
            key={f}
            className={`ns-filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
 
      {/* ── Bill list ── */}
      {filteredBills.length === 0 ? (
        <div className="ns-card" style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <div style={{ fontWeight: 700, color: "var(--ns-text)", marginBottom: 4 }}>No bills yet</div>
          <div style={{ fontSize: 13, color: "var(--ns-muted)" }}>Add your first bill to get started</div>
        </div>
      ) : (
        filteredBills.map((bill, index) => {
          const splitPerPerson = bill.pax > 0
            ? (bill.amount / bill.pax).toFixed(2)
            : bill.amount.toFixed(2);
          const isFinished = bill.status === "Finished";
 
          return (
            <div
              key={bill.id || `${bill.name}-${index}`}
              className="ns-bill-row ns-clickable"
              style={{ animationDelay: `${index * 0.06}s`, animation: "cardUp 0.3s ease" }}
              onClick={() => {
                setSelectedBill(bill);
                setPage("billdetail");
              }}
            >
              <div className="ns-bill-row-left">
                <div className="ns-bill-icon">{getIcon(bill.category)}</div>
                <div>
                  <div className="ns-bill-name">{bill.name}</div>
                  <div className="ns-bill-meta">
                    Paid by {bill.paidBy} · {bill.pax} people · {splitPerPerson} THB/person
                  </div>
                  <div className="ns-bill-meta">{bill.date}</div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--ns-syne)", fontSize: 15, fontWeight: 800, color: "var(--ns-text)", marginBottom: 6 }}>
                  {bill.amount.toLocaleString()} THB
                </div>
                <span className={`ns-badge ${isFinished ? "ns-badge-green" : "ns-badge-yellow"}`}>
                  {isFinished ? "✅ Done" : "⏳ Pending"}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
 
export default Bills;