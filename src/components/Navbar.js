import React from "react";
import "../App.css";
 
const NAV_ITEMS = [
  {
    id: "home",
    icon: "🏠",
    label: "Home",
    match: ["home"],
  },
  {
    id: "receipt",
    icon: "📋",
    label: "Bills",
    match: ["receipt", "billhistory", "billdetail", "addexpense", "editexpense"],
  },
  {
    id: "settlement",
    icon: "⚖️",
    label: "Split",
    match: ["settlement", "splitbill", "splitcalculator", "tripdetail"],
  },
  {
    id: "trophy",
    icon: "🏆",
    label: "Ranks",
    match: ["trophy", "leaderboard", "mypoints", "rewardslist", "yourredeem"],
  },
  {
    id: "profile",
    icon: "👤",
    label: "Profile",
    match: ["profile"],
  },
];
 
function Navbar({ setPage, page }) {
  return (
    <div className="ns-navbar">
      {NAV_ITEMS.map((item) => {
        const isActive = item.match.includes(page);
        return (
          <button
            key={item.id}
            className={`ns-nav-item ${isActive ? "ns-nav-active" : ""}`}
            onClick={() => setPage && setPage(item.id)}
          >
            <span className="ns-nav-icon">{item.icon}</span>
            <span className="ns-nav-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
 
export default Navbar;