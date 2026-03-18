import React from "react";
import "../App.css";

function ThankYou() {
  return (
    <div className="screen-green">
      <div className="profile-panel" style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 18 }}>Thank you for your payment</div>

        <img
          className="avatar"
          src="https://i.pinimg.com/736x/0b/11/d4/0b11d44290e5c34a8ebf40c4d58bde8f.jpg"
          alt="profile"
          style={{ width: 140, height: 140 }}
        />

        <div style={{ marginTop: 12, fontWeight: 600 }}>NongTaeyoung</div>
        <div style={{ marginTop: 6 }}>15 points</div>
      </div>
    </div>
  );
}

export default ThankYou;