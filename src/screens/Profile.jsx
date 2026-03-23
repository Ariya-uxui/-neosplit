import React, { useEffect, useRef, useState } from "react";
import "../App.css";
 
const DEFAULT_PROFILE = {
  name: "NongTaeyoung",
  selectedBias: "Taeyong",
  profileImage:
    "https://i.pinimg.com/736x/0b/11/d4/0b11d44290e5c34a8ebf40c4d58bde8f.jpg",
};
 
const BIAS_LIST = [
  // ── NCT 127 ──
  { id: 1,  name: "Taeyong",  emoji: "🌹", unit: "NCT 127" },
  { id: 2,  name: "Doyoung",  emoji: "🐰", unit: "NCT 127" },
  { id: 3,  name: "Johnny",   emoji: "🌼", unit: "NCT 127" },
  { id: 4,  name: "Mark",     emoji: "🦁", unit: "NCT 127" },
  { id: 5,  name: "Haechan",  emoji: "☀️", unit: "NCT 127" },
  { id: 6,  name: "Jaehyun",  emoji: "💚", unit: "NCT 127" },
  { id: 7,  name: "Yuta",     emoji: "⭐", unit: "NCT 127" },
  { id: 8,  name: "Jungwoo",  emoji: "🐶", unit: "NCT 127" },
  // ── NCT Dream ──
  { id: 9,  name: "Renjun",   emoji: "🍃", unit: "NCT Dream" },
  { id: 10, name: "Jeno",     emoji: "🖤", unit: "NCT Dream" },
  { id: 11, name: "Jaemin",   emoji: "🎀", unit: "NCT Dream" },
  { id: 12, name: "Chenle",   emoji: "🎵", unit: "NCT Dream" },
  { id: 13, name: "Jisung",   emoji: "✨", unit: "NCT Dream" },
  // ── WayV ──
  { id: 14, name: "Kun",      emoji: "🌙", unit: "WayV" },
  { id: 15, name: "Ten",      emoji: "🔥", unit: "WayV" },
  { id: 16, name: "WinWin",   emoji: "🎭", unit: "WayV" },
  { id: 17, name: "Xiaojun",  emoji: "🎹", unit: "WayV" },
  { id: 18, name: "Hendery",  emoji: "🌊", unit: "WayV" },
  { id: 19, name: "YangYang", emoji: "⚡", unit: "WayV" },
];
 
