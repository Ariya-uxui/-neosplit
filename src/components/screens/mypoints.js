import React from "react";
import "../App.css";

function MyPoints({ setPage }) {

  const points = 120;

  return (
    <div className="screen-green">

      <div className="top-pill">My Points</div>

      <div className="points-card">

        <div className="points-title">
          Your Points
        </div>

        <div className="points-value">
          {points}
        </div>

        <div className="points-badge">
          🏅 Top Splitter
        </div>

      </div>

      <div className="points-info-card">

        <div className="points-info-title">
          How to earn points
        </div>

        <div className="points-info-line">
          ➕ Add a bill
        </div>

        <div className="points-info-line">
          🤝 Settle with friends
        </div>

        <div className="points-info-line">
          🎯 Complete trips
        </div>

      </div>

      <button
        className="btn-black mt-20"
        onClick={() => setPage("rewardslist")}
      >
        Redeem Rewards
      </button>

      <button
        className="ghost-btn mt-12"
        onClick={() => setPage("trophy")}
      >
        Back to Leaderboard
      </button>

    </div>
  );
}

export default MyPoints;