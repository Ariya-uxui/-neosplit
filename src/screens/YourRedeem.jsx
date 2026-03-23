import React from "react";
import "../App.css";

function YourRedeem({ setPage }) {

  return (

    <div className="screen-dark">

      <div className="top-pill">Reward Redeemed</div>

      <div className="white-panel center mt-20">

        <div style={{fontSize:"60px"}}>🎉</div>

        <h2 style={{marginTop:10}}>Success</h2>

        <p style={{marginTop:6}}>
          Your reward has been redeemed
        </p>

      </div>

      <button
        className="btn-green mt-20"
        onClick={()=>setPage("home")}
      >
        Back to Home
      </button>

    </div>

  )
}

export default YourRedeem