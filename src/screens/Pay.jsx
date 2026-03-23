import React from "react";
import "../App.css";

function Pay({ setPage }) {
  return (
    <div className="screen-green">
      <div className="top-pill">Pay Bills</div>

      <div className="qr-box">
        <div className="qr-inner" />
      </div>

      <button className="btn-black mt-20">Upload payment</button>

      <button className="btn-black mt-12" onClick={() => setPage("thankyou")}>
        Finish
      </button>
    </div>
  );
}

export default Pay;