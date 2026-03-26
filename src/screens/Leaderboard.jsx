import React, { useEffect, useState } from "react";
import "../App.css";
import { db } from "../firebase";
import { ref, onValue, set } from "firebase/database";

function Leaderboard({ setPage, userPoints = 0, userProfile, tripMembers = [] }) {
  const currentUser = userProfile?.name || "NongTaeyoung";
  const [scores, setScores] = useState({});

  // โหลดคะแนนทุกคนจาก Firebase
  useEffect(() => {
    const unsub = onValue(ref(db, "memberPoints"), (snap) => {
      const data = snap.val() || {};
      setScores(data);
    });
    return () => unsub();
  }, []);

  // sync คะแนนตัวเองขึ้น Firebase เมื่อ userPoints เปลี่ยน
  useEffect(() => {
    if (!currentUser) return;
    set(ref(db, `memberPoints/${currentUser}`), userPoints);
  }, [userPoints, currentUser]);

  // รวม members ทั้งหมด
  const allNames = Array.from(new Set([
    ...tripMembers,
    ...Object.keys(scores),
    currentUser,
  ]));

  const allUsers = allNames
    .map((name) => ({
      name,
      points: name === currentUser ? userPoints : (scores[name] || 0),
      isMe: name === currentUser,
    }))
    .sort((a, b) => b.points - a.points);

  const medals = ["👑", "🥈", "🥉"];

  const handleReset = () => {
    if (!window.confirm("Reset คะแนนทุกคนเป็น 0 ใช่ไหม?")) return;
    const resetObj = {};
    allUsers.forEach((u) => { resetObj[u.name] = 0; });
    set(ref(db, "memberPoints"), resetObj);
    set(ref(db, "userPoints"), 0);
  };

  return (
    <div className="ns-screen">

      {/* Header */}
      <div className="ns-page-header">
        <span className="ns-display">Leaderboard</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="ns-btn ns-btn-ghost"
            style={{ width: "auto", padding: "8px 12px", fontSize: 12 }}
            onClick={handleReset}
          >
            🔄 Reset
          </button>
          <button
            className="ns-btn ns-btn-ghost"
            style={{ width: "auto", padding: "8px 14px", fontSize: 13 }}
            onClick={() => setPage("mypoints")}
          >
            My Points
          </button>
        </div>
      </div>

      {/* Top 3 podium */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, marginBottom: 20, padding: "20px 0" }}>
        {[allUsers[1], allUsers[0], allUsers[2]].map((user, i) => {
          if (!user) return <div key={i} style={{ width: 90 }} />;
          const heights = [80, 100, 60];
          const rank = i === 1 ? 0 : i === 0 ? 1 : 2;
          return (
            <div key={user.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 24 }}>{medals[rank] || "⭐"}</div>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: user.isMe ? "rgba(0,255,133,0.2)" : "rgba(255,255,255,0.08)",
                border: `2px solid ${user.isMe ? "var(--ns-g)" : "var(--ns-border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--ns-syne)", fontSize: 20, fontWeight: 800,
                color: user.isMe ? "var(--ns-g)" : "var(--ns-text)",
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700,
                color: user.isMe ? "var(--ns-g)" : "var(--ns-text2)",
                textAlign: "center", maxWidth: 70,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user.isMe ? "You" : user.name}
              </div>
              <div style={{
                width: 70, height: heights[i], borderRadius: "8px 8px 0 0",
                background: i === 1 ? "rgba(0,255,133,0.2)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${i === 1 ? "rgba(0,255,133,0.3)" : "var(--ns-border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--ns-syne)", fontWeight: 800, fontSize: 14,
                color: i === 1 ? "var(--ns-g)" : "var(--ns-text2)",
              }}>
                {user.points}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="ns-section-label">Rankings</div>
      {allUsers.map((user, index) => (
        <div
          key={user.name}
          className="ns-card"
          style={{
            display: "flex", alignItems: "center", gap: 14, marginBottom: 10,
            border: user.isMe ? "1px solid rgba(0,255,133,0.3)" : "1px solid var(--ns-border)",
            background: user.isMe ? "rgba(0,255,133,0.06)" : "var(--ns-card)",
          }}
        >
          <div style={{ fontSize: 20, width: 28, textAlign: "center" }}>
            {medals[index] || `#${index + 1}`}
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: user.isMe ? "rgba(0,255,133,0.15)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${user.isMe ? "rgba(0,255,133,0.3)" : "var(--ns-border)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--ns-syne)", fontWeight: 800, fontSize: 16,
            color: user.isMe ? "var(--ns-g)" : "var(--ns-text2)",
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: user.isMe ? "var(--ns-g)" : "var(--ns-text)" }}>
              {user.isMe ? `${user.name} (You)` : user.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--ns-muted)" }}>Rank #{index + 1}</div>
          </div>
          <div style={{ fontFamily: "var(--ns-syne)", fontSize: 18, fontWeight: 800, color: user.isMe ? "var(--ns-g)" : "var(--ns-text)" }}>
            {user.points}
            <span style={{ fontSize: 11, color: "var(--ns-muted)", marginLeft: 3 }}>pts</span>
          </div>
        </div>
      ))}

      <button className="ns-btn ns-btn-primary" style={{ marginTop: 8 }} onClick={() => setPage("mypoints")}>
        My Points →
      </button>
    </div>
  );
}

export default Leaderboard;