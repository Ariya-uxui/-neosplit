import React from "react";
import "../App.css";

function Bills({ setPage, tripBills = [], setSelectedBill }) {
  const getIcon = (category) => {
    if (category === "Food") return "🍜";
    if (category === "Ticket") return "🎫";
    if (category === "Transport" || category === "Travel") return "🚕";
    if (category === "Merch") return "🛍️";
    return "🧾";
  };

  const normalizeBill = (bill) => {
    const sharedBy = Array.isArray(bill.sharedBy) ? bill.sharedBy : [];
    const peopleCount =
      sharedBy.length || Number(bill.pax) || Number(bill.people) || 1;

    return {
      ...bill,
      title: bill.title || bill.name || "Untitled Expense",
      name: bill.name || bill.title || "Untitled Expense",
      people: peopleCount,
      pax: peopleCount,
      sharedBy,
      amount: Number(bill.amount) || 0,
      paidBy: bill.paidBy || "",
      category: bill.category || "Other",
      status: bill.status || "Pending",
      date: bill.date || "Recently added",
    };
  };

  return (
    <div className="screen-yellow">
      <div className="page-title">Bills</div>

      <button
        className="search-pill history-btn"
        onClick={() => setPage("billhistory")}
      >
        View Bills History
      </button>

      <button className="history-btn" onClick={() => setPage("addexpense")}>
        + Add Bill
      </button>

      <button className="secondary-btn" onClick={() => setPage("settlement")}>
        Go to Settlement
      </button>

      {tripBills.length === 0 ? (
        <div className="bill-card">No bills yet</div>
      ) : (
        tripBills.map((rawBill, index) => {
          const bill = normalizeBill(rawBill);
          const splitPerPerson =
            bill.sharedBy.length > 0
              ? bill.amount / bill.sharedBy.length
              : bill.amount / bill.people;

          return (
            <div
              key={bill.id || `${bill.name}-${index}`}
              className="bill-card clickable-card expense-card-animated"
              style={{ animationDelay: `${index * 0.06}s` }}
              onClick={() => {
                setSelectedBill(bill);
                setPage("billdetail");
              }}
            >
              <div>
                {getIcon(bill.category)} {bill.name}
              </div>

              <div>Paid by {bill.paidBy}</div>

              <div>
                {(bill.sharedBy.length || bill.pax || 1)} people •{" "}
                {Number(bill.amount).toLocaleString()} THB
              </div>

              <div>Each person: {splitPerPerson.toFixed(2)} THB</div>

              <div>{bill.date}</div>

              <div>
                {bill.status === "Finished" ? "✅ Finished" : "⏳ Pending"}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default Bills;