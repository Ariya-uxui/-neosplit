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

  const title = selectedBill.name || selectedBill.title || "Untitled Expense";
  const people =
    selectedBill.sharedBy?.length ||
    selectedBill.pax ||
    selectedBill.people ||
    1;

  const perPerson =
    people > 0 ? (Number(selectedBill.amount || 0) / people).toFixed(2) : "0.00";

  const isFinished = selectedBill.status === "Finished";

  return (
    <div className="screen-yellow">
      <div className="page-title">Bill Detail</div>

      <div className="bill-card detail-card">
        <div className="detail-title">
          {getIcon(selectedBill.category)} {title}
        </div>

        <div className="detail-row">Paid by {selectedBill.paidBy}</div>
        <div className="detail-row">
          {people} people • {Number(selectedBill.amount || 0).toLocaleString()} THB
        </div>
        <div className="detail-row">Each person: {perPerson} THB</div>
        <div className="detail-row">Category: {selectedBill.category}</div>
        <div className="detail-row">
          Date: {selectedBill.date || "Recently added"}
        </div>

        {selectedBill.sharedBy && selectedBill.sharedBy.length > 0 && (
          <div className="detail-row">
            Shared by: {selectedBill.sharedBy.join(", ")}
          </div>
        )}

        <div className="detail-row">
          Status: {isFinished ? "✅ Finished" : "⏳ Pending"}
        </div>
      </div>

      <div className="detail-row">
  Each person: {(Number(selectedBill.amount || 0) / people).toFixed(2)} THB
</div>

      <div className="detail-btn-group">
        <button className="secondary-btn" onClick={() => setPage("settlement")}>
          Go to Settlement
        </button>

        {!isFinished && (
          <button
            className="history-btn"
            onClick={() => {
              markBillAsSettled(selectedBill.id);
              setPage("billhistory");
            }}
          >
            Mark as Settled
          </button>
        )}

        <button className="ghost-btn" onClick={() => setPage("receipt")}>
          Back to Bills
        </button>
      </div>
    </div>
  );
}

export default BillDetail;