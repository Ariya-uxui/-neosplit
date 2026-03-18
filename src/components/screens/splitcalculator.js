import React, { useMemo, useState, useEffect } from "react";
import "../App.css";

function SplitCalculator({ setPage, selectedBill }) {

  const [amount, setAmount] = useState(0);
  const [people, setPeople] = useState(1);

  useEffect(() => {
    if (selectedBill) {

      setAmount(selectedBill.amount || 0);

      const count =
        selectedBill.sharedBy?.length ||
        selectedBill.pax ||
        selectedBill.people ||
        1;

      setPeople(count);
    }
  }, [selectedBill]);

  const perPerson = useMemo(() => {

    const total = Number(amount) || 0;
    const count = Number(people) || 1;

    if (count <= 0) return 0;

    return total / count;

  }, [amount, people]);

  const title = selectedBill?.name || selectedBill?.title || "Custom Split";

  return (
    <div className="screen-yellow">

      <div className="page-title">Split Calculator</div>

      {selectedBill && (
        <div className="bill-card">
          <div className="summary-title">{title}</div>
          <div className="summary-line">
            Paid by {selectedBill.paidBy}
          </div>
        </div>
      )}

      <div className="summary-card">

        <div className="summary-title">Quick Split</div>

        <label className="input-label">Total Amount</label>
        <input
          className="calc-input"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <label className="input-label">Number of People</label>
        <input
          className="calc-input"
          type="number"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
        />

        <div className="calc-result">
          <span>Each person pays</span>
          <strong>{perPerson.toFixed(2)} THB</strong>
        </div>

      </div>

      <div className="detail-btn-group">

        <button
          className="history-btn"
          onClick={() => setPage("settlement")}
        >
          Go to Settlement
        </button>

        <button
          className="ghost-btn"
          onClick={() => setPage("splitbill")}
        >
          Back
        </button>

      </div>

    </div>
  );
}

export default SplitCalculator;