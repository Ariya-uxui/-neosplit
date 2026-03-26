import React, { useEffect, useRef, useState } from "react";
import "../App.css";

const DEFAULT_PROFILE = {
  name: "NongTaeyoung",
  selectedBias: "Taeyong",
  profileImage: "https://i.pinimg.com/736x/0b/11/d4/0b11d44290e5c34a8ebf40c4d58bde8f.jpg",
  qrImage: null,
};

const BIAS_LIST = [
  { id: 1,  name: "Taeyong",  emoji: "🌹", unit: "NCT 127" },
  { id: 2,  name: "Doyoung",  emoji: "🐰", unit: "NCT 127" },
  { id: 3,  name: "Johnny",   emoji: "🌼", unit: "NCT 127" },
  { id: 4,  name: "Mark",     emoji: "🦁", unit: "NCT 127" },
  { id: 5,  name: "Haechan",  emoji: "☀️", unit: "NCT 127" },
  { id: 6,  name: "Jaehyun",  emoji: "💚", unit: "NCT 127" },
  { id: 7,  name: "Yuta",     emoji: "⭐", unit: "NCT 127" },
  { id: 8,  name: "Jungwoo",  emoji: "🐶", unit: "NCT 127" },
  { id: 9,  name: "Renjun",   emoji: "🍃", unit: "NCT Dream" },
  { id: 10, name: "Jeno",     emoji: "🖤", unit: "NCT Dream" },
  { id: 11, name: "Jaemin",   emoji: "🎀", unit: "NCT Dream" },
  { id: 12, name: "Chenle",   emoji: "🎵", unit: "NCT Dream" },
  { id: 13, name: "Jisung",   emoji: "✨", unit: "NCT Dream" },
  { id: 14, name: "Kun",      emoji: "🌙", unit: "WayV" },
  { id: 15, name: "Ten",      emoji: "🔥", unit: "WayV" },
  { id: 16, name: "WinWin",   emoji: "🎭", unit: "WayV" },
  { id: 17, name: "Xiaojun",  emoji: "🎹", unit: "WayV" },
  { id: 18, name: "Hendery",  emoji: "🌊", unit: "WayV" },
  { id: 19, name: "YangYang", emoji: "⚡", unit: "WayV" },
];

