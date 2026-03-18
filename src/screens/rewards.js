import React, { useState } from "react";
import "../App.css";

function Rewards({ setPage }) {

  const [selectedReward,setSelectedReward] = useState(null)

  const rewards = [
    { id:1 , points:350 , text:"1 Free Hotel Night", icon:"🏨"},
    { id:2 , points:250 , text:"Free Meal", icon:"🍜"},
    { id:3 , points:200 , text:"Skip Paying Bill", icon:"💸"},
    { id:4 , points:150 , text:"Choose Restaurant", icon:"🍽️"}
  ]

  return (
    <div className="screen-dark rewards-bg">

      <div className="top-pill">Rewards</div>

      <div className="rewards-container">

        {rewards.map((reward)=>(

          <div
            key={reward.id}
            className={`reward-card ${selectedReward === reward.id ? "active":""}`}
            onClick={()=>setSelectedReward(reward.id)}
          >

            <div className="reward-left">

              <div className="reward-icon">
                {reward.icon}
              </div>

              <div>
                <div className="reward-title">
                  {reward.text}
                </div>

                <div className="reward-points">
                  {reward.points} pts
                </div>
              </div>

            </div>

            {selectedReward === reward.id && (
              <div className="reward-check">
                ✓
              </div>
            )}

          </div>

        ))}

      </div>

      {selectedReward && (

        <div className="redeem-confirm">
          Reward Selected 🎉
        </div>

      )}

      <button
        className="redeem-btn"
        disabled={!selectedReward}
        onClick={()=>setPage("yourredeem")}
      >
        Redeem Reward
      </button>

    </div>
  );
}

export default Rewards;