// ✅ รับ props จาก App.js (setUserProfile) เพื่อ sync state กลับไป
export default function Profile({ setPage, userProfile, setUserProfile }) {
  const [name,         setName]         = useState(userProfile?.name         || DEFAULT_PROFILE.name);
  const [selectedBias, setSelectedBias] = useState(userProfile?.selectedBias || DEFAULT_PROFILE.selectedBias);
  const [profileImage, setProfileImage] = useState(userProfile?.profileImage || DEFAULT_PROFILE.profileImage);
  const [toast,        setToast]        = useState("");
  const [saved,        setSaved]        = useState(false);
 
  const fileInputRef = useRef(null);
 
  // sync ถ้า userProfile เปลี่ยนจากข้างนอก
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || DEFAULT_PROFILE.name);
      setSelectedBias(userProfile.selectedBias || DEFAULT_PROFILE.selectedBias);
      setProfileImage(userProfile.profileImage || DEFAULT_PROFILE.profileImage);
    }
  }, [userProfile]);
 
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(t);
  }, [toast]);
 
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
 
    // ✅ แปลงเป็น base64 — persist ได้และ sync กับ Home.js ทันที
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setProfileImage(base64);
      // auto-save ทันที ให้ Home.js เห็นรูปใหม่โดยไม่ต้องกด Save
      const data = {
        name: name.trim() || DEFAULT_PROFILE.name,
        selectedBias,
        profileImage: base64,
      };
      setUserProfile(data);
      localStorage.setItem("neosplitProfile", JSON.stringify(data));
      setToast("Profile image updated 📸");
    };
    reader.readAsDataURL(file);
  };
 
  const handleSave = () => {
    const data = {
      name: name.trim() || DEFAULT_PROFILE.name,
      selectedBias,
      profileImage,
    };
    // sync กลับไป App.js
    setUserProfile(data);
    localStorage.setItem("neosplitProfile", JSON.stringify(data));
    setToast("Profile saved ✓");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
 
  return (
    <div className="ns-screen">
 
      {/* ── Header ── */}
      <div className="ns-page-header">
        <span className="ns-display">Profile</span>
      </div>
 
      {/* ── Avatar ── */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 96, height: 96, borderRadius: "50%",
            background: "var(--ns-card2)",
            border: "3px solid rgba(0,255,133,0.3)",
            overflow: "hidden", margin: "0 auto 12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--ns-syne)", fontSize: 38, fontWeight: 800, color: "var(--ns-g)",
            cursor: "pointer", transition: "border-color 0.2s",
          }}
        >
          {profileImage
            ? <img src={profileImage} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : name.charAt(0).toUpperCase()
          }
        </div>
        <button
          className="ns-btn ns-btn-ghost"
          style={{ width: "auto", padding: "8px 18px", fontSize: 13 }}
          onClick={() => fileInputRef.current?.click()}
        >
          📷 Change Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
      </div>
 
      {/* ── Name input ── */}
      <div className="ns-card" style={{ marginBottom: 14 }}>
        <div className="ns-input-group" style={{ marginBottom: 0 }}>
          <label className="ns-input-label">Your Name</label>
          <input
            className="ns-input"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            placeholder="Enter your name"
          />
        </div>
      </div>
 
      {/* ── Current bias display ── */}
      <div className="ns-card" style={{
        marginBottom: 14,
        background: "linear-gradient(135deg, rgba(0,255,133,0.08), rgba(0,255,133,0.02))",
        border: "1px solid rgba(0,255,133,0.2)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,255,133,0.7)", marginBottom: 4 }}>
            Current Bias
          </div>
          <div style={{ fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800, color: "var(--ns-text)" }}>
            {BIAS_LIST.find(b => b.name === selectedBias)?.emoji || "⭐"} {selectedBias}
          </div>
        </div>
        <span className="ns-badge ns-badge-green">Selected</span>
      </div>
 
      {/* ── Bias grid ── */}
      <div className="ns-section-label">Select Your Bias</div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8, marginBottom: 20,
      }}>
        {BIAS_LIST.map((bias) => {
          const isActive = selectedBias === bias.name;
          return (
            <button
              key={bias.id}
              onClick={() => { setSelectedBias(bias.name); setSaved(false); }}
              style={{
                background: isActive ? "rgba(0,255,133,0.1)" : "var(--ns-card)",
                border: `1px solid ${isActive ? "rgba(0,255,133,0.4)" : "var(--ns-border)"}`,
                borderRadius: 16, padding: "12px 8px",
                textAlign: "center", cursor: "pointer",
                transition: "all 0.18s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              <span style={{ fontSize: 22 }}>{bias.emoji}</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: isActive ? "var(--ns-g)" : "var(--ns-text2)",
              }}>
                {bias.name}
              </span>
              {isActive && (
                <span style={{ fontSize: 10, color: "var(--ns-g)", fontWeight: 800 }}>✓</span>
              )}
            </button>
          );
        })}
      </div>
 
      {/* ── Save button ── */}
      <button
        className="ns-btn ns-btn-primary"
        onClick={handleSave}
        style={{ background: saved ? "var(--ns-g2)" : undefined }}
      >
        {saved ? "✓ Saved!" : "Save Profile"}
      </button>
 
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "var(--ns-g)", color: "#000",
          padding: "10px 20px", borderRadius: 100,
          fontSize: 13, fontWeight: 700,
          boxShadow: "0 8px 24px rgba(0,255,133,0.35)",
          whiteSpace: "nowrap", zIndex: 50,
          animation: "toastFade 2s ease",
        }}>
          {toast}
        </div>
      )}
 
    </div>
  );
}