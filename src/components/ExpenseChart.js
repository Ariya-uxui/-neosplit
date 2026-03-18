import React, { useState } from "react";
import "../App.css";

function AddExpense({ setPage, addExpense }) {
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [pax, setPax] = useState("");
  const [category, setCategory] = useState("Food");

  const totalPerPerson =
    Number(amount) > 0 && Number(pax) > 0
      ? (Number(amount) / Number(pax)).toFixed(2)
      : "0.00";

  const handleSave = () => {
    if (!expenseName || !amount || !paidBy || !pax) {
      alert("Please fill in all fields");
      return;
    }

    addExpense({
      name: expenseName,
      amount: Number(amount),
      paidBy,
      pax: Number(pax),
      category
    });

    setPage("tripdetail");
  };

  return (
    <div className="screen-dark">
      <div className="top-pill-green">Add Expense</div>

      <div className="bill-card">
        <label style={styles.label}>Expense Name</label>
        <input
          className="input-pill"
          placeholder="เช่น Lunch at Fuji"
          value={expenseName}
          onChange={(e) => setExpenseName(e.target.value)}
        />

        <label style={styles.label}>Category</label>
        <select
          className="input-pill"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>Food</option>
          <option>Hotel</option>
          <option>Transport</option>
          <option>Ticket</option>
          <option>Merch</option>
        </select>

        <label style={styles.label}>Amount</label>
        <input
          className="input-pill"
          type="number"
          placeholder="เช่น 1250"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <label style={styles.label}>Paid By</label>
        <input
          className="input-pill"
          placeholder="เช่น NongTaeyoung"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        />

        <label style={styles.label}>Pax</label>
        <input
          className="input-pill"
          type="number"
          placeholder="จำนวนคน"
          value={pax}
          onChange={(e) => setPax(e.target.value)}
        />

        <div className="white-panel mt-16 center">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Total per person</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{totalPerPerson} THB</div>
        </div>
      </div>

      <button className="btn-black mt-20" onClick={handleSave}>
        Save Expense
      </button>

      <button className="btn-gray mt-12" onClick={() => setPage("tripdetail")}>
        Cancel
      </button>
    </div>
  );
}

const styles = {
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 700,
    color: "#111"
  }
};

export default AddExpense;