export default function Profile({ setPage, userProfile, setUserProfile }) {
  const [name,         setName]         = useState(userProfile?.name         || DEFAULT_PROFILE.name);
  const [selectedBias, setSelectedBias] = useState(userProfile?.selectedBias || DEFAULT_PROFILE.selectedBias);
  const [profileImage, setProfileImage] = useState(userProfile?.profileImage || DEFAULT_PROFILE.profileImage);
  const [qrImage,      setQrImage]      = useState(userProfile?.qrImage      || null);
  const [toast,        setToast]        = useState("");
  const [saved,        setSaved]        = useState(false);

  const fileInputRef = useRef(null);
  const qrInputRef   = useRef(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || DEFAULT_PROFILE.name);
      setSelectedBias(userProfile.selectedBias || DEFAULT_PROFILE.selectedBias);
      setProfileImage(userProfile.profileImage || DEFAULT_PROFILE.profileImage);
      setQrImage(userProfile.qrImage || null);
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
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setProfileImage(base64);
      const data = { name: name.trim() || DEFAULT_PROFILE.name, selectedBias, profileImage: base64, qrImage };
      setUserProfile(data);
      localStorage.setItem("neosplitProfile", JSON.stringify(data));
      setToast("Profile image updated 📸");
    };
    reader.readAsDataURL(file);
  };

  const handleQrChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setQrImage(base64);
      const data = { name: name.trim() || DEFAULT_PROFILE.name, selectedBias, profileImage, qrImage: base64 };
      setUserProfile(data);
      localStorage.setItem("neosplitProfile", JSON.stringify(data));
      setToast("QR updated ✓");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const data = { name: name.trim() || DEFAULT_PROFILE.name, selectedBias, profileImage, qrImage };
    setUserProfile(data);
    localStorage.setItem("neosplitProfile", JSON.stringify(data));
    setToast("Profile saved ✓");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="ns-screen">

      {/* Header */}
      <div className="ns-page-header">
        <span className="ns-display">Profile</span>
      </div>

      {/* Avatar */}
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
            cursor: "pointer",
          }}
        >
          {profileImage
            ? <img src={profileImage} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : name.charAt(0).toUpperCase()
          }
        </div>
        <button className="ns-btn ns-btn-ghost" style={{ width: "auto", padding: "8px 18px", fontSize: 13 }}
          onClick={() => fileInputRef.current?.click()}>
          📷 Change Photo
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
      </div>

      {/* Name */}
      <div className="ns-card" style={{ marginBottom: 14 }}>
        <div className="ns-input-group" style={{ marginBottom: 0 }}>
          <label className="ns-input-label">Your Name</label>
          <input className="ns-input" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Enter your name" />
        </div>
      </div>

      {/* QR PromptPay */}
      <div className="ns-card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-text)", marginBottom: 4 }}>
          QR PromptPay ของคุณ
        </div>
        <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 12 }}>
          อัปโหลด QR จากแอปธนาคาร — เพื่อนจะ scan จ่ายเงินให้คุณได้เลย
        </div>

        {qrImage ? (
          <div style={{ position: "relative", textAlign: "center" }}>
            <img
              src={qrImage}
              alt="QR PromptPay"
              style={{ width: 180, height: 180, objectFit: "contain", borderRadius: 12, border: "1px solid rgba(0,255,133,0.2)" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                type="button"
                className="ns-btn ns-btn-dark"
                style={{ flex: 1, padding: "8px", fontSize: 12 }}
                onClick={() => qrInputRef.current?.click()}
              >
                🔄 เปลี่ยน QR
              </button>
              <button
                type="button"
                className="ns-btn"
                style={{ flex: 1, padding: "8px", fontSize: 12, background: "rgba(255,59,92,0.08)", color: "var(--ns-r)", border: "1px solid rgba(255,59,92,0.2)" }}
                onClick={() => {
                  setQrImage(null);
                  const data = { name, selectedBias, profileImage, qrImage: null };
                  setUserProfile(data);
                  localStorage.setItem("neosplitProfile", JSON.stringify(data));
                }}
              >
                🗑 ลบ QR
              </button>
            </div>
          </div>
        ) : (
          <label style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 8, padding: "24px 16px", borderRadius: 12,
            border: "1px dashed rgba(0,255,133,0.3)",
            background: "rgba(0,255,133,0.03)", cursor: "pointer",
          }}>
            <span style={{ fontSize: 36 }}>📱</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ns-g)" }}>อัปโหลด QR PromptPay</span>
            <span style={{ fontSize: 11, color: "var(--ns-muted)", textAlign: "center" }}>
              screenshot QR จากแอปธนาคารของคุณ
            </span>
            <input ref={qrInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleQrChange} />
          </label>
        )}
        <input ref={qrInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleQrChange} />
      </div>

      {/* Bias */}
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

      <div className="ns-section-label">Select Your Bias</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        {BIAS_LIST.map((bias) => {
          const isActive = selectedBias === bias.name;
          return (
            <button key={bias.id} onClick={() => { setSelectedBias(bias.name); setSaved(false); }}
              style={{
                background: isActive ? "rgba(0,255,133,0.1)" : "var(--ns-card)",
                border: `1px solid ${isActive ? "rgba(0,255,133,0.4)" : "var(--ns-border)"}`,
                borderRadius: 16, padding: "12px 8px",
                textAlign: "center", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              <span style={{ fontSize: 22 }}>{bias.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? "var(--ns-g)" : "var(--ns-text2)" }}>{bias.name}</span>
              {isActive && <span style={{ fontSize: 10, color: "var(--ns-g)", fontWeight: 800 }}>✓</span>}
            </button>
          );
        })}
      </div>

      <button className="ns-btn ns-btn-primary" onClick={handleSave} style={{ background: saved ? "var(--ns-g2)" : undefined }}>
        {saved ? "✓ Saved!" : "Save Profile"}
      </button>

      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "var(--ns-g)", color: "#000",
          padding: "10px 20px", borderRadius: 100,
          fontSize: 13, fontWeight: 700,
          whiteSpace: "nowrap", zIndex: 50,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}