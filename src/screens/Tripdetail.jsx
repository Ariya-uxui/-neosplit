import React from "react";
import "../App.css";
import ExpenseChart from "../components/ExpenseChart";
 
function TripDetail({ setPage, tripBills = [], deleteExpense, startEditExpense, deleteTrip, currentTrip, currentTripId, getInviteLink }) {
  const total = tripBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
 
  const getCategoryIcon = (cat) =>
    ({ Food:"🍜", Hotel:"🏨", Transport:"🚕", Travel:"🚕", Ticket:"🎫", Merch:"🛍️" }[cat] || "💸");
 
  const getCategoryColor = (cat) =>
    ({ Food:"#FF6B35", Ticket:"#00FF85", Transport:"#FFD400", Travel:"#FFD400", Merch:"#FF3B5C", Hotel:"#8B5CF6" }[cat] || "#6B7280");
 
  const catMap = {};
  tripBills.forEach((b) => {
    catMap[b.category] = (catMap[b.category] || 0) + (Number(b.amount) || 0);
  });
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
 
  return (
    <div className="ns-screen">

      {/* ── Header ── */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("home")}>‹</button>
        <span className="ns-title">{currentTrip?.title || "Bills Detail"}</span>
        <button
          className="ns-btn ns-btn-primary"
          style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
          onClick={() => setPage("addexpense")}
        >
          + Add
        </button>
      </div>

      {/* ── Invite + Delete row ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button
          className="ns-btn ns-btn-dark"
          style={{ flex: 1, padding: "10px", fontSize: 13 }}
          onClick={() => {
            const link = getInviteLink ? getInviteLink() : "";
            if (link) {
              navigator.clipboard.writeText(link);
              alert("Invite link copied!\n\n" + link);
            }
          }}
        >
          🔗 Share Invite Link
        </button>
        <button
          className="ns-btn"
          style={{
            width: "auto", padding: "10px 14px", fontSize: 12,
            background: "rgba(255,59,92,0.08)",
            color: "var(--ns-r)",
            border: "1px solid rgba(255,59,92,0.2)",
          }}
          onClick={() => {
            if (window.confirm("Delete this trip and all its expenses?")) {
              if (deleteTrip && currentTripId) deleteTrip(currentTripId);
              setPage("home");
            }
          }}
        >
          🗑
        </button>
      </div>

      {/* ── Summary card ── */}
      <div className="ns-card" style={{
        background: "linear-gradient(135deg, rgba(0,255,133,0.1), rgba(0,255,133,0.03))",
        border: "1px solid rgba(0,255,133,0.2)",
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,255,133,0.7)", marginBottom: 6 }}>
          {currentTrip?.title || "Trip"}
        </div>
        <div style={{ fontFamily: "var(--ns-syne)", fontSize: 34, fontWeight: 800, color: "var(--ns-g)", letterSpacing: "-1px", lineHeight: 1 }}>
          {total.toLocaleString()}
          <span style={{ fontSize: 16, color: "var(--ns-muted)", marginLeft: 6 }}>THB</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: 5 }}>
          {tripBills.length} expenses · {tripBills.filter(b => b.status !== "Finished").length} pending
        </div>
      </div>
 
      {/* ── Category breakdown ── */}
      {cats.length > 0 && (
        <div className="ns-card" style={{ marginBottom: 14 }}>
          <div className="ns-section-label" style={{ margin: "0 0 12px" }}>Category Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cats.map(([cat, amt]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 13, color: "var(--ns-text2)", width: 80, flexShrink: 0 }}>
                  {getCategoryIcon(cat)} {cat}
                </div>
                <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 100, background: getCategoryColor(cat), width: `${(amt / total * 100).toFixed(0)}%`, transition: "width 0.6s ease" }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--ns-muted)", width: 32, textAlign: "right" }}>
                  {(amt / total * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* ── ExpenseChart ── */}
      {tripBills.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <ExpenseChart tripBills={tripBills} />
        </div>
      )}
 
      {/* ── Bills list ── */}
      <div className="ns-section-label">All Expenses</div>
 
      {tripBills.length === 0 ? (
        <div className="ns-card" style={{ textAlign: "center", padding: 32, color: "var(--ns-muted)" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <div style={{ fontWeight: 700, color: "var(--ns-text)", marginBottom: 4 }}>No expenses yet</div>
          <div style={{ fontSize: 13 }}>Add your first bill from Bills page</div>
        </div>
      ) : (
        tripBills.map((bill, index) => {
          const people = bill.sharedBy?.length || bill.pax || 1;
          const each = people > 0 ? (Number(bill.amount || 0) / people).toFixed(2) : "0.00";
          const isFinished = bill.status === "Finished";
 
          return (
            <div
              key={bill.id || `${bill.name}-${index}`}
              className="ns-card"
              style={{ animationDelay: `${index * 0.05}s`, animation: "cardUp 0.3s ease" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ fontSize: 20, width: 38, height: 38, background: "rgba(255,255,255,0.04)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {getCategoryIcon(bill.category)}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ns-text)", marginBottom: 4 }}>{bill.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: "rgba(255,255,255,0.06)", color: "var(--ns-text2)", border: "1px solid var(--ns-border)" }}>
                      {bill.category}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--ns-syne)", fontSize: 16, fontWeight: 800, color: "var(--ns-y)" }}>
                    {Number(bill.amount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ns-muted)" }}>THB</div>
                </div>
              </div>
 
              <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 6 }}>
                Paid by {bill.paidBy} · {people} pax · {each} THB/person
              </div>
 
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={`ns-badge ${isFinished ? "ns-badge-green" : "ns-badge-yellow"}`}>
                  {isFinished ? "✅ Settled" : "⏳ Pending"}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="ns-btn ns-btn-dark"
                    style={{ width: "auto", padding: "7px 14px", fontSize: 12 }}
                    onClick={() => startEditExpense(bill)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ns-btn"
                    style={{ width: "auto", padding: "7px 14px", fontSize: 12, background: "rgba(255,59,92,0.1)", color: "var(--ns-r)", border: "1px solid rgba(255,59,92,0.2)" }}
                    onClick={() => deleteExpense(bill.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
 
      {/* ── Go to Settlement ── */}
      <button className="ns-btn ns-btn-primary" style={{ marginTop: 8 }} onClick={() => setPage("settlement")}>
        Go to Settlement →
      </button>
    </div>
  );
}
 
export default TripDetail;