import React from "react";
import "../App.css";

function BillDetail({ setPage, selectedBill, markBillAsSettled }) {
  if (!selectedBill) {
    return (
      <div className="screen-yellow">
        <div className="page-title">Bill Detail</div>
        <div className="bill-card">No bill selected</div>

        <button className="ghost-btn" onClick={() => setPage("receipt")}>
          Back to Bills
        </button>
      </div>
    );
  }

  const getIcon = (category) => {
    if (category === "Food") return "🍜";
    if (category === "Ticket") return "🎫";
    if (category === "Transport" || category === "Travel") return "🚕";
    if (category === "Merch") return "🛍️";
    return "🧾";
  };

  const isFinished = selectedBill.status === "Finished";

  return (
    <div className="screen-yellow">
      <div className="page-title">Bill Detail</div>

      <div className="bill-card detail-card">
        <div className="detail-title">
          {getIcon(selectedBill.category)} {selectedBill.title}
        </div>

        <div className="detail-row">Paid by {selectedBill.paidBy}</div>
        <div className="detail-row">
          {selectedBill.people} people • {Number(selectedBill.amount).toLocaleString()} THB
        </div>
        <div className="detail-row">Category: {selectedBill.category}</div>
        <div className="detail-row">Date: {selectedBill.date}</div>
        <div className="detail-row">
          Status: {isFinished ? "✅ Finished" : "⏳ Pending"}
        </div>
      </div>

      <div className="detail-btn-group">
        {!isFinished && (
          <button
            className="history-btn"
            onClick={() => {
              markBillAsSettled(selectedBill.id);
              setPage("settlement");
            }}
          >
            Mark as Settled
          </button>
        )}

        <button className="secondary-btn" onClick={() => setPage("settlement")}>
          Go to Settlement
        </button>

        <button className="ghost-btn" onClick={() => setPage("receipt")}>
          Back to Bills
        </button>
      </div>
    </div>
  );
}

export default BillDetail;

