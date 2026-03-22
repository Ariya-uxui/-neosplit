import React from "react";
import "../App.css";
 
function BillDetail({ setPage, selectedBill, markBillAsSettled }) {
 
  // ── Guard ──
  if (!selectedBill) {
    return (
      <div className="ns-screen">
        <div className="ns-page-header">
          <button className="ns-back-btn" onClick={() => setPage("receipt")}>‹</button>
          <span className="ns-title">Bill Detail</span>
          <div style={{ width: 36 }} />
        </div>
        <div className="ns-card" style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontWeight: 700, color: "var(--ns-text)" }}>No bill selected</div>
        </div>
        <button className="ns-btn ns-btn-ghost" onClick={() => setPage("receipt")}>
          ← Back to Bills
        </button>
      </div>
    );
  }
 
  const getIcon = (cat) =>
    ({ Food:"🍜", Ticket:"🎫", Transport:"🚕", Travel:"🚕", Merch:"🛍️", Hotel:"🏨" }[cat] || "🧾");
 
  // Normalize — รองรับทั้ง .name / .title, sharedBy / pax / people
  const title  = selectedBill.name || selectedBill.title || "Untitled Expense";
  const people =
    (Array.isArray(selectedBill.sharedBy) && selectedBill.sharedBy.length > 0
      ? selectedBill.sharedBy.length : null) ||
    Number(selectedBill.pax) ||
    Number(selectedBill.people) ||
    1;
 
  const amount    = Number(selectedBill.amount || 0);
  const perPerson = people > 0 ? (amount / people).toFixed(2) : "0.00";
  const isFinished = selectedBill.status === "Finished";
 
  return (
    <div className="ns-screen">
 
      {/* ── Header ── */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("receipt")}>‹</button>
        <span className="ns-title">Bill Detail</span>
        <div style={{ width: 36 }} />
      </div>
 
      {/* ── Hero ── */}
      <div className="ns-detail-hero">
        <div className="ns-detail-hero-icon">{getIcon(selectedBill.category)}</div>
        <div className="ns-detail-hero-name">{title}</div>
        <div className="ns-detail-hero-amount">{amount.toLocaleString()} THB</div>
        <span className={`ns-badge ns-mt-8 ${isFinished ? "ns-badge-green" : "ns-badge-yellow"}`}>
          {isFinished ? "✅ Settled" : "⏳ Pending"}
        </span>
      </div>
 
      {/* ── Info rows ── */}
      <div className="ns-card">
        <div className="ns-info-row">
          <span className="ns-info-label">Paid by</span>
          <span className="ns-info-value">{selectedBill.paidBy}</span>
        </div>
        <div className="ns-info-row">
          <span className="ns-info-label">Shared by</span>
          <span className="ns-info-value">{people} people</span>
        </div>
        <div className="ns-info-row">
          <span className="ns-info-label">Per person</span>
          <span className="ns-info-value" style={{ color: "var(--ns-g)", fontFamily: "var(--ns-syne)", fontSize: 15 }}>
            {perPerson} THB
          </span>
        </div>
        <div className="ns-info-row">
          <span className="ns-info-label">Category</span>
          <span className="ns-info-value">{selectedBill.category}</span>
        </div>
        <div className="ns-info-row">
          <span className="ns-info-label">Date</span>
          <span className="ns-info-value">{selectedBill.date || "Recently added"}</span>
        </div>
 
        {/* Member chips */}
        {Array.isArray(selectedBill.sharedBy) && selectedBill.sharedBy.length > 0 && (
          <div className="ns-info-row" style={{ alignItems: "flex-start" }}>
            <span className="ns-info-label">Members</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
              {selectedBill.sharedBy.map((member) => (
                <span key={member} className="ns-member-chip">{member}</span>
              ))}
            </div>
          </div>
        )}
      </div>
 
      {/* ── Actions ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
        <button className="ns-btn ns-btn-dark" onClick={() => setPage("settlement")}>
          View Settlement
        </button>
 
        {!isFinished && (
          <button
            className="ns-btn ns-btn-primary"
            onClick={() => {
              markBillAsSettled(selectedBill.id);
              setPage("billhistory");
            }}
          >
            ✅ Mark as Settled
          </button>
        )}
 
        <button className="ns-btn ns-btn-ghost" onClick={() => setPage("receipt")}>
          ← Back to Bills
        </button>
      </div>
 
    </div>
  );
}
 
export default BillDetail;