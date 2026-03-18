import React, { useState } from "react";
import "../App.css";

function SplitBill({ setPage, tripBills = [] }) {
  const [mode, setMode] = useState("Equal");

  const totalAmount = tripBills.reduce(
    (sum, bill) => sum + (Number(bill.amount) || 0),
    0
  );

  const options = [
    {
      title: "Equal",
      text: "Everyone pays the same amount",
    },
    {
      title: "Custom",
      text: "Adjust each person's share manually",
    },
    {
      title: "By Items",
      text: "Split based on ordered items",
    },
  ];

  return (
    <div className="screen-yellow">
      <div className="page-title">Split Bill</div>

      <div className="summary-card">
        <div className="summary-title">Ready to split</div>
        <div className="summary-line">
          Total amount: {totalAmount.toLocaleString()} THB
        </div>
        <div className="summary-line">Expenses count: {tripBills.length}</div>
        <div className="summary-line">Current mode: {mode}</div>
      </div>

      {options.map((option) => (
        <button
          key={option.title}
          className={`split-option-card split-option-btn ${
            mode === option.title ? "split-option-active" : ""
          }`}
          onClick={() => setMode(option.title)}
        >
          <div className="split-option-title">{option.title} Split</div>
          <div className="split-option-text">{option.text}</div>
        </button>
      ))}

      <div className="detail-btn-group">
        <button
          className="history-btn"
          onClick={() => setPage("splitcalculator")}
        >
          Continue to Calculator
        </button>

        <button className="ghost-btn" onClick={() => setPage("settlement")}>
          Back to Settlement
        </button>
      </div>
    </div>
  );
}

export default SplitBill;