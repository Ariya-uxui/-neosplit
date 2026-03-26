import React, { useState, useEffect } from "react";
import "../App.css";

function Pay({ setPage, pointsEarned = 0, tripBills = [], tripMembers = [] }) {
  const [slipImage, setSlipImage]     = useState(null);
  const [uploaded, setUploaded]       = useState(false);
  const [memberQRs, setMemberQRs]     = useState({});
  const [selectedMember, setSelected] = useState(null);

  // โหลด QR จาก localStorage ของแต่ละ member
  useEffect(() => {
    const qrs = {};
    // ดึง profile ของ user ปัจจุบัน
    try {
      const profile = JSON.parse(localStorage.getItem("neosplitProfile") || "{}");
      if (profile.name && profile.qrImage) {
        qrs[profile.name] = { qrImage: profile.qrImage };
      }
    } catch {}
    // ดึง QR ที่เก็บไว้ใน memberQRs (เพื่อนอัปโหลดผ่านแอปเดียวกัน)
    try {
      const saved = JSON.parse(localStorage.getItem("memberQRs") || "{}");
      Object.assign(qrs, saved);
    } catch {}
    setMemberQRs(qrs);
  }, []);

  // หา creditors (คนที่ต้องรับเงิน) จาก bills
  const creditors = React.useMemo(() => {
    const balances = {};
    tripMembers.forEach((m) => { balances[m] = 0; });
    tripBills.filter(b => b.status !== "Finished").forEach((bill) => {
      const amt = Number(bill.amount) || 0;
      const payer = bill.paidBy;
      const participants = bill.sharedBy || [];
      if (!payer || participants.length === 0) return;
      const share = amt / participants.length;
      balances[payer] = (balances[payer] || 0) + amt;
      participants.forEach((p) => { balances[p] = (balances[p] || 0) - share; });
    });
    return Object.entries(balances)
      .filter(([, bal]) => bal > 0.01)
      .map(([name, amount]) => ({ name, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => b.amount - a.amount);
  }, [tripBills, tripMembers]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setSlipImage(ev.target.result); setUploaded(true); };
    reader.readAsDataURL(file);
  };

  const displayMember = selectedMember || creditors[0]?.name;
  const displayQR = memberQRs[displayMember]?.qrImage;

  return (
    <div className="ns-screen">

      {/* Header */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("settlement")}>‹</button>
        <span className="ns-title">Pay Bills</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Points earned */}
      {pointsEarned > 0 && (
        <div style={{
          padding: "12px 16px", marginBottom: 14,
          background: "rgba(0,255,133,0.08)", border: "1px solid rgba(0,255,133,0.25)",
          borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: "var(--ns-muted)" }}>Points earned</span>
          <span style={{ fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800, color: "var(--ns-g)" }}>
            +{pointsEarned} pts
          </span>
        </div>
      )}

      {/* Creditor selector */}
      {creditors.length > 0 && (
        <div className="ns-card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ns-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            จ่ายให้ใคร
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {creditors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelected(c.name)}
                style={{
                  padding: "8px 14px", borderRadius: 100, cursor: "pointer",
                  border: `1px solid ${displayMember === c.name ? "rgba(0,255,133,0.4)" : "var(--ns-border)"}`,
                  background: displayMember === c.name ? "rgba(0,255,133,0.1)" : "var(--ns-card2)",
                  color: displayMember === c.name ? "var(--ns-g)" : "var(--ns-text2)",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                {displayMember === c.name ? "✓ " : ""}{c.name}
                <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 6 }}>{c.amount.toLocaleString()} THB</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QR Display */}
      <div className="ns-card" style={{ textAlign: "center", padding: "24px 20px", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ns-muted)", marginBottom: 16 }}>
          {displayMember ? `QR ของ ${displayMember}` : "Scan to Pay"}
        </div>

        {displayQR ? (
          <div>
            <img
              src={displayQR}
              alt="QR PromptPay"
              style={{
                width: 200, height: 200, objectFit: "contain",
                borderRadius: 16, margin: "0 auto 12px",
                border: "1px solid rgba(0,255,133,0.2)",
                display: "block",
              }}
            />
            <div style={{ fontSize: 13, color: "var(--ns-g)", fontWeight: 600 }}>
              Scan QR ด้วยแอปธนาคาร
            </div>
            {creditors.find(c => c.name === displayMember) && (
              <div style={{ fontFamily: "var(--ns-syne)", fontSize: 22, fontWeight: 800, color: "var(--ns-y)", marginTop: 8 }}>
                {creditors.find(c => c.name === displayMember)?.amount.toLocaleString()} THB
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{
              width: 160, height: 160, borderRadius: 16, margin: "0 auto 16px",
              background: "rgba(255,255,255,0.04)",
              border: "2px dashed rgba(255,255,255,0.12)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, fontSize: 40,
            }}>
              📱
            </div>
            <div style={{ fontSize: 13, color: "var(--ns-muted)", marginBottom: 8 }}>
              {displayMember ? `${displayMember} ยังไม่ได้อัปโหลด QR` : "ไม่มีข้อมูล QR"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ns-muted)" }}>
              ให้ {displayMember} ไปอัปโหลด QR ใน Profile ก่อนนะครับ
            </div>
          </div>
        )}
      </div>

      {/* Upload slip */}
      <div className="ns-card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-text)", marginBottom: 12 }}>
          Upload Payment Slip
        </div>
        {slipImage ? (
          <div style={{ position: "relative" }}>
            <img src={slipImage} alt="slip" style={{ width: "100%", borderRadius: 12, maxHeight: 200, objectFit: "contain" }} />
            <button type="button" onClick={() => { setSlipImage(null); setUploaded(false); }}
              style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(255,59,92,0.85)", border: "none", borderRadius: "50%",
                width: 28, height: 28, color: "#fff", fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>×</button>
          </div>
        ) : (
          <label style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 8, padding: "20px 16px", borderRadius: 12,
            border: "1px dashed var(--ns-border)",
            background: "var(--ns-card2)", cursor: "pointer",
          }}>
            <span style={{ fontSize: 28 }}>📎</span>
            <span style={{ fontSize: 13, color: "var(--ns-muted)" }}>Tap to upload slip</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
          </label>
        )}
      </div>

      <button className="ns-btn ns-btn-primary" onClick={() => setPage("thankyou")}>
        {uploaded ? "✅ Confirm Payment" : "Finish"}
      </button>
      <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setPage("leaderboard")}>
        🏆 Skip to Leaderboard
      </button>
    </div>
  );
}

export default Pay;