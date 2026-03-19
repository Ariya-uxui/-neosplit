import React from "react";
import "../App.css";
import ExpenseChart from "../components/ExpenseChart";

function TripDetail({ setPage, tripBills = [], deleteExpense, startEditExpense }) {
  const total = tripBills.reduce(
    (sum, bill) => sum + (Number(bill.amount) || 0),
    0
  );

  const getCategoryIcon = (category) => {
    if (category === "Food") return "🍜";
    if (category === "Hotel") return "🏨";
    if (category === "Transport") return "🚕";
    if (category === "Ticket") return "🎫";
    if (category === "Merch") return "🛍️";
    return "💸";
  };

  return (
    <div className="screen-green tripdetail-screen">
      <div className="top-pill-green">Bills Details</div>

      <div className="glass-summary-card">
        <div className="trip-summary-header">
          <div>
            <div className="trip-summary-label">Trip</div>
            <div className="trip-summary-title">NCT127 in KR</div>
          </div>

          <div className="trip-total-badge">
            {Number(total || 0).toLocaleString()} THB
          </div>
        </div>

        {tripBills.length === 0 ? (
          <div className="white-panel center mt-16">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              No expenses yet
            </div>
            <div style={{ fontSize: 14 }}>
              Add your first expense to get started
            </div>
          </div>
        ) : (
          tripBills.map((bill, index) => {
            const people = bill.sharedBy?.length || bill.pax || 1;
            const eachPerson =
              people > 0 ? (Number(bill.amount || 0) / people).toFixed(2) : "0.00";

            return (
              <div
                key={bill.id || `${bill.name}-${index}`}
                className="trip-bill-row"
              >
                <div className="trip-bill-left">
                  <div className="trip-bill-icon">
                    {getCategoryIcon(bill.category)}
                  </div>

                  <div className="trip-bill-content">
                    <div className="trip-bill-name">{bill.name}</div>
                    <div className="category-badge">{bill.category}</div>

                    <div className="trip-bill-meta">
                      Paid by {bill.paidBy} • {people} pax
                    </div>

                    <div className="trip-bill-share">
                      Each person: {eachPerson} THB
                    </div>
                  </div>
                </div>

                <div className="trip-bill-right">
                  <div className="trip-bill-amount">
                    {Number(bill.amount || 0).toLocaleString()} THB
                  </div>

                  <div className="trip-bill-actions">
                    <button
                      type="button"
                      onClick={() => startEditExpense(bill)}
                      className="small-btn"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteExpense(bill.id)}
                      className="small-btn-dark"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="trip-total-footer">
          <div>Total Trip Expense</div>
          <div>{Number(total || 0).toLocaleString()} THB</div>
        </div>
      </div>

      <div className="tripdetail-chart-wrap">
        <ExpenseChart tripBills={tripBills} />
      </div>

      <button
        type="button"
        className="tripdetail-secondary-btn mt-16"
        onClick={() => setPage("addexpense")}
      >
        + Add Expense
      </button>

      <button
        type="button"
        className="tripdetail-primary-btn mt-12"
        onClick={() => setPage("settlement")}
      >
        Settlement
      </button>
    </div>
  );
}

export default TripDetail;