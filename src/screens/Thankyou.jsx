import React, { useEffect, useState } from "react";
import "../App.css";
 
function ThankYou({ setPage, userProfile, pointsEarned = 10 }) {
  const [show, setShow] = useState(false);
 
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);
 
  const name = userProfile?.name || "NongTaeyoung";
  const image = userProfile?.profileImage || "https://i.pinimg.com/736x/0b/11/d4/0b11d44290e5c34a8ebf40c4d58bde8f.jpg";
 
  return (
    <div className="ns-screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
 
      {/* ── Confetti emoji ── */}
      <div style={{ fontSize: 64, marginBottom: 8, animation: show ? "cardUp 0.5s ease" : "none" }}>🎉</div>
 
      {/* ── Avatar ── */}
      <div style={{
        width: 96, height: 96, borderRadius: "50%",
        border: "3px solid var(--ns-g)",
        overflow: "hidden", marginBottom: 16,
        boxShadow: "0 0 24px rgba(0,255,133,0.3)",
        opacity: show ? 1 : 0,
        transition: "opacity 0.5s ease 0.2s",
      }}>
        <img src={image} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
 
      {/* ── Name ── */}
      <div style={{
        fontFamily: "var(--ns-syne)", fontSize: 22, fontWeight: 800,
        color: "var(--ns-text)", marginBottom: 6,
        opacity: show ? 1 : 0, transition: "opacity 0.5s ease 0.3s",
      }}>
        {name}
      </div>
 
      <div style={{ fontSize: 14, color: "var(--ns-muted)", marginBottom: 24, opacity: show ? 1 : 0, transition: "opacity 0.5s ease 0.35s" }}>
        Thank you for your payment!
      </div>
 
      {/* ── Points earned card ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(0,255,133,0.12), rgba(0,255,133,0.04))",
        border: "1px solid rgba(0,255,133,0.3)",
        borderRadius: 24, padding: "24px 32px",
        textAlign: "center", marginBottom: 28,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.5s ease 0.4s",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,255,133,0.7)", marginBottom: 8 }}>
          Points Earned
        </div>
        <div style={{ fontFamily: "var(--ns-syne)", fontSize: 56, fontWeight: 800, color: "var(--ns-g)", lineHeight: 1, letterSpacing: "-2px" }}>
          +{pointsEarned}
        </div>
        <div style={{ fontSize: 14, color: "var(--ns-muted)", marginTop: 6 }}>pts added to your account</div>
      </div>
 
      {/* ── Actions ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", opacity: show ? 1 : 0, transition: "opacity 0.5s ease 0.5s" }}>
        <button className="ns-btn ns-btn-primary" onClick={() => setPage("trophy")}>
          🏆 View Leaderboard
        </button>
        <button className="ns-btn ns-btn-ghost" onClick={() => setPage("home")}>
          Back to Home
        </button>
      </div>
 
    </div>
  );
}
 
export default ThankYou;