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
    return count > 0 ? total / count : 0;
  }, [amount, people]);
 
  const title = selectedBill?.name || selectedBill?.title || "Custom Split";
 
  return (
    <div className="ns-screen">
 
      {/* ── Header ── */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("splitbill")}>‹</button>
        <span className="ns-title">Split Calculator</span>
        <div style={{ width: 36 }} />
      </div>
 
      {/* ── Selected bill info ── */}
      {selectedBill && (
        <div className="ns-card" style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ns-muted)", marginBottom: 4 }}>
              Selected Bill
            </div>
            <div style={{ fontFamily: "var(--ns-syne)", fontSize: 16, fontWeight: 700, color: "var(--ns-text)" }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: 2 }}>
              Paid by {selectedBill.paidBy}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800, color: "var(--ns-y)" }}>
              {Number(selectedBill.amount || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: "var(--ns-muted)" }}>THB</div>
          </div>
        </div>
      )}
 
      {/* ── Inputs ── */}
      <div className="ns-card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontFamily: "var(--ns-syne)", fontWeight: 700, color: "var(--ns-text)", marginBottom: 16 }}>
          Quick Split
        </div>
 
        <div className="ns-input-group">
          <label className="ns-input-label">Total Amount (THB)</label>
          <input
            className="ns-input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
 
        <div className="ns-input-group" style={{ marginBottom: 0 }}>
          <label className="ns-input-label">Number of People</label>
          {/* ── Stepper ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => setPeople(p => Math.max(1, Number(p) - 1))}
              style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: "var(--ns-card2)", border: "1px solid var(--ns-border)",
                color: "var(--ns-text)", fontSize: 20, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >−</button>
            <input
              className="ns-input"
              type="number"
              value={people}
              min={1}
              onChange={(e) => setPeople(e.target.value)}
              style={{ textAlign: "center", fontFamily: "var(--ns-syne)", fontWeight: 800, fontSize: 20 }}
            />
            <button
              type="button"
              onClick={() => setPeople(p => Number(p) + 1)}
              style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: "var(--ns-card2)", border: "1px solid var(--ns-border)",
                color: "var(--ns-g)", fontSize: 20, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >+</button>
          </div>
        </div>
      </div>
 
      {/* ── Result hero ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(0,255,133,0.1), rgba(0,255,133,0.03))",
        border: "1px solid rgba(0,255,133,0.25)",
        borderRadius: 24, padding: "28px 22px",
        textAlign: "center", marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(0,255,133,0.7)", marginBottom: 8 }}>
          Each Person Pays
        </div>
        <div style={{ fontFamily: "var(--ns-syne)", fontSize: 52, fontWeight: 800, letterSpacing: "-2px", color: "var(--ns-g)", lineHeight: 1 }}>
          {perPerson.toFixed(2)}
        </div>
        <div style={{ fontSize: 16, color: "var(--ns-muted)", marginTop: 6 }}>THB</div>
 
        {/* breakdown */}
        {amount > 0 && people > 1 && (
          <div style={{
            marginTop: 16, paddingTop: 14,
            borderTop: "1px solid rgba(0,255,133,0.15)",
            display: "flex", justifyContent: "center", gap: 24,
            fontSize: 12, color: "var(--ns-muted)",
          }}>
            <span>{Number(amount).toLocaleString()} THB total</span>
            <span style={{ color: "var(--ns-border2)" }}>÷</span>
            <span>{people} people</span>
          </div>
        )}
      </div>
 
      {/* ── Actions ── */}
      <button className="ns-btn ns-btn-primary" onClick={() => setPage("settlement")}>
        Go to Settlement →
      </button>
      <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setPage("splitbill")}>
        ← Back
      </button>
 
    </div>
  );
}
 
export default SplitCalculator;