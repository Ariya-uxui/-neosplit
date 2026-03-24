import React, { useEffect, useState } from "react";
 
const FEATURES = [
  { icon: "⚖️", title: "Smart Settlement", desc: "คำนวณยอดที่ต้องจ่ายอัตโนมัติ ลด transfers ให้น้อยที่สุด" },
  { icon: "🏆", title: "Gamified Points", desc: "รับคะแนนทุกครั้งที่ settle bill แข่งกับเพื่อนใน leaderboard" },
  { icon: "📷", title: "Slip Attach", desc: "แนบรูปสลิปกับแต่ละบิล เก็บหลักฐานการจ่ายได้ครบ" },
  { icon: "📊", title: "Trip Analytics", desc: "ดูสรุปค่าใช้จ่ายแยกตาม category และ export แชร์ได้เลย" },
];
 
const STEPS = [
  { num: "01", title: "สร้าง Trip", desc: "เพิ่มชื่อ trip และสมาชิกทุกคน" },
  { num: "02", title: "เพิ่ม Bill", desc: "บันทึกค่าใช้จ่ายพร้อมแนบสลิป" },
  { num: "03", title: "Settlement", desc: "ระบบคำนวณยอดให้อัตโนมัติ" },
  { num: "04", title: "Earn Points", desc: "Settle แล้วได้คะแนนและ rewards" },
];
 
