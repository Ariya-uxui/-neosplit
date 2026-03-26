import React, { useState } from "react";
import "../App.css";
 
function Pay({ setPage, pointsEarned = 0 }) {
  const [slipImage, setSlipImage] = useState(null);
  const [uploaded, setUploaded] = useState(false);
 
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSlipImage(ev.target.result);
      setUploaded(true);
    };
    reader.readAsDataURL(file);
  };
 
  return (
    <div className="ns-screen">
 
      {/* Header */}
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("settlement")}>‹</button>
        <span className="ns-title">Pay Bills</span>
        <div style={{ width: 36 }} />
      </div>
 
      {/* Points earned banner */}
      {pointsEarned > 0 && (
        <div style={{
          padding: "12px 16px", marginBottom: 14,
          background: "rgba(0,255,133,0.08)",
          border: "1px solid rgba(0,255,133,0.25)",
          borderRadius: 16, display: "flex",
          justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: "var(--ns-muted)" }}>Points earned</span>
          <span style={{ fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800, color: "var(--ns-g)" }}>
            +{pointsEarned} pts
          </span>
        </div>
      )}
 
      {/* QR / Prompt scan */}
      <div className="ns-card" style={{ textAlign: "center", padding: "28px 20px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ns-muted)", marginBottom: 16 }}>
          Scan to Pay
        </div>
 
        {/* QR placeholder */}
        <div style={{
          width: 160, height: 160, borderRadius: 16, margin: "0 auto 16px",
          background: "rgba(255,255,255,0.04)",
          border: "2px dashed rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 48,
        }}>
          📲
        </div>
 
        <div style={{ fontSize: 13, color: "var(--ns-muted)" }}>
          Scan QR code with your banking app
        </div>
      </div>
 
      {/* Upload slip */}
      <div className="ns-card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-text)", marginBottom: 12 }}>
          Upload Payment Slip
        </div>
 
        {slipImage ? (
          <div style={{ position: "relative" }}>
            <img
              src={slipImage}
              alt="slip"
              style={{ width: "100%", borderRadius: 12, maxHeight: 200, objectFit: "contain" }}
            />
            <button
              type="button"
              onClick={() => { setSlipImage(null); setUploaded(false); }}
              style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(255,59,92,0.85)", border: "none",
                borderRadius: "50%", width: 28, height: 28,
                color: "#fff", fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
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
 
      {/* Finish button → thankyou */}
      <button
        className="ns-btn ns-btn-primary"
        onClick={() => setPage("thankyou")}
      >
        {uploaded ? "✅ Confirm Payment" : "Finish"}
      </button>
 
      {/* Skip to leaderboard */}
      <button
        className="ns-btn ns-btn-ghost"
        style={{ marginTop: 10 }}
        onClick={() => setPage("leaderboard")}
      >
        🏆 Skip to Leaderboard
      </button>
 
    </div>
  );
}
 
export default Pay;