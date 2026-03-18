import React, { useEffect } from "react";
import "../App.css";

function Splash({ setPage }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage("home");
    }, 2400);

    return () => clearTimeout(timer);
  }, [setPage]);

  return (
    <div className="screen-dark splash-screen neo-splash">
      <div className="splash-bg-orb splash-bg-orb-1" />
      <div className="splash-bg-orb splash-bg-orb-2" />
      <div className="splash-grid" />

      <div className="splash-logo-box neo-splash-box">
        <img
          src="https://i.ibb.co/JRcxX9y9/Heading-1.png"
          alt="NeoSplit Logo"
          className="splash-logo-img"
        />
      </div>

      <div className="splash-subtitle neo-splash-subtitle">
        Gamified expense splitting
      </div>

      <div className="splash-dots neo-splash-dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default Splash;