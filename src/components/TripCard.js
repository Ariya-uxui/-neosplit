import React from "react";
import "../App.css";

function TripCard({ title, members, total, setPage }) {
  return (
    <div className="trip-card">
      <div className="trip-card-top">
        <div>
          <h3 className="trip-title">{title}</h3>
          <p className="trip-meta">{members} members • Total {total}</p>
        </div>

        <button className="trip-view-btn" onClick={() => setPage("tripdetail")}>
          view
        </button>
      </div>
    </div>
  );
}

export default TripCard;