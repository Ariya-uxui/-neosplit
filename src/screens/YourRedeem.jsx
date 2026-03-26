import React, { useEffect, useState } from "react";
import "../App.css";

function YourRedeem({ setPage }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="ns-screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>

      <div style={{ fontSize: 64, marginBottom: 8, opacity: show ? 1 : 0, transition: "opacity 0.4s ease" }}>🎁</div>

      <div style={{
        fontFamily: "var(--ns-syne)", fontSize: 26, fontWeight: 800,
        color: "var(--ns-text)", marginBottom: 6,
        opacity: show ? 1 : 0, transition: "opacity 0.4s ease 0.1s",
      }}>
        Reward Redeemed!
      </div>

      <div style={{
        fontSize: 14, color: "var(--ns-muted)", marginBottom: 28,
        opacity: show ? 1 : 0, transition: "opacity 0.4s ease 0.15s",
      }}>
        Your reward has been redeemed successfully
      </div>

      <div style={{
        background: "linear-gradient(135deg, rgba(0,255,133,0.12), rgba(0,255,133,0.04))",
        border: "1px solid rgba(0,255,133,0.3)",
        borderRadius: 24, padding: "28px 36px",
        textAlign: "center", marginBottom: 28, width: "100%",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.5s ease 0.2s",
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ns-g)" }}>
          Success!
        </div>
        <div style={{ fontSize: 13, color: "var(--ns-muted)", marginTop: 6 }}>
          คะแนนถูกหักแล้ว รอรับของรางวัลได้เลย
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", opacity: show ? 1 : 0, transition: "opacity 0.4s ease 0.3s" }}>
        <button className="ns-btn ns-btn-primary" onClick={() => setPage("rewardslist")}>
          🎁 Redeem More
        </button>
        <button className="ns-btn ns-btn-ghost" onClick={() => setPage("home")}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default YourRedeem;