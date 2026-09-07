import React, { useState } from "react";
import "../App.css";
 
function SplitBill({ setPage, tripBills = [], tripMembers = [], setSelectedBill }) {
  const [mode, setMode] = useState("Equal");
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});
 
  const pendingBills = tripBills.filter((b) => b.status !== "Finished");
  const totalAmount = tripBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
 
  const toggleBill = (id) => {
    setSelectedBillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
 
  const selectedBills = pendingBills.filter((b) => selectedBillIds.includes(b.id));
  const selectedTotal = selectedBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const equalPerPerson = tripMembers.length > 0 ? totalAmount / tripMembers.length : totalAmount;

  const selectedMembers = Array.from(
    new Set(selectedBills.flatMap((b) => (b.sharedBy?.length ? b.sharedBy : tripMembers)))
  );

  const handleContinue = () => {
    if (mode === "Select Bills") {
      setSelectedBill({
        id: `split-${Date.now()}`,
        name: `${selectedBills.length} Selected Bills`,
        amount: selectedTotal,
        sharedBy: selectedMembers,
        pax: selectedMembers.length,
      });
    }
    setPage("splitcalculator");
  };
 
  const getCategoryIcon = (cat) =>
    ({ Food: "🍜", Ticket: "🎫", Transport: "🚕", Merch: "🛍️", Hotel: "🏨" }[cat] || "💸");
 
  const options = [
    { title: "Equal", icon: "⚖️", text: "Everyone pays the same amount" },
    { title: "Custom", icon: "✏️", text: "Adjust each person's share manually" },
    { title: "Select Bills", icon: "🧾", text: "Split only the bills you pick" },
  ];
 
  return (
    <div className="ns-screen">
      {/* ── Header ── */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("settlement")}>‹</button>
        <span className="ns-title">Split Bill</span>
        <div style={{ width: 36 }} />
      </div>
 
      {/* ── Summary ── */}
      <div className="ns-card" style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--ns-g) 10%, transparent), color-mix(in srgb, var(--ns-g) 3%, transparent))",
        border: "1px solid color-mix(in srgb, var(--ns-g) 20%, transparent)", marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "color-mix(in srgb, var(--ns-g) 70%, transparent)", marginBottom: 6 }}>
          Total to Split
        </div>
        <div style={{ fontFamily: "var(--ns-syne)", fontSize: 34, fontWeight: 800, color: "var(--ns-g)", letterSpacing: "-1px" }}>
          {mode === "Select Bills" ? selectedTotal.toLocaleString() : totalAmount.toLocaleString()}
          <span style={{ fontSize: 16, color: "var(--ns-muted)", marginLeft: 6 }}>THB</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: 4 }}>
          {tripBills.length} bills · {mode} mode
        </div>
      </div>
 
      {/* ── Mode selector ── */}
      <div className="ns-section-label">Split Mode</div>
      {options.map((option) => (
        <button
          key={option.title}
          onClick={() => setMode(option.title)}
          style={{
            width: "100%", textAlign: "left", marginBottom: 10,
            padding: "14px 16px", borderRadius: 16, cursor: "pointer",
            background: mode === option.title ? "color-mix(in srgb, var(--ns-g) 8%, transparent)" : "var(--ns-card)",
            border: `1px solid ${mode === option.title ? "color-mix(in srgb, var(--ns-g) 30%, transparent)" : "var(--ns-border)"}`,
            display: "flex", alignItems: "center", gap: 12,
            transition: "all 0.18s",
          }}
        >
          <span style={{ fontSize: 22 }}>{option.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--ns-syne)", fontSize: 14, fontWeight: 700, color: mode === option.title ? "var(--ns-g)" : "var(--ns-text)", marginBottom: 2 }}>
              {option.title} Split
            </div>
            <div style={{ fontSize: 12, color: "var(--ns-muted)" }}>{option.text}</div>
          </div>
          {mode === option.title && (
            <span style={{ color: "var(--ns-g)", fontWeight: 800, fontSize: 16 }}>✓</span>
          )}
        </button>
      ))}
 
      {/* ── Select Bills: เลือกบิล ── */}
      {mode === "Select Bills" && (
        <>
          <div className="ns-section-label">Select Bills to Include</div>
          {pendingBills.length === 0 ? (
            <div className="ns-card" style={{ textAlign: "center", padding: 24, color: "var(--ns-muted)" }}>
              No pending bills
            </div>
          ) : (
            pendingBills.map((bill) => {
              const isSelected = selectedBillIds.includes(bill.id);
              const people = bill.sharedBy?.length || bill.pax || 1;
              return (
                <div
                  key={bill.id}
                  onClick={() => toggleBill(bill.id)}
                  className="ns-card ns-clickable"
                  style={{
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 10,
                    border: `1px solid ${isSelected ? "color-mix(in srgb, var(--ns-g) 30%, transparent)" : "var(--ns-border)"}`,
                    background: isSelected ? "color-mix(in srgb, var(--ns-g) 6%, transparent)" : "var(--ns-card)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${isSelected ? "var(--ns-g)" : "var(--ns-border)"}`,
                    background: isSelected ? "var(--ns-g)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: "#000", fontWeight: 800,
                  }}>
                    {isSelected ? "✓" : ""}
                  </div>
                  <span style={{ fontSize: 18 }}>{getCategoryIcon(bill.category)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ns-text)" }}>{bill.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ns-muted)" }}>Paid by {bill.paidBy} · {people} pax</div>
                  </div>
                  <div style={{ fontFamily: "var(--ns-syne)", fontSize: 15, fontWeight: 800, color: "var(--ns-y)" }}>
                    {Number(bill.amount).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
 
          {selectedBills.length > 0 && (
            <div style={{
              padding: "12px 16px", marginBottom: 14,
              background: "color-mix(in srgb, var(--ns-g) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--ns-g) 20%, transparent)",
              borderRadius: 14, display: "flex", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 13, color: "var(--ns-muted)" }}>Selected {selectedBills.length} bills</span>
              <span style={{ fontFamily: "var(--ns-syne)", fontSize: 15, fontWeight: 800, color: "var(--ns-g)" }}>
                {selectedTotal.toLocaleString()} THB
              </span>
            </div>
          )}
        </>
      )}
 
      {/* ── Equal: show the result immediately, no calculator needed ── */}
      {mode === "Equal" && (
        <div style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--ns-g) 10%, transparent), color-mix(in srgb, var(--ns-g) 3%, transparent))",
          border: "1px solid color-mix(in srgb, var(--ns-g) 25%, transparent)",
          borderRadius: 24, padding: "24px 22px",
          textAlign: "center", marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "color-mix(in srgb, var(--ns-g) 70%, transparent)", marginBottom: 8 }}>
            Each Person Pays
          </div>
          <div style={{ fontFamily: "var(--ns-syne)", fontSize: 44, fontWeight: 800, letterSpacing: "-2px", color: "var(--ns-g)", lineHeight: 1 }}>
            {equalPerPerson.toFixed(2)}
          </div>
          <div style={{ fontSize: 14, color: "var(--ns-muted)", marginTop: 6 }}>
            THB · split across {tripMembers.length} people
          </div>
        </div>
      )}

      {/* ── Custom: แสดงสมาชิก ── */}
      {mode === "Custom" && tripMembers.length > 0 && (
        <>
          <div className="ns-section-label">Custom Amount per Person</div>
          {tripMembers.map((member) => (
            <div key={member} className="ns-card" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "color-mix(in srgb, var(--ns-g) 12%, transparent)", display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: "var(--ns-syne)", fontWeight: 800,
                fontSize: 16, color: "var(--ns-g)",
              }}>
                {member.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ns-text)" }}>{member}</div>
              <input
                type="number"
                placeholder="0"
                value={customAmounts[member] || ""}
                onChange={(e) => setCustomAmounts((prev) => ({ ...prev, [member]: e.target.value }))}
                style={{
                  width: 90, padding: "8px 10px", borderRadius: 10,
                  background: "var(--ns-card2)", border: "1px solid var(--ns-border)",
                  color: "var(--ns-text)", fontFamily: "var(--ns-syne)", fontWeight: 700,
                  fontSize: 14, textAlign: "right",
                }}
              />
              <span style={{ fontSize: 12, color: "var(--ns-muted)" }}>THB</span>
            </div>
          ))}
        </>
      )}
 
      {/* ── Actions ── */}
      {mode !== "Equal" && (
        <button
          className="ns-btn ns-btn-primary"
          style={{ marginTop: 8 }}
          onClick={handleContinue}
          disabled={mode === "Select Bills" && selectedBills.length === 0}
        >
          Continue to Calculator →
        </button>
      )}
      <button
        className={`ns-btn ${mode === "Equal" ? "ns-btn-primary" : "ns-btn-ghost"}`}
        style={{ marginTop: mode === "Equal" ? 8 : 10 }}
        onClick={() => setPage("settlement")}
      >
        ← Back to Settlement
      </button>
    </div>
  );
}
 
export default SplitBill;