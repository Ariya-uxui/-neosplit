import React, { useMemo } from "react";
import "../App.css";

function Settlement({
  setPage,
  tripBills = [],
  tripMembers = [],
  settleAllBills,
  selectedBill = null,
}) {
  const billsForCalculation = useMemo(() => {
    const sourceBills =
      selectedBill && selectedBill.status !== "Finished"
        ? [selectedBill]
        : tripBills.filter((bill) => bill.status !== "Finished");

    return sourceBills.map((bill) => {
      const sharedBy =
        Array.isArray(bill.sharedBy) && bill.sharedBy.length > 0
          ? bill.sharedBy
          : [];

      const peopleCount = sharedBy.length || Number(bill.pax) || 1;

      return {
        ...bill,
        name: bill.name || bill.title || "Untitled Expense",
        amount: Number(bill.amount) || 0,
        paidBy: bill.paidBy || "",
        sharedBy,
        peopleCount,
        splitAmount:
          peopleCount > 0 ? (Number(bill.amount) || 0) / peopleCount : 0,
      };
    });
  }, [tripBills, selectedBill]);

  const result = useMemo(() => {
    const memberSet = new Set(tripMembers);

    billsForCalculation.forEach((bill) => {
      if (bill.paidBy) memberSet.add(bill.paidBy);
      bill.sharedBy.forEach((name) => memberSet.add(name));
    });

    const balances = {};

    Array.from(memberSet).forEach((member) => {
      balances[member] = 0;
    });

    billsForCalculation.forEach((bill) => {
      const amount = Number(bill.amount) || 0;
      const payer = bill.paidBy;
      const participants = bill.sharedBy || [];

      if (!payer || participants.length === 0) return;

      const share = amount / participants.length;

      balances[payer] += amount;

      participants.forEach((person) => {
        balances[person] -= share;
      });
    });

    const creditors = [];
    const debtors = [];

    Object.entries(balances).forEach(([name, balance]) => {
      const rounded = Number(balance.toFixed(2));

      if (rounded > 0.01) {
        creditors.push({ name, amount: rounded });
      } else if (rounded < -0.01) {
        debtors.push({ name, amount: Math.abs(rounded) });
      }
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transfers = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const transferAmount = Math.min(debtor.amount, creditor.amount);

      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: Number(transferAmount.toFixed(2)),
      });

      debtor.amount = Number((debtor.amount - transferAmount).toFixed(2));
      creditor.amount = Number((creditor.amount - transferAmount).toFixed(2));

      if (debtor.amount <= 0.01) i++;
      if (creditor.amount <= 0.01) j++;
    }

    const totalAmount = billsForCalculation.reduce(
      (sum, bill) => sum + (Number(bill.amount) || 0),
      0
    );

    return {
      balances,
      transfers,
      totalAmount,
    };
  }, [billsForCalculation, tripMembers]);

  const avatar = (name) => name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="screen-dark">
      <div className="page-title">Settlement</div>

      <div className="summary-card">
        <div className="summary-title">
          {selectedBill ? "Bill Settlement" : "Trip Settlement"}
        </div>

        <div className="summary-line">
          {billsForCalculation.length} pending bills included
        </div>

        <div className="summary-line">
          Total: {result.totalAmount.toLocaleString()} THB
        </div>
      </div>

      <div className="section-subtitle">Bill Breakdown</div>

      {billsForCalculation.length > 0 ? (
        billsForCalculation.map((bill, index) => (
          <div
            className="bill-card"
            key={bill.id || `${bill.name}-${index}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="summary-title">{bill.name}</div>
            <div className="summary-line">Paid by: {bill.paidBy}</div>
            <div className="summary-line">
              Total: {bill.amount.toLocaleString()} THB
            </div>
            <div className="summary-line">
              Shared by:{" "}
              {bill.sharedBy.length > 0
                ? bill.sharedBy.join(", ")
                : `${bill.peopleCount} people`}
            </div>
            <div className="summary-line">
              Each person pays: {bill.splitAmount.toFixed(2)} THB
            </div>
          </div>
        ))
      ) : (
        <div className="bill-card">No pending bills 🎉</div>
      )}

      <div className="section-subtitle">Balances</div>

      {Object.entries(result.balances).map(([name, balance], index) => (
        <div
          className="settlement-card"
          key={name}
          style={{ animationDelay: `${index * 0.06}s` }}
        >
          <div className="avatar">{avatar(name)}</div>

          <div className="settlement-info">
            <div className="settlement-name">{name}</div>
            <div
              className={`settlement-amount ${
                balance >= 0 ? "positive" : "negative"
              }`}
            >
              {balance >= 0 ? "+" : ""}
              {balance.toFixed(2)} THB
            </div>
          </div>
        </div>
      ))}

      <div className="section-subtitle">Smart Transfers</div>

      {result.transfers.length > 0 ? (
        result.transfers.map((item, index) => (
          <div
            className="transfer-card"
            key={`${item.from}-${item.to}-${index}`}
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div>
              <b>{item.from}</b> should pay <b>{item.to}</b>
            </div>

            <div className="transfer-amount">
              {item.amount.toFixed(2)} THB
            </div>
          </div>
        ))
      ) : (
        <div className="bill-card">Everyone is settled 🎉</div>
      )}

      <div className="detail-btn-group">
        <button
          className="secondary-btn"
          onClick={() => {
            settleAllBills();
            setPage("billhistory");
          }}
        >
          Settle All
        </button>

        <button className="ghost-btn" onClick={() => setPage("receipt")}>
          Back
        </button>
      </div>
    </div>
  );
}

export default Settlement;