export default function LandingPage({ onEnter }) {
  const [visible, setVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
 
  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const handleMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);
 
  return (
    <div style={{
      minHeight: "100vh", background: "#060a06", color: "#fff",
      fontFamily: "'DM Sans', sans-serif", overflowX: "hidden",
      position: "relative",
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
 
      {/* Cursor glow */}
      <div style={{
        position: "fixed", pointerEvents: "none", zIndex: 0,
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,255,133,0.06) 0%, transparent 70%)",
        transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
        transition: "transform 0.3s ease",
      }} />
 
      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(0,255,133,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,133,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />
 
      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "rgba(6,10,6,0.8)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,255,133,0.08)",
      }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 900, color: "#00ff85", letterSpacing: "-0.5px" }}>
          NEO<span style={{ color: "#fff" }}>SPLIT</span>
        </div>
        <button
          onClick={onEnter}
          style={{
            padding: "10px 24px", borderRadius: 100,
            background: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.3)",
            color: "#00ff85", fontWeight: 700, fontSize: 14, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.target.style.background = "rgba(0,255,133,0.2)"; }}
          onMouseLeave={e => { e.target.style.background = "rgba(0,255,133,0.1)"; }}
        >
          Launch App →
        </button>
      </nav>
 
      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 24px 80px", textAlign: "center", position: "relative", zIndex: 1,
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 18px", borderRadius: 100, marginBottom: 32,
          background: "rgba(0,255,133,0.08)", border: "1px solid rgba(0,255,133,0.2)",
          fontSize: 13, fontWeight: 600, color: "#00ff85",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s ease",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff85", display: "inline-block", animation: "pulse 2s infinite" }} />
          Gamified Expense Splitting
        </div>
 
        {/* Headline */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontSize: "clamp(48px, 10vw, 96px)",
          fontWeight: 900, lineHeight: 1, letterSpacing: "-3px", marginBottom: 24,
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.7s ease 0.1s",
        }}>
          Split Bills.<br />
          <span style={{ color: "#00ff85" }}>Earn Points.</span><br />
          Have Fun.
        </h1>
 
        {/* Sub */}
        <p style={{
          fontSize: 18, color: "rgba(255,255,255,0.5)", maxWidth: 480,
          lineHeight: 1.7, marginBottom: 48,
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.7s ease 0.2s",
        }}>
          แอปหารค่าใช้จ่ายที่ทำให้การ settle bill สนุกขึ้น ด้วยระบบคะแนนและ leaderboard
        </p>
 
        {/* CTA */}
        <div style={{
          display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.7s ease 0.3s",
        }}>
          <button
            onClick={onEnter}
            style={{
              padding: "16px 36px", borderRadius: 100,
              background: "#00ff85", border: "none",
              color: "#000", fontWeight: 800, fontSize: 16, cursor: "pointer",
              fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px",
              boxShadow: "0 0 40px rgba(0,255,133,0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.target.style.transform = "scale(1.04)"; e.target.style.boxShadow = "0 0 60px rgba(0,255,133,0.5)"; }}
            onMouseLeave={e => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "0 0 40px rgba(0,255,133,0.3)"; }}
          >
            เริ่มใช้งาน →
          </button>
          <a
            href="https://github.com/Ariya-uxui/-neosplit"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "16px 36px", borderRadius: 100,
              background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", fontWeight: 600, fontSize: 16, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.target.style.borderColor = "rgba(255,255,255,0.4)"; }}
            onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
          >
            GitHub ↗
          </a>
        </div>
 
        {/* Stats */}
        <div style={{
          display: "flex", gap: 48, marginTop: 72, flexWrap: "wrap", justifyContent: "center",
          opacity: visible ? 1 : 0, transition: "all 0.7s ease 0.5s",
        }}>
          {[["React", "Frontend"], ["PWA", "Mobile Ready"], ["LocalStorage", "Offline"]].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#00ff85" }}>{val}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>
 
      {/* ── FEATURES ── */}
      <section style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#00ff85", marginBottom: 12 }}>Features</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, letterSpacing: "-1.5px" }}>
            ทุกอย่างที่ต้องการ<br /><span style={{ color: "#00ff85" }}>ในที่เดียว</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} style={{
              padding: "28px 24px", borderRadius: 20,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              transition: "all 0.3s",
              animationDelay: `${i * 0.1}s`,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,255,133,0.3)"; e.currentTarget.style.background = "rgba(0,255,133,0.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            >
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
 
      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "80px 24px", maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#00ff85", marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, letterSpacing: "-1.5px" }}>
            ใช้งานง่าย<br /><span style={{ color: "#00ff85" }}>4 ขั้นตอน</span>
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{
              display: "flex", alignItems: "center", gap: 24,
              padding: "24px 28px", borderRadius: 16,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,255,133,0.04)"; e.currentTarget.style.borderColor = "rgba(0,255,133,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
            >
              <div style={{
                fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 800,
                color: "#00ff85", minWidth: 36, opacity: 0.7,
              }}>{s.num}</div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
 
      {/* ── CTA FOOTER ── */}
      <section style={{
        padding: "80px 24px 120px", textAlign: "center", position: "relative", zIndex: 1,
      }}>
        <div style={{
          maxWidth: 600, margin: "0 auto",
          padding: "56px 40px", borderRadius: 32,
          background: "linear-gradient(135deg, rgba(0,255,133,0.08), rgba(0,255,133,0.02))",
          border: "1px solid rgba(0,255,133,0.2)",
        }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 40, fontWeight: 900, letterSpacing: "-1.5px", marginBottom: 16 }}>
            พร้อมแล้ว?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, marginBottom: 32 }}>
            เริ่ม split bill กับเพื่อนได้เลย ฟรี ไม่ต้องสมัคร
          </p>
          <button
            onClick={onEnter}
            style={{
              padding: "16px 48px", borderRadius: 100,
              background: "#00ff85", border: "none",
              color: "#000", fontWeight: 800, fontSize: 16, cursor: "pointer",
              fontFamily: "'Syne', sans-serif",
              boxShadow: "0 0 40px rgba(0,255,133,0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.target.style.transform = "scale(1.04)"; }}
            onMouseLeave={e => { e.target.style.transform = "scale(1)"; }}
          >
            เข้าใช้งาน NeoSplit →
          </button>
        </div>
        <div style={{ marginTop: 40, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
          Built with React · Deployed on Vercel · Open Source on GitHub
        </div>
      </section>
 
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}