import React, { useEffect, useState } from "react";
import "../App.css";

function EditExpense({
  setPage,
  editingExpense,
  updateExpense,
  tripMembers = [],
}) {
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [pax, setPax] = useState("");
  const [category, setCategory] = useState("Food");
  const [errors, setErrors] = useState({});
  const [sharedBy, setSharedBy] = useState([]);

  useEffect(() => {
    if (editingExpense) {
      const initialSharedBy =
        editingExpense.sharedBy && editingExpense.sharedBy.length > 0
          ? editingExpense.sharedBy
          : tripMembers.slice(0, editingExpense.pax || tripMembers.length);

      setExpenseName(editingExpense.name || "");
      setAmount(editingExpense.amount || "");
      setPaidBy(editingExpense.paidBy || "");
      setPax(initialSharedBy.length || editingExpense.pax || "");
      setCategory(editingExpense.category || "Food");
      setSharedBy(initialSharedBy);
    }
  }, [editingExpense, tripMembers]);

  const toggleMember = (member) => {
    setSharedBy((prev) => {
      const updated = prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member];

      setPax(updated.length);
      return updated;
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!expenseName.trim()) {
      newErrors.expenseName = "Please enter expense name";
    }

    if (!amount || Number(amount) <= 0) {
      newErrors.amount = "Amount must be more than 0";
    }

    if (!paidBy.trim()) {
      newErrors.paidBy = "Please enter payer name";
    }

    if (!sharedBy.length) {
      newErrors.sharedBy = "Please select at least 1 participant";
    }

    if (!pax || Number(pax) <= 0) {
      newErrors.pax = "Pax must be more than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const totalPerPerson =
    Number(amount) > 0 && Number(pax) > 0
      ? (Number(amount) / Number(pax)).toFixed(2)
      : "0.00";

  const handleSave = () => {
    if (!editingExpense) return;
    if (!validate()) return;

    updateExpense({
      ...editingExpense,
      name: expenseName,
      amount: Number(amount),
      paidBy,
      pax: sharedBy.length,
      category,
      sharedBy,
    });
  };

  return (
    <div className="screen-dark">
      <div className="top-pill-green">Edit Expense</div>

      <div className="bill-card">
        <label className="field-label">Expense Name</label>
        <input
          className="input-pill"
          value={expenseName}
          onChange={(e) => setExpenseName(e.target.value)}
        />
        {errors.expenseName && (
          <p className="error-text">{errors.expenseName}</p>
        )}

        <label className="field-label">Category</label>
        <select
          className="input-pill"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>Food</option>
          <option>Hotel</option>
          <option>Transport</option>
          <option>Travel</option>
          <option>Ticket</option>
          <option>Merch</option>
          <option>Other</option>
        </select>

        <label className="field-label">Amount</label>
        <input
          className="input-pill"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {errors.amount && <p className="error-text">{errors.amount}</p>}

        <label className="field-label">Paid By</label>
        <select
          className="input-pill"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        >
          <option value="">Select payer</option>
          {tripMembers.map((member) => (
            <option key={member} value={member}>
              {member}
            </option>
          ))}
        </select>
        {errors.paidBy && <p className="error-text">{errors.paidBy}</p>}

        <label className="field-label">Shared By</label>
        <div className="member-check-list">
          {tripMembers.map((member) => (
            <button
              key={member}
              type="button"
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
        {errors.sharedBy && <p className="error-text">{errors.sharedBy}</p>}

        <label className="field-label">Pax</label>
        <input className="input-pill" type="number" value={pax} readOnly />
        {errors.pax && <p className="error-text">{errors.pax}</p>}

        <div className="white-panel mt-16 center">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Total per person
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {totalPerPerson} THB
          </div>
        </div>
      </div>

      <button className="btn-black mt-20" onClick={handleSave}>
        Update Expense
      </button>

      <button className="btn-gray mt-12" onClick={() => setPage("tripdetail")}>
        Cancel
      </button>
    </div>
  );
}

export default EditExpense;