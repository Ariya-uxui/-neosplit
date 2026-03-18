import React, { useMemo } from "react";
import "../App.css";

function Home({
  setPage,
  tripBills = [],
  tripMembers = [],
  userProfile,
  trips = [],
}) {
  const dashboard = useMemo(() => {
    const totalSpend = tripBills.reduce(
      (sum, bill) => sum + (Number(bill.amount) || 0),
      0
    );

    const pendingBills = tripBills.filter(
      (bill) => bill.status !== "Finished"
    );

    const finishedBills = tripBills.filter(
      (bill) => bill.status === "Finished"
    );

    const finished = finishedBills.length;

    const progress = tripBills.length
      ? Math.round((finished / tripBills.length) * 100)
      : 0;

    const paidMap = {};

    tripBills.forEach((bill) => {
      const payer = bill.paidBy || "Unknown";
      paidMap[payer] = (paidMap[payer] || 0) + (Number(bill.amount) || 0);
    });

    const topSpenderEntry =
      Object.entries(paidMap).sort((a, b) => b[1] - a[1])[0] || [];

    const topSpender = topSpenderEntry[0] || "No data";
    const topSpenderAmount = topSpenderEntry[1] || 0;

    const currentUser = userProfile?.name || tripMembers[0] || "You";
    const yourPaid = paidMap[currentUser] || 0;

    let yourShare = 0;

    tripBills.forEach((bill) => {
      const participants = bill.sharedBy || [];

if (participants.includes(currentUser) && participants.length > 0) {
  yourShare += (Number(bill.amount) || 0) / participants.length;
}

      if (participants.includes(currentUser) && participants.length > 0) {
        yourShare += (Number(bill.amount) || 0) / participants.length;
      }
    });

    const yourBalance = yourPaid - yourShare;

    const recentBills = [...tripBills]
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 3);

    return {
      totalSpend,
      pendingCount: pendingBills.length,
      finishedCount: finishedBills.length,
      finished,
      progress,
      topSpender,
      topSpenderAmount,
      yourBalance,
      recentBills,
      currentUser,
    };
  }, [tripBills, tripMembers, userProfile]);

  const getIcon = (category) => {
    if (category === "Food") return "🍜";
    if (category === "Ticket") return "🎫";
    if (category === "Transport") return "🚕";
    if (category === "Merch") return "🛍️";
    return "🧾";
  };

  return (
    <div className="screen-dark dashboard-screen">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-kicker">NeoSplit</div>
          <div className="dashboard-title">Trip Dashboard</div>
        </div>

        <button
          className="dashboard-profile-btn"
          onClick={() => setPage("profile")}
        >
          {userProfile?.profileImage ? (
            <img
              src={userProfile.profileImage}
              alt="profile"
              className="dashboard-profile-img"
            />
          ) : (
            dashboard.currentUser.charAt(0).toUpperCase()
          )}
        </button>
      </div>

      <button className="create-trip-btn" onClick={() => setPage("create")}>
        + Create Trip
      </button>

      <div className="dashboard-balance-card">
        <div className="dashboard-balance-label">Your Balance</div>

        <div
          className={`dashboard-balance-amount ${
            dashboard.yourBalance >= 0 ? "positive" : "negative"
          }`}
        >
          {dashboard.yourBalance >= 0 ? "+" : ""}
          {dashboard.yourBalance.toFixed(2)} THB
        </div>

        <div className="dashboard-balance-sub">
          Based on all trip expenses
        </div>
      </div>

      <div className="trip-progress-card">
        <div className="trip-progress-title">Trip Progress</div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${dashboard.progress}%` }}
          />
        </div>

        <div className="progress-label">
          {dashboard.finished}/{tripBills.length} bills settled
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-label">Total Spend</div>
          <div className="dashboard-stat-value">
            {dashboard.totalSpend.toLocaleString()} THB
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-label">Pending Bills</div>
          <div className="dashboard-stat-value">{dashboard.pendingCount}</div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-label">Finished Bills</div>
          <div className="dashboard-stat-value">{dashboard.finishedCount}</div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-label">Top Spender</div>

          <div className="dashboard-stat-value dashboard-small-value">
            {dashboard.topSpender}
          </div>

          <div className="dashboard-mini-text">
            {dashboard.topSpenderAmount.toLocaleString()} THB
          </div>
        </div>
      </div>

      <div className="dashboard-section-title">Quick Actions</div>

      <div className="dashboard-action-row">
        <button
          className="dashboard-action-btn"
          onClick={() => setPage("receipt")}
        >
          Bills
        </button>

        <button
          className="dashboard-action-btn"
          onClick={() => setPage("settlement")}
        >
          Settlement
        </button>

        <button
          className="dashboard-action-btn"
          onClick={() => setPage("rewardslist")}
        >
          Rewards
        </button>
      </div>

      <div className="dashboard-section-title">Your Trips</div>

      {trips.map((trip) => (
        <div
          key={trip.id}
          className="trip-card"
          onClick={() => setPage("tripdetail")}
        >
          <div className="trip-title">{trip.title}</div>
          <div className="trip-meta">{trip.members} members</div>
        </div>
      ))}

      <div className="dashboard-section-title">Recent Bills</div>

      {dashboard.recentBills.length > 0 ? (
        dashboard.recentBills.map((bill) => (
          <div
            key={bill.id}
            className="dashboard-bill-card clickable-card"
            onClick={() => setPage("receipt")}
          >
            <div className="dashboard-bill-top">
              <div className="dashboard-bill-title">
                {getIcon(bill.category)} {bill.name}
              </div>

              <div
                className={`mini-status ${
                  bill.status === "Finished"
                    ? "mini-status-finished"
                    : "mini-status-pending"
                }`}
              >
                {bill.status || "Pending"}
              </div>
            </div>

            <div className="dashboard-bill-meta">Paid by {bill.paidBy}</div>

            <div className="dashboard-bill-meta">
              {(bill.sharedBy?.length || bill.pax || 1)} people •{" "}
              {Number(bill.amount || 0).toLocaleString()} THB
            </div>
          </div>
        ))
      ) : (
        <div className="dashboard-empty-card">
          No expenses yet. Add your first bill.
        </div>
      )}
    </div>
  );
}

export default Home;