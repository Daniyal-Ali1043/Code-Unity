import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook
import Homebg from "../assets/Homebg.jpg";
import SocialAuthButtons from "./SocialAuthButtons"; // Import the SocialAuthButtons component

const Hero = () => {
  const navigate = useNavigate(); // Initialize the useNavigate hook

  return (
    <div
      className="container-fluid hero-section d-flex align-items-center justify-content-start"
      style={{
        backgroundImage: `url(${Homebg})`, // Background Image
        backgroundSize: "cover",
        height: "100vh",
        backgroundPosition: "center",
      }}
    >
      {/* Left-aligned Box Section */}
      <div
        className="d-flex justify-content-start align-items-center w-100"
        style={{
          paddingLeft: "5%", // Push box to the left
          maxWidth: "400px",
        }}
      >
        <div
          className="signup-box p-4 rounded shadow-lg w-100"
          style={{
            background: "linear-gradient(135deg, #ffffff, #e6e6fa, #d8bfd8)", // Gradient Background
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle Shadow
            border: "1px solid #ddd", // Light border for definition
          }}
        >
          <h2
            className="text-center mb-3"
            style={{
              color: "#333",
              fontWeight: "700",
              textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
            }}
          >
            Sign in to your account
          </h2>
          <p className="text-center mb-4" style={{ color: "#555" }}>
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/signup")} // Navigate to /signup
              style={{
                color: "#6a0dad",
                fontWeight: "600",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Join now
            </span>
          </p>

          {/* Social Auth Buttons */}
          <SocialAuthButtons />
        </div>
      </div>

      {/* Mobile-specific styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .hero-section {
            padding: 10px;
            height: auto;
            display: flex;
            align-items: center;
            justify-content: flex-start;
          }

          .signup-box {
            margin-left: 5%;
            margin-right: 10%;
            padding: 15px;
            width: 100%;
            max-width: 360px;
            box-sizing: border-box;
          }
        }

        @media (max-width: 375px) {
          .signup-box {
            margin-left: 2%;
            margin-right: 8%;
            padding: 10px;
            max-width: 340px;
          }
        }
      `}</style>
    </div>
  );
};

export default Hero;
