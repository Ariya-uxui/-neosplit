import React, { useMemo } from "react";
import "../App.css";

function Home({ setPage, tripBills = [], tripMembers = [], userProfile, trips = [], currentTripId, selectTrip, deleteTrip }) {

  const dashboard = useMemo(() => {
    const totalSpend = tripBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const pendingBills  = tripBills.filter((b) => b.status !== "Finished");
    const finishedBills = tripBills.filter((b) => b.status === "Finished");
    const finished  = finishedBills.length;
    const progress  = tripBills.length ? Math.round((finished / tripBills.length) * 100) : 0;

    const paidMap = {};
    tripBills.forEach((b) => {
      const payer = b.paidBy || "Unknown";
      paidMap[payer] = (paidMap[payer] || 0) + (Number(b.amount) || 0);
    });

    const [topSpender, topSpenderAmount] =
      Object.entries(paidMap).sort((a, b) => b[1] - a[1])[0] || ["—", 0];

    const currentUser = userProfile?.name || tripMembers[0] || "You";
    const yourPaid    = paidMap[currentUser] || 0;
    let   yourShare   = 0;

    tripBills.forEach((b) => {
      const participants =
        b.sharedBy && b.sharedBy.length > 0
          ? b.sharedBy
          : tripMembers.slice(0, Number(b.pax) || tripMembers.length);
      if (participants.includes(currentUser)) {
        yourShare += (Number(b.amount) || 0) / participants.length;
      }
    });

    const yourBalance  = yourPaid - yourShare;
    const recentBills  = [...tripBills].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 3);

    return {
      totalSpend, pendingCount: pendingBills.length,
      finishedCount: finished, finished, progress,
      topSpender, topSpenderAmount, yourBalance, recentBills, currentUser,
    };
  }, [tripBills, tripMembers, userProfile]);

  const getIcon = (cat) => ({ Food:"🍜", Ticket:"🎫", Transport:"🚕", Merch:"🛍️" }[cat] || "🧾");

  return (
    <div className="ns-screen">

      {/* Header */}
      <div className="ns-home-header">
        <div>
          <div className="ns-kicker">NeoSplit</div>
          <div className="ns-display">Trip Dashboard</div>
        </div>
        <button className="ns-avatar-btn" onClick={() => setPage("profile")}>
          {userProfile?.profileImage
            ? <img src={userProfile.profileImage} alt="profile" className="ns-avatar-img" />
            : dashboard.currentUser.charAt(0).toUpperCase()
          }
        </button>
      </div>

      {/* Create Trip */}
      <button className="ns-btn ns-btn-primary ns-mb-12" onClick={() => setPage("create")}>
        + Create New Trip
      </button>

      {/* Trips list */}
      <div className="ns-section-label">Your Trips</div>
      {trips.length === 0 ? (
        <div className="ns-card" style={{ textAlign: "center", padding: 24, color: "var(--ns-muted)", marginBottom: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✈️</div>
          <div style={{ fontWeight: 700, color: "var(--ns-text)", marginBottom: 4 }}>No trips yet</div>
          <div style={{ fontSize: 13 }}>Create your first trip above</div>
        </div>
      ) : (
        trips.map((trip) => {
          const isActive = trip.id === currentTripId;
          return (
            <div
              key={trip.id}
              className="ns-card"
              style={{
                marginBottom: 10, cursor: "pointer",
                border: isActive ? "1px solid rgba(0,255,133,0.4)" : "1px solid var(--ns-border)",
                background: isActive ? "rgba(0,255,133,0.06)" : "var(--ns-card)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }} onClick={() => selectTrip(trip.id)}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: isActive ? "rgba(0,255,133,0.15)" : "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  ✈️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isActive ? "var(--ns-g)" : "var(--ns-text)", marginBottom: 2 }}>
                    {trip.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ns-muted)" }}>
                    {trip.members} members
                    {trip.location ? ` · ${trip.location}` : ""}
                    {trip.date ? ` · ${trip.date}` : ""}
                  </div>
                </div>
                {isActive && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "rgba(0,255,133,0.15)", color: "var(--ns-g)", border: "1px solid rgba(0,255,133,0.3)" }}>
                    Active
                  </span>
                )}
                {!isActive && (
                  <span style={{ color: "var(--ns-muted)", fontSize: 18 }}>›</span>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--ns-border)" }}>
                <button
                  className="ns-btn ns-btn-dark"
                  style={{ flex: 1, padding: "8px", fontSize: 12 }}
                  onClick={() => selectTrip(trip.id)}
                >
                  {isActive ? "View Bills" : "Open Trip"}
                </button>
                <button
                  className="ns-btn"
                  style={{
                    flex: 1, padding: "8px", fontSize: 12,
                    background: "rgba(255,59,92,0.08)",
                    color: "var(--ns-r)",
                    border: "1px solid rgba(255,59,92,0.2)",
                  }}
                  onClick={() => {
                    if (window.confirm(`Delete "${trip.title}"?`)) deleteTrip(trip.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Dashboard only shown if active trip */}
      {currentTripId && tripBills.length > 0 && (
        <>
          {/* Balance Hero */}
          <div className="ns-balance-card" style={{ marginTop: 8 }}>
            <div className="ns-balance-label">Your Balance</div>
            <div className={`ns-balance-amount ${dashboard.yourBalance >= 0 ? "pos" : "neg"}`}>
              {dashboard.yourBalance >= 0 ? "+" : ""}
              {dashboard.yourBalance.toFixed(2)} THB
            </div>
            <div className="ns-balance-sub">Based on active trip</div>
            <div className="ns-progress-track">
              <div className="ns-progress-fill" style={{ width: `${dashboard.progress}%` }} />
            </div>
            <div className="ns-small" style={{ marginTop: 5 }}>
              {dashboard.finished}/{tripBills.length} bills settled
            </div>
          </div>

          {/* Stats Grid */}
          <div className="ns-stats-grid">
            <div className="ns-stat-card">
              <div className="ns-stat-label">Total Spend</div>
              <div className="ns-stat-value">{dashboard.totalSpend.toLocaleString()}</div>
              <div className="ns-stat-sub">THB</div>
            </div>
            <div className="ns-stat-card">
              <div className="ns-stat-label">Pending</div>
              <div className="ns-stat-value" style={{ color: dashboard.pendingCount > 0 ? "var(--ns-y)" : undefined }}>
                {dashboard.pendingCount}
              </div>
              <div className="ns-stat-sub">bills</div>
            </div>
            <div className="ns-stat-card">
              <div className="ns-stat-label">Top Spender</div>
              <div className="ns-stat-value" style={{ fontSize: 13, marginTop: 2 }}>{dashboard.topSpender}</div>
              <div className="ns-stat-sub">{dashboard.topSpenderAmount.toLocaleString()} THB</div>
            </div>
            <div className="ns-stat-card">
              <div className="ns-stat-label">Settled</div>
              <div className="ns-stat-value" style={{ color: "var(--ns-g)" }}>{dashboard.finishedCount}</div>
              <div className="ns-stat-sub">bills</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ns-section-label">Quick Actions</div>
          <div className="ns-action-row">
            <button className="ns-action-btn" onClick={() => setPage("receipt")}>
              <span className="ns-action-icon">📋</span>Bills
            </button>
            <button className="ns-action-btn" onClick={() => setPage("settlement")}>
              <span className="ns-action-icon">⚖️</span>Settlement
            </button>
            <button className="ns-action-btn" onClick={() => setPage("rewardslist")}>
              <span className="ns-action-icon">🎁</span>Rewards
            </button>
          </div>

          {/* Recent Bills */}
          <div className="ns-section-label">Recent Bills</div>
          {dashboard.recentBills.map((bill) => (
            <div key={bill.id} className="ns-bill-row ns-clickable" onClick={() => setPage("receipt")}>
              <div className="ns-bill-row-left">
                <div className="ns-bill-icon">{getIcon(bill.category)}</div>
                <div>
                  <div className="ns-bill-name">{bill.name}</div>
                  <div className="ns-bill-meta">
                    Paid by {bill.paidBy} · {(bill.sharedBy?.length || bill.pax || 1)} people ·{" "}
                    {Number(bill.amount || 0).toLocaleString()} THB
                  </div>
                </div>
              </div>
              <span className={`ns-badge ${bill.status === "Finished" ? "ns-badge-green" : "ns-badge-yellow"}`}>
                {bill.status === "Finished" ? "Done" : "Pending"}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default Home;