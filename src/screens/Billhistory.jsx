import React, { useState } from "react";
import "../App.css";
 
function BillHistory({ setPage, tripBills = [], setSelectedBill }) {
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
 
  const filters       = ["All", "Pending", "Finished"];
  const pendingCount  = tripBills.filter((b) => b.status !== "Finished").length;
  const finishedCount = tripBills.filter((b) => b.status === "Finished").length;
 
  const filteredBills = tripBills
    .map(normalizeBill)
    .filter((b) => filter === "All" || b.status === filter)
    .sort((a, b) => (b.id || 0) - (a.id || 0));
 
  return (
    <div className="ns-screen">
 
      {/* ── Header ── */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("receipt")}>‹</button>
        <span className="ns-title">Bill History</span>
        <div style={{ width: 36 }} />
      </div>
 
      {/* ── Summary chips ── */}
      <div className="ns-summary-row">
        <div className="ns-summary-chip">
          <span className="ns-summary-chip-label">Pending</span>
          <span className="ns-summary-chip-value" style={{ color: "var(--ns-y)" }}>
            {pendingCount}
          </span>
        </div>
        <div className="ns-summary-chip">
          <span className="ns-summary-chip-label">Settled</span>
          <span className="ns-summary-chip-value" style={{ color: "var(--ns-g)" }}>
            {finishedCount}
          </span>
        </div>
        <div className="ns-summary-chip">
          <span className="ns-summary-chip-label">Total</span>
          <span className="ns-summary-chip-value">{tripBills.length}</span>
        </div>
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
          <div style={{ fontSize: 36, marginBottom: 10 }}>
            {filter === "Finished" ? "🎉" : "📋"}
          </div>
          <div style={{ fontWeight: 700, color: "var(--ns-text)", marginBottom: 4 }}>
            {filter === "Finished" ? "No settled bills yet" : "No pending bills"}
          </div>
          <div style={{ fontSize: 13, color: "var(--ns-muted)" }}>
            {filter === "Finished"
              ? "Settle a bill to see it here"
              : "All bills are settled!"}
          </div>
        </div>
      ) : (
        filteredBills.map((bill, index) => {
          const perPerson =
            bill.pax > 0
              ? (bill.amount / bill.pax).toFixed(2)
              : bill.amount.toFixed(2);
          const isFinished = bill.status === "Finished";
 
          return (
            <div
              key={bill.id || `${bill.name}-${index}`}
              className="ns-bill-row ns-clickable"
              style={{
                flexDirection: "column",
                alignItems: "stretch",
                gap: 10,
                animationDelay: `${index * 0.06}s`,
              }}
              onClick={() => {
                setSelectedBill(bill);
                setPage("billdetail");
              }}
            >
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div className="ns-bill-row-left">
                  <div className="ns-bill-icon">{getIcon(bill.category)}</div>
                  <div>
                    <div className="ns-bill-name">{bill.name}</div>
                    <div className="ns-bill-meta">{bill.category} · {bill.date}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--ns-syne)", fontSize: 15, fontWeight: 800, color: "var(--ns-text)", marginBottom: 5 }}>
                    {bill.amount.toLocaleString()} THB
                  </div>
                  <span className={`ns-badge ${isFinished ? "ns-badge-green" : "ns-badge-yellow"}`}>
                    {isFinished ? "✅ Settled" : "⏳ Pending"}
                  </span>
                </div>
              </div>
 
              {/* Footer row */}
              <div
                style={{
                  display: "flex", gap: 6, flexWrap: "wrap",
                  fontSize: 12, color: "var(--ns-muted)",
                  paddingTop: 8, borderTop: "1px solid var(--ns-border)",
                }}
              >
                <span>Paid by {bill.paidBy}</span>
                <span>·</span>
                <span>{bill.pax} people</span>
                <span>·</span>
                <span>{perPerson} THB/person</span>
              </div>
            </div>
          );
        })
      )}
 
      <button
        className="ns-btn ns-btn-ghost ns-mt-12"
        onClick={() => setPage("receipt")}
      >
        ← Back to Bills
      </button>
 
    </div>
  );
}
 
export default BillHistory;