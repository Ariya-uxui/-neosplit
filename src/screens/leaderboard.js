import React from "react";
import "../App.css";

function Leaderboard({ setPage }) {

  const users = [
    { name: "NongTaeyong", points: 120, badge: "👑" },
    { name: "Malikab", points: 100, badge: "🥈" },
    { name: "Haechan", points: 80, badge: "🥉" },
    { name: "Yutaaaaaa", points: 80, badge: "⭐" },
  ];

  return (
    <div className="screen-green leaderboard-simple-screen">

      <div className="top-pill">Leaderboard</div>

      <div className="leaderboard-simple-list">

        {users.map((user, index) => (

          <div
            key={index}
            className={`leader-row-simple ${index === 0 ? "leader-first" : ""}`}
          >

            <div className="leader-row-left-simple">

              <span className="leader-badge-simple">
                {user.badge}
              </span>

              <div>

                <div className="leader-name-simple">
                  {user.name}
                </div>

                <div className="leader-rank-simple">
                  Rank #{index + 1}
                </div>

              </div>

            </div>

            <div className="leader-points-simple">
              {user.points} pts
            </div>

          </div>

        ))}

      </div>

      <button
        className="btn-black mt-20"
        onClick={() => setPage("mypoints")}
      >
        My Points
      </button>

    </div>
  );
}

export default Leaderboard;