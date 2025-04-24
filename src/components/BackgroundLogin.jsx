import React from "react";
import LoginPic from "../assets/loginpic.jpg";

const BackgroundLogin = () => (
  <div
    className="col-md-6 d-none d-md-flex justify-content-center align-items-center position-relative"
    style={{
      backgroundImage: `url(${LoginPic})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    <div
      className="position-absolute"
      style={{
        bottom: "20px",
        left: "20px",
        textAlign: "left",
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: "1.8rem",
          fontWeight: "bold",
          textShadow: "2px 2px 5px rgba(0, 0, 0, 0.7)",
        }}
      >
        SIGN IN TO
      </div>
      <div
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          background: "linear-gradient(to right, #ffffff, #800080)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        CODE UNITY!
      </div>
    </div>
  </div>
);

export default BackgroundLogin;
