import React, { useState } from "react";
import "../App.css";

function SplitBill({
  setPage, tripBills = [], tripMembers = [], setSelectedBill,
  customSplit = null, setCustomSplit = () => {},
}) {
  const [mode, setMode] = useState("Equal");
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  // Pick up a Custom Split that's already set (e.g. coming back from
  // Settlement to tweak it) instead of starting blank every time.
  const [customAmounts, setCustomAmounts] = useState(() => customSplit || {});

  // tripMembers is [{id, name}] — bill.paidBy/sharedBy already store ids,
  // and customSplit is keyed by id too; this is the one place names get
  // resolved, for display only.
  const nameOf = (id) => tripMembers.find((m) => m.id === id)?.name || id || "";

  const pendingBills = tripBills.filter((b) => b.status !== "Finished");
  const totalAmount = tripBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  // Settlement only ever works over PENDING bills, so Custom Split has
  // to be checked against that same total — not every bill ever added —
  // or "fully assigned" here could still be wrong money once it reaches
  // Settlement's math.
  const pendingTotal = pendingBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  // Switching away from Custom clears any split that was being built —
  // otherwise a half-finished (or already-applied) Custom Split could
  // keep silently driving Settlement's math after you'd moved on to a
  // different mode.
  const changeMode = (title) => {
    setMode(title);
    if (title !== "Custom") setCustomSplit(null);
  };

  const toggleBill = (id) => {
    setSelectedBillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedBills = pendingBills.filter((b) => selectedBillIds.includes(b.id));
  const selectedTotal = selectedBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const equalPerPerson = tripMembers.length > 0 ? totalAmount / tripMembers.length : totalAmount;

  const allMemberIds = tripMembers.map((m) => m.id);
  const selectedMembers = Array.from(
    new Set(selectedBills.flatMap((b) => (b.sharedBy?.length ? b.sharedBy : allMemberIds)))
  );
  const selectedEqualPerPerson = selectedMembers.length > 0 ? selectedTotal / selectedMembers.length : selectedTotal;

  // Custom Split's running check — "did what you typed actually add up
  // to the bill?" instead of letting someone continue with ฿200
  // unaccounted for and finding out only in Settlement.
  const assignedTotal = tripMembers.reduce(
    (sum, m) => sum + (Number(customAmounts[m.id]) || 0), 0
  );
  const remaining = Number((pendingTotal - assignedTotal).toFixed(2));
  const isBalanced = Math.abs(remaining) < 0.01;

  // Equal and Select Bills already know everything they need (the bill
  // amount and who's sharing it) — there's nothing left to ask, so both
  // go straight to Settlement instead of a Calculator screen that would
  // just ask for the same Total/Number of People a second time.
  const goToSettlement = () => {
    if (mode === "Select Bills") {
      setSelectedBill({
        id: `split-${Date.now()}`,
        name: `${selectedBills.length} Selected Bills`,
        amount: selectedTotal,
        sharedBy: selectedMembers,
        pax: selectedMembers.length,
      });
    }
    setPage("settlement");
  };

  // Custom already knows exactly what each person should end up paying
  // — that's the whole point of Custom Split — so it goes straight to
  // Settlement too and hands it the per-person amounts, instead of
  // routing through a Calculator screen that only asks for a single
  // Total ÷ People (which would throw the per-person breakdown away).
  const applyCustomSplit = () => {
    if (!isBalanced) return;
    setCustomSplit(customAmounts);
    setPage("settlement");
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
          {mode === "Select Bills" ? selectedTotal.toLocaleString() : mode === "Custom" ? pendingTotal.toLocaleString() : totalAmount.toLocaleString()}
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
          onClick={() => changeMode(option.title)}
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
                    <div style={{ fontSize: 11, color: "var(--ns-muted)" }}>Paid by {nameOf(bill.paidBy)} · {people} pax</div>
                  </div>
                  <div style={{ fontFamily: "var(--ns-syne)", fontSize: 15, fontWeight: 800, color: "var(--ns-y)" }}>
                    {Number(bill.amount).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}

          {selectedBills.length > 0 && (
            <>
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

              {/* Already know the total and who's sharing it — show the
                  result immediately instead of sending you to a
                  calculator to re-enter the same numbers. */}
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
                  {selectedEqualPerPerson.toFixed(2)}
                </div>
                <div style={{ fontSize: 14, color: "var(--ns-muted)", marginTop: 6 }}>THB / person</div>
                {selectedMembers.length > 0 && (
                  <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: 8 }}>
                    {selectedMembers.map(nameOf).join(" · ")}
                  </div>
                )}
              </div>
            </>
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
          <div style={{ fontSize: 14, color: "var(--ns-muted)", marginTop: 6 }}>THB / person</div>
          {tripMembers.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: 8 }}>
              {tripMembers.map((m) => m.name).join(" · ")}
            </div>
          )}
        </div>
      )}

      {/* ── Custom: แสดงสมาชิก ── */}
      {mode === "Custom" && tripMembers.length > 0 && (
        <>
          <div className="ns-section-label">Custom Amount per Person</div>
          <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: -6, marginBottom: 10 }}>
            This replaces the equal split for ALL pending bills — Settlement will use these
            exact amounts instead of splitting each bill evenly.
          </div>
          {tripMembers.map((member) => (
            <div key={member.id} className="ns-card" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "color-mix(in srgb, var(--ns-g) 12%, transparent)", display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: "var(--ns-syne)", fontWeight: 800,
                fontSize: 16, color: "var(--ns-g)",
              }}>
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ns-text)" }}>{member.name}</div>
              <input
                type="number"
                placeholder="0"
                value={customAmounts[member.id] || ""}
                onChange={(e) => setCustomAmounts((prev) => ({ ...prev, [member.id]: e.target.value }))}
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

          {/* Running check so a ฿200 gap doesn't surface only once you're
              already in Settlement. */}
          <div className="ns-card" style={{
            marginBottom: 20,
            border: `1px solid ${isBalanced ? "color-mix(in srgb, var(--ns-g) 25%, transparent)" : "color-mix(in srgb, var(--ns-r) 25%, transparent)"}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "var(--ns-muted)" }}>Assigned</span>
              <span style={{ fontFamily: "var(--ns-syne)", fontSize: 15, fontWeight: 700, color: "var(--ns-text)" }}>
                {assignedTotal.toFixed(2)} / {pendingTotal.toFixed(2)} THB
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--ns-muted)" }}>
                {isBalanced ? "Fully assigned" : remaining > 0 ? "Remaining" : "Over by"}
              </span>
              <span style={{ fontFamily: "var(--ns-syne)", fontSize: 18, fontWeight: 800, color: isBalanced ? "var(--ns-g)" : "var(--ns-r)" }}>
                {isBalanced ? "✓ ฿0.00" : `${Math.abs(remaining).toFixed(2)} THB`}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ── Actions ── */}
      {mode === "Custom" && (
        <button
          className="ns-btn ns-btn-primary"
          style={{ marginTop: 8 }}
          onClick={applyCustomSplit}
          disabled={!isBalanced}
        >
          {isBalanced ? "Apply Custom Split →" : `Assign the remaining ${Math.abs(remaining).toFixed(2)} THB first`}
        </button>
      )}
      <button
        className={`ns-btn ${mode !== "Custom" ? "ns-btn-primary" : "ns-btn-ghost"}`}
        style={{ marginTop: mode !== "Custom" ? 8 : 10 }}
        onClick={mode === "Custom" ? () => setPage("settlement") : goToSettlement}
        disabled={mode === "Select Bills" && selectedBills.length === 0}
      >
        {mode === "Custom" ? "← Back to Settlement" : "View Settlement →"}
      </button>
    </div>
  );
}

export default SplitBill;