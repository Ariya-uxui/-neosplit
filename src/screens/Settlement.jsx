import React, { useMemo, useState } from "react";
import "../App.css";

// Splits `amount` (THB) among `people` so the satang amounts always sum
// to exactly `amount` — no more "33.33 × 3 = 99.99, where did the last
// satang go" ambiguity. Whoever's left over gets it deterministically
// (first people in the list, in order), so the same bill always splits
// the same way every time it's recalculated, not just on average.
const splitDeterministic = (amount, people) => {
  const n = people.length;
  const result = {};
  if (n === 0) return result;
  const totalCents = Math.round((Number(amount) || 0) * 100);
  const baseCents = Math.floor(totalCents / n);
  const remainderCents = totalCents - baseCents * n; // 0..n-1 leftover satang
  people.forEach((person, i) => {
    const cents = baseCents + (i < remainderCents ? 1 : 0);
    result[person] = cents / 100;
  });
  return result;
};

function Settlement({
  setPage,
  tripBills = [],
  tripMembers = [],
  settleAllBills,
  selectedBill = null,
  onSettleAndEarnPoints,
  userProfile = null,
  customSplit = null,
}) {
  const [expandedBalance, setExpandedBalance] = useState(null);
  const myName = userProfile?.name || null;

  const billsForCalculation = useMemo(() => {
    const sourceBills =
      selectedBill && selectedBill.status !== "Finished"
        ? [selectedBill]
        : tripBills.filter((bill) => bill.status !== "Finished");

    return sourceBills.map((bill) => {
      const sharedBy =
        Array.isArray(bill.sharedBy) && bill.sharedBy.length > 0
          ? bill.sharedBy : [];
      const peopleCount = sharedBy.length || Number(bill.pax) || 1;
      return {
        ...bill,
        name: bill.name || bill.title || "Untitled Expense",
        amount: Number(bill.amount) || 0,
        paidBy: bill.paidBy || "",
        sharedBy, peopleCount,
        splitAmount: peopleCount > 0 ? (Number(bill.amount) || 0) / peopleCount : 0,
      };
    });
  }, [tripBills, selectedBill]);

  const result = useMemo(() => {
    const memberSet = new Set(tripMembers);
    billsForCalculation.forEach((bill) => {
      if (bill.paidBy) memberSet.add(bill.paidBy);
      bill.sharedBy.forEach((name) => memberSet.add(name));
    });

    const pendingTotal = billsForCalculation.reduce((s, b) => s + (Number(b.amount) || 0), 0);

    // Custom Split only ever applies to the whole trip's pending bills
    // (never to a single drilled-into bill), and only while its total
    // still matches what's actually pending — add, delete, or settle a
    // bill and the old Custom Split no longer adds up to the real total,
    // so it's ignored rather than silently applied to the wrong amount.
    const customTotal = customSplit
      ? Object.values(customSplit).reduce((s, v) => s + (Number(v) || 0), 0)
      : 0;
    const customApplies =
      !!customSplit && !selectedBill &&
      Object.keys(customSplit).length > 0 &&
      Math.abs(customTotal - pendingTotal) < 0.01;

    const balances = {};
    Array.from(memberSet).forEach((m) => { balances[m] = 0; });

    if (customApplies) {
      // Each payer still gets full credit for what they actually paid,
      // bill by bill — only the "what do you owe" side changes, from an
      // equal per-bill share to the one fixed amount Custom Split set
      // for that person, applied once against the whole pending total.
      billsForCalculation.forEach((bill) => {
        if (bill.paidBy) balances[bill.paidBy] += Number(bill.amount) || 0;
      });
      Object.keys(balances).forEach((name) => {
        if (customSplit[name] != null) balances[name] -= Number(customSplit[name]) || 0;
      });
    } else {
      billsForCalculation.forEach((bill) => {
        const amount = Number(bill.amount) || 0;
        const payer = bill.paidBy;
        const participants = bill.sharedBy || [];
        if (!payer || participants.length === 0) return;
        const shares = splitDeterministic(amount, participants);
        balances[payer] += amount;
        participants.forEach((person) => { balances[person] -= shares[person]; });
      });
    }

    const creditors = [];
    const debtors = [];
    Object.entries(balances).forEach(([name, balance]) => {
      const rounded = Number(balance.toFixed(2));
      if (rounded > 0.01) creditors.push({ name, amount: rounded });
      else if (rounded < -0.01) debtors.push({ name, amount: Math.abs(rounded) });
    });
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transfers = [];
    let i = 0, j = 0;
    const cCopy = creditors.map(c => ({ ...c }));
    const dCopy = debtors.map(d => ({ ...d }));
    while (i < dCopy.length && j < cCopy.length) {
      const d = dCopy[i], c = cCopy[j];
      const amt = Math.min(d.amount, c.amount);
      transfers.push({ from: d.name, to: c.name, amount: Number(amt.toFixed(2)) });
      d.amount = Number((d.amount - amt).toFixed(2));
      c.amount = Number((c.amount - amt).toFixed(2));
      if (d.amount <= 0.01) i++;
      if (c.amount <= 0.01) j++;
    }

    const totalAmount = billsForCalculation.reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const amountToTransfer = transfers.reduce((s, t) => s + t.amount, 0);
    return { balances, transfers, totalAmount, amountToTransfer, customApplies };
  }, [billsForCalculation, tripMembers, customSplit, selectedBill]);

  const getCategoryIcon = (cat) =>
    ({ Food:"🍜", Ticket:"🎫", Transport:"🚕", Travel:"🚕", Merch:"🛍️", Hotel:"🏨" }[cat] || "💸");

  const isAllSettled = billsForCalculation.length === 0;
  const pointsToEarn = billsForCalculation.length * 10;
  const customApplies = result.customApplies;

  // Only balances that actually mean something — a row that's exactly
  // 0.00 (paid for exactly their own share, or fully settled already)
  // has no information value and just clutters the screen.
  const nonZeroBalances = Object.entries(result.balances).filter(
    ([, balance]) => Math.abs(balance) > 0.01
  );

  // The one question everyone actually has: "do *I* need to pay someone,
  // and how much?" — pulled out separately from the group-wide transfer
  // list so it's the very first thing you see, not something you have to
  // find yourself inside a list of everyone else's transfers too.
  const myOutgoing = myName ? result.transfers.filter((t) => t.from === myName) : [];
  const myIncoming = myName ? result.transfers.filter((t) => t.to === myName) : [];
  const myOweTotal = myOutgoing.reduce((s, t) => s + t.amount, 0);
  const myReceiveTotal = myIncoming.reduce((s, t) => s + t.amount, 0);

  // "Who Pays Who" grouped by the person doing the paying — so if Pin
  // owes two different people, that's one block ("Pin needs to pay"),
  // not two disconnected rows that happen to share a name.
  const transfersByPayer = useMemo(() => {
    const map = {};
    result.transfers.forEach((t) => {
      if (!map[t.from]) map[t.from] = [];
      map[t.from].push(t);
    });
    return map;
  }, [result.transfers]);

  // Answers "what actually adds up to this number" for a given person.
  // Under the normal equal split this is bill-by-bill (paid X, your
  // share Y). Under a Custom Split, the paid-side is still per bill
  // (that part is always real), but the owed-side is the one fixed
  // amount Custom Split set for them — shown as a single line instead
  // of a made-up per-bill share that isn't how the money actually works.
  const getContributions = (name) => {
    if (customApplies) {
      const payerLines = billsForCalculation
        .filter((bill) => bill.paidBy === name)
        .map((bill) => ({ name: bill.name, net: Number(bill.amount) || 0, isPayer: true, isParticipant: false, amount: bill.amount }));
      const myCustomShare = Number(customSplit[name]) || 0;
      const shareLine = myCustomShare > 0.005
        ? [{ name: "Custom Split", net: -myCustomShare, isPayer: false, isParticipant: true, custom: true }]
        : [];
      return [...payerLines, ...shareLine];
    }

    return billsForCalculation
      .map((bill) => {
        const isPayer = bill.paidBy === name;
        const isParticipant = bill.sharedBy.includes(name);
        if (!isPayer && !isParticipant) return null;
        const shares = splitDeterministic(bill.amount, bill.sharedBy);
        const myShare = isParticipant ? shares[name] : 0;
        let net = 0;
        if (isPayer) net += bill.amount;
        if (isParticipant) net -= myShare;
        if (Math.abs(net) < 0.005) return null; // paid for self only — no net effect
        return { name: bill.name, net, isPayer, isParticipant, share: myShare, amount: bill.amount };
      })
      .filter(Boolean);
  };

  const handleSettleAll = () => {
    // Only the bills actually shown here get marked Finished — looking
    // at just one bill (from Bill Detail) or a "Select Bills" split no
    // longer settles every other pending bill in the trip along with it.
    settleAllBills(billsForCalculation.map((b) => b.id));
    if (onSettleAndEarnPoints) onSettleAndEarnPoints(pointsToEarn);
    setPage("pay");
  };

  return (
    <div className="ns-screen">

      {/* ── Header ── */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("receipt")}>‹</button>
        <span className="ns-title">Settlement</span>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Summary hero — this number is money left to transfer, NOT
          the total value of pending bills (shown separately below it) ── */}
      <div className="ns-card" style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--ns-g) 10%, transparent), color-mix(in srgb, var(--ns-g) 3%, transparent))",
        border: "1px solid color-mix(in srgb, var(--ns-g) 20%, transparent)", marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "color-mix(in srgb, var(--ns-g) 70%, transparent)", marginBottom: 6 }}>
          {selectedBill ? "Bill Settlement" : "Money Left to Transfer"}
        </div>
        <div style={{ fontFamily: "var(--ns-syne)", fontSize: 34, fontWeight: 800, color: "var(--ns-g)", letterSpacing: "-1px", lineHeight: 1 }}>
          {result.amountToTransfer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span style={{ fontSize: 16, color: "var(--ns-muted)", marginLeft: 6 }}>THB</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: 5 }}>
          {result.transfers.length} transfer{result.transfers.length !== 1 ? "s" : ""} remaining
        </div>
        {!isAllSettled && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--ns-g)", fontWeight: 700 }}>
            🏅 Earn +{pointsToEarn} pts by settling all
          </div>
        )}
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: "1px solid color-mix(in srgb, var(--ns-g) 15%, transparent)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: "var(--ns-muted)" }}>Total of pending bills (not what you owe)</span>
          <span style={{ fontFamily: "var(--ns-syne)", fontSize: 15, fontWeight: 700, color: "var(--ns-text)" }}>
            {result.totalAmount.toLocaleString()} THB
          </span>
        </div>
      </div>

      {/* ── Custom Split applied — makes it visible that balances below
          are NOT the usual equal split, and gives a way back to change it ── */}
      {customApplies && (
        <div className="ns-card" style={{ marginBottom: 14, border: "1px solid color-mix(in srgb, var(--ns-y) 30%, transparent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ns-y)" }}>
              ✏️ Custom Split Applied
            </span>
            <button
              className="ns-btn ns-btn-ghost"
              style={{ width: "auto", padding: "6px 12px", fontSize: 12 }}
              onClick={() => setPage("splitbill")}
            >
              Change
            </button>
          </div>
          {Object.entries(customSplit).map(([name, amt]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
              <span style={{ color: "var(--ns-text)" }}>{name === myName ? "You" : name}</span>
              <span style={{ fontFamily: "var(--ns-syne)", fontWeight: 700, color: "var(--ns-text)" }}>{Number(amt || 0).toFixed(2)} THB</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Your Transfers — the one question everyone actually has ── */}
      {!isAllSettled && myName && (
        <>
          <div className="ns-section-label">Your Transfers</div>
          <div className="ns-card" style={{ marginBottom: 14 }}>
            {myOutgoing.length === 0 && myIncoming.length === 0 && (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ns-g)" }}>You're all settled</div>
                <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: 2 }}>
                  Other transfers are still pending below
                </div>
              </div>
            )}

            {myOutgoing.length > 0 && (
              <div style={{ marginBottom: myIncoming.length > 0 ? 16 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-r)" }}>You need to pay</span>
                  <span style={{ fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800, color: "var(--ns-r)" }}>
                    {myOweTotal.toFixed(2)} <span style={{ fontSize: 12, color: "var(--ns-muted)" }}>THB</span>
                  </span>
                </div>
                {myOutgoing.map((t, i) => (
                  <div key={`out-${i}`} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderTop: i > 0 ? "1px solid var(--ns-border)" : "none",
                  }}>
                    <span style={{ fontSize: 14, color: "var(--ns-text)", fontWeight: 600 }}>{t.to}</span>
                    <span style={{ fontFamily: "var(--ns-syne)", fontSize: 14, fontWeight: 700, color: "var(--ns-r)" }}>
                      {t.amount.toFixed(2)} THB
                    </span>
                  </div>
                ))}
              </div>
            )}

            {myIncoming.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-g)" }}>You'll receive</span>
                  <span style={{ fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800, color: "var(--ns-g)" }}>
                    {myReceiveTotal.toFixed(2)} <span style={{ fontSize: 12, color: "var(--ns-muted)" }}>THB</span>
                  </span>
                </div>
                {myIncoming.map((t, i) => (
                  <div key={`in-${i}`} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderTop: i > 0 ? "1px solid var(--ns-border)" : "none",
                  }}>
                    <span style={{ fontSize: 14, color: "var(--ns-text)", fontWeight: 600 }}>{t.from}</span>
                    <span style={{ fontFamily: "var(--ns-syne)", fontSize: 14, fontWeight: 700, color: "var(--ns-g)" }}>
                      +{t.amount.toFixed(2)} THB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── All settled state ── */}
      {isAllSettled && (
        <div className="ns-card" style={{ textAlign: "center", padding: 32, marginBottom: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
          <div style={{ fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800, color: "var(--ns-g)", marginBottom: 6 }}>
            Everyone is settled!
          </div>
          <div style={{ fontSize: 13, color: "var(--ns-muted)", marginBottom: 16 }}>No transfers remaining.</div>
          <button className="ns-btn ns-btn-ghost" style={{ width: "auto", padding: "8px 18px", fontSize: 13 }} onClick={() => setPage("billhistory")}>
            View settlement history
          </button>
        </div>
      )}

      {/* ── Bill Breakdown ── */}
      {billsForCalculation.length > 0 && (
        <>
          <div className="ns-section-label">Bill Breakdown</div>
          {billsForCalculation.map((bill, index) => (
            <div key={bill.id || `${bill.name}-${index}`} className="ns-card"
              style={{ animationDelay: `${index * 0.05}s`, animation: "cardUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 20, width: 36, height: 36, background: "rgba(255,255,255,0.04)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getCategoryIcon(bill.category)}
                  </div>
                  <div style={{ fontFamily: "var(--ns-syne)", fontSize: 15, fontWeight: 700, color: "var(--ns-text)" }}>
                    {bill.name}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--ns-syne)", fontSize: 16, fontWeight: 800, color: "var(--ns-y)", flexShrink: 0 }}>
                  {bill.amount.toLocaleString()} THB
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: "var(--ns-muted)", paddingTop: 8, borderTop: "1px solid var(--ns-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Paid by</span>
                  <span style={{ color: "var(--ns-text)", fontWeight: 600 }}>{bill.paidBy}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Shared by</span>
                  <span style={{ color: "var(--ns-text)", fontWeight: 600 }}>
                    {bill.sharedBy.length > 0 ? bill.sharedBy.join(", ") : `${bill.peopleCount} people`}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Each person pays</span>
                  <span style={{ color: "var(--ns-g)", fontFamily: "var(--ns-syne)", fontWeight: 700, fontSize: 13 }}>
                    {customApplies ? "custom split applied" : `${bill.splitAmount.toFixed(2)} THB`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Group Balances ── */}
      {nonZeroBalances.length > 0 && (
        <>
          <div className="ns-section-label">Group Balances</div>
          <div style={{ fontSize: 11, color: "var(--ns-muted)", marginTop: -8, marginBottom: 10 }}>
            Tap a balance to see what it's made of
          </div>
          {nonZeroBalances.map(([name, balance], index) => {
            const isPos = balance >= 0;
            const isExpanded = expandedBalance === name;
            const contributions = isExpanded ? getContributions(name) : [];
            const isMe = name === myName;
            return (
              <div key={name} className="ns-card ns-clickable"
                style={{ animationDelay: `${index * 0.06}s`, animation: "cardUp 0.3s ease", borderColor: isPos ? "color-mix(in srgb, var(--ns-g) 15%, transparent)" : "color-mix(in srgb, var(--ns-r) 15%, transparent)", cursor: "pointer" }}
                onClick={() => setExpandedBalance(isExpanded ? null : name)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: isPos ? "color-mix(in srgb, var(--ns-g) 15%, transparent)" : "color-mix(in srgb, var(--ns-r) 15%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ns-syne)", fontSize: 18, fontWeight: 800, color: isPos ? "var(--ns-g)" : "var(--ns-r)", border: `1px solid ${isPos ? "color-mix(in srgb, var(--ns-g) 25%, transparent)" : "color-mix(in srgb, var(--ns-r) 25%, transparent)"}` }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ns-text)", marginBottom: 3 }}>
                      {name}{isMe ? " (You)" : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ns-muted)" }}>{isPos ? "Gets back" : "Owes"}</div>
                  </div>
                  <div style={{ fontFamily: "var(--ns-syne)", fontSize: 18, fontWeight: 800, color: isPos ? "var(--ns-g)" : "var(--ns-r)", textAlign: "right" }}>
                    {isPos ? "+" : "-"}{Math.abs(balance).toFixed(2)}
                    <div style={{ fontSize: 10, color: "var(--ns-muted)", fontFamily: "var(--ns-dm)", fontWeight: 400 }}>THB</div>
                  </div>
                  <span style={{ color: "var(--ns-muted)", fontSize: 14, marginLeft: 4 }}>{isExpanded ? "▲" : "▼"}</span>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--ns-border)", display: "flex", flexDirection: "column", gap: 8 }}>
                    {contributions.map((c, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "var(--ns-text2)" }}>
                          {c.name}
                          {c.custom && " (fixed amount from Custom Split)"}
                          {!c.custom && c.isPayer && c.isParticipant && ` (paid ${c.amount.toFixed(2)}, your share ${c.share.toFixed(2)})`}
                          {!c.custom && c.isPayer && !c.isParticipant && ` (paid ${c.amount.toFixed(2)} for others)`}
                          {!c.custom && !c.isPayer && c.isParticipant && ` (your share)`}
                        </span>
                        <span style={{ fontWeight: 700, color: c.net >= 0 ? "var(--ns-g)" : "var(--ns-r)", flexShrink: 0, marginLeft: 10 }}>
                          {c.net >= 0 ? "+" : ""}{c.net.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ── Who Pays Who — every transfer in the group, grouped by who's
          doing the paying, so "Pin owes two people" reads as one block
          instead of two disconnected rows ── */}
      {!isAllSettled && (
        <>
          <div className="ns-section-label">Who Pays Who</div>
          {result.transfers.length === 0 ? (
            <div className="ns-card" style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ns-g)" }}>No transfers needed</div>
            </div>
          ) : (
            Object.entries(transfersByPayer).map(([payer, items], groupIndex) => (
              <div key={payer} className="ns-card"
                style={{ animationDelay: `${groupIndex * 0.08}s`, animation: "cardUp 0.3s ease", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-text)", marginBottom: 10 }}>
                  {payer === myName ? "You" : payer} need{payer === myName ? "" : "s"} to pay
                </div>
                {items.map((item, i) => (
                  <div key={`${item.to}-${i}`} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "6px 0", borderTop: i > 0 ? "1px solid var(--ns-border)" : "none",
                  }}>
                    <div style={{ fontSize: 14, color: "var(--ns-text)" }}>
                      <span style={{ color: "var(--ns-muted)" }}>→</span>{" "}
                      <span style={{ fontWeight: 700, color: "var(--ns-g)" }}>
                        {item.to === myName ? "You" : item.to}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--ns-syne)", fontSize: 15, fontWeight: 800, color: "var(--ns-g)" }}>
                      {item.amount.toFixed(2)} <span style={{ fontSize: 10, color: "var(--ns-muted)" }}>THB</span>
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </>
      )}

      {/* ── Actions ── */}
      <button className="ns-btn ns-btn-dark" onClick={() => setPage("exportsummary")}>
        📤 Export Summary
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {!isAllSettled && (
          <button className="ns-btn ns-btn-primary" onClick={handleSettleAll}>
            🎉 Complete Split & Earn +{pointsToEarn} pts
          </button>
        )}
        <button className="ns-btn ns-btn-dark" onClick={() => setPage("splitbill")}>
          Split Calculator
        </button>
        <button className="ns-btn ns-btn-ghost" onClick={() => setPage("receipt")}>
          ← Back to Bills
        </button>
      </div>

    </div>
  );
}

export default Settlement;