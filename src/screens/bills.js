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
  const peopleCount = sharedBy.length || Number(bill.pax) || 1;

  return {
    ...bill,
    title: bill.title || bill.name || "Untitled Expense",
    name: bill.name || bill.title || "Untitled Expense",
    sharedBy,
    people: peopleCount,
    pax: peopleCount,
    amount: Number(bill.amount) || 0,
    date: bill.date || "Recently added",
    status: bill.status || "Pending",
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

      {tripBills.map((bill, index) => (
        <div
          key={bill.id}
          className="bill-card clickable-card expense-card-animated"
          style={{ animationDelay: `${index * 0.06}s` }}
          onClick={() => {
            setSelectedBill({
              ...bill,
              title: bill.title || bill.name,
              people: bill.people || bill.pax || bill.sharedBy?.length || 1,
            });
            setPage("billdetail");
          }}
        >
          <div>
            {getIcon(bill.category)} {bill.name}
          </div>
          <div>Paid by {bill.paidBy}</div>
          <div>
            {(bill.sharedBy?.length || bill.pax || 1)} people •{" "}
            {Number(bill.amount).toLocaleString()} THB
          </div>
          <div>{bill.date || "Recently added"}</div>
          <div>{bill.status === "Finished" ? "✅ Finished" : "⏳ Pending"}</div>
        </div>
      ))}
    </div>
  );
}

export default Bills;