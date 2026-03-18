import React from "react";
import "../App.css";
import ExpenseChart from "../components/ExpenseChart";

function TripDetail({ setPage, tripBills, deleteExpense, startEditExpense }) {
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
    <div className="screen-green">
      <div className="top-pill-green">Bills Details</div>

      <div className="glass-summary-card">
        <div className="trip-summary-header">
          <div>
            <div className="trip-summary-label">Trip</div>
            <div className="trip-summary-title">NCT127 in KR</div>
          </div>

          <div className="trip-total-badge">{total} THB</div>
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
          tripBills.map((bill) => (
            <div key={bill.id} className="trip-bill-row">
              <div className="trip-bill-left">
                <div className="trip-bill-icon">
                  {getCategoryIcon(bill.category)}
                </div>

                <div>
                  <div className="trip-bill-name">{bill.name}</div>
                  <div className="category-badge">{bill.category}</div>
                  <div className="trip-bill-meta">
                    Paid by {bill.paidBy} •{" "}
                    {bill.sharedBy?.length || bill.pax || 1} pax
                  </div>
                </div>
              </div>

              <div className="trip-bill-right">
                <div className="trip-bill-amount">{bill.amount} THB</div>

                <div className="trip-bill-actions">
                  <button
                    type="button"
                    onClick={() => startEditExpense(bill)}
                    className="small-btn"
                  >
                    edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteExpense(bill.id)}
                    className="small-btn-dark"
                  >
                    delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        <div className="trip-total-footer">
          <div>Total Trip Expense</div>
          <div>{total} THB</div>
        </div>
      </div>

      <ExpenseChart tripBills={tripBills} />

      <button
        type="button"
        className="btn-gray mt-16"
        onClick={() => setPage("addexpense")}
      >
        + Add Expense
      </button>

      <button
        type="button"
        className="btn-black mt-12"
        onClick={() => setPage("settlement")}
      >
        Settlement
      </button>
    </div>
  );
}

export default TripDetail;