import React, { useState } from "react";
import "../App.css";

function AddExpense({ setPage, addExpense, tripMembers = [] }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(tripMembers[0] || "");
  const [category, setCategory] = useState("Food");
  const [sharedBy, setSharedBy] = useState(tripMembers);

  const toggleMember = (member) => {
    setSharedBy((prev) =>
      prev.includes(member)
        ? prev.filter((item) => item !== member)
        : [...prev, member]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !amount || sharedBy.length === 0) return;

    addExpense({
      name,
      amount: Number(amount),
      paidBy,
      pax: sharedBy.length,
      category,
      sharedBy,
      status: "Pending",
      date: new Date().toLocaleDateString("en-GB"),
    });

    setPage("receipt");
  };

  return (
    <div className="screen-yellow">
      <div className="page-title">Add Bill</div>

      <form className="summary-card" onSubmit={handleSubmit}>
        <label className="input-label">Expense Name</label>
        <input
          className="calc-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Dinner, Taxi, Tickets"
        />

        <label className="input-label">Amount</label>
        <input
          className="calc-input"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter total amount"
        />

        <label className="input-label">Paid By</label>
        <select
          className="calc-input"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        >
          {tripMembers.map((member) => (
            <option key={member} value={member}>
              {member}
            </option>
          ))}
        </select>

        <label className="input-label">Category</label>
        <select
          className="calc-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="Food">Food</option>
          <option value="Ticket">Ticket</option>
          <option value="Travel">Travel</option>
          <option value="Merch">Merch</option>
          <option value="Other">Other</option>
        </select>

        <label className="input-label">Shared By</label>
        <div className="member-check-list">
          {tripMembers.map((member) => (
            <button
              type="button"
              key={member}
              className={`member-chip ${
                sharedBy.includes(member) ? "member-chip-active" : ""
              }`}
              onClick={() => toggleMember(member)}
            >
              {sharedBy.includes(member) ? "✓ " : ""}
              {member}
            </button>
          ))}
        </div>

        <div className="summary-line">
          Split with <strong>{sharedBy.length}</strong> people
        </div>

        <div className="detail-btn-group" style={{ marginTop: 16 }}>
          <button type="submit" className="history-btn">
            Save Bill
          </button>

          <button
            type="button"
            className="ghost-btn"
            onClick={() => setPage("receipt")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddExpense;