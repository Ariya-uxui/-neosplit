import React from "react";
import "../App.css";

function YourRedeem({ setPage }) {
  return (
    <div className="screen-dark rewards-bg center">
      <div className="top-pill">Reward Redeemed</div>

      <div className="redeem-success-card mt-20">
        <div className="confetti-icon">🎉</div>
        <h2 className="redeem-success-title">Success!</h2>
        <p className="redeem-success-text">
          Your reward has been redeemed successfully.
        </p>
      </div>

      <button className="btn-green mt-20" onClick={() => setPage("home")}>
        Back to Home
      </button>
    </div>
  );
}

export default YourRedeem;