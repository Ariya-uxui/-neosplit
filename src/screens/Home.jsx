import React, { useMemo } from "react";
import "../App.css";
 
function Home({ setPage, tripBills = [], tripMembers = [], userProfile, trips = [] }) {
 
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
 
      {/* ── Header ── */}
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
 
      {/* ── Create Trip ── */}
      <button className="ns-btn ns-btn-ghost ns-mb-12" onClick={() => setPage("create")}>
        + Create New Trip
      </button>
 
      {/* ── Balance Hero ── */}
      <div className="ns-balance-card">
        <div className="ns-balance-label">Your Balance</div>
        <div className={`ns-balance-amount ${dashboard.yourBalance >= 0 ? "pos" : "neg"}`}>
          {dashboard.yourBalance >= 0 ? "+" : ""}
          {dashboard.yourBalance.toFixed(2)} THB
        </div>
        <div className="ns-balance-sub">Based on all trip expenses</div>
        <div className="ns-progress-track">
          <div className="ns-progress-fill" style={{ width: `${dashboard.progress}%` }} />
        </div>
        <div className="ns-small" style={{ marginTop: 5 }}>
          {dashboard.finished}/{tripBills.length} bills settled
        </div>
      </div>
 
      {/* ── Stats Grid ── */}
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
 
      {/* ── Quick Actions ── */}
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
 
      {/* ── Trips ── */}
      <div className="ns-section-label">Your Trips</div>
      {trips.map((trip) => (
        <div key={trip.id} className="ns-trip-card" onClick={() => setPage("tripdetail")}>
          <div>
            <div className="ns-trip-title">{trip.title}</div>
            <div className="ns-trip-meta">{trip.members} members</div>
          </div>
          <span className="ns-trip-arrow">›</span>
        </div>
      ))}
 
      {/* ── Recent Bills ── */}
      <div className="ns-section-label">Recent Bills</div>
      {dashboard.recentBills.length === 0 ? (
        <div className="ns-card" style={{ textAlign: "center", color: "var(--ns-muted)" }}>
          No expenses yet. Add your first bill.
        </div>
      ) : (
        dashboard.recentBills.map((bill) => (
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
        ))
      )}
 
    </div>
  );
}
 
export default Home;