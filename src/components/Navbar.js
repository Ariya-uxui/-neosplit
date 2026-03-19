import React from "react";
import "../App.css";

function Navbar({ setPage, page }) {
  return (
    <div className="glass-nav">
      <div
        className={`nav-item ${page === "home" ? "nav-item-active" : ""}`}
        onClick={() => setPage && setPage("home")}
      >
        <span>🏠</span>
        Home
      </div>

      <div
        className={`nav-item ${page === "receipt" ? "nav-item-active" : ""}`}
        onClick={() => setPage && setPage("receipt")}
      >
        <span>🧾</span>
        receipt
      </div>

      <div
        className={`nav-item ${page === "trophy" || page === "leaderboard" || page === "mypoints" || page === "rewardslist" || page === "yourredeem" ? "nav-item-active" : ""}`}
        onClick={() => setPage && setPage("trophy")}
      >
        <span>🏆</span>
        Trophy
      </div>

      <div
        className={`nav-item ${page === "profile" ? "nav-item-active" : ""}`}
        onClick={() => setPage && setPage("profile")}
      >
        <span>👤</span>
        profile
      </div>
    </div>
  );
}

export default Navbar;