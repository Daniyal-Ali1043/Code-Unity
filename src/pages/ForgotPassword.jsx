import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Logo from "../assets/vector.png";
import LoginPic from "../assets/loginpic.jpg"; // Import the loginpic image

const ForgotPassword = () => {
  return (
    <div className="d-flex flex-column flex-md-row vh-100">
      {/* Left Section */}
      <div
        className="col-md-6 d-none d-md-flex justify-content-center align-items-center position-relative"
        style={{
          backgroundImage: `url(${LoginPic})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Gradient and Shadow Text */}
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
            WELCOME TO
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

      {/* Right Section */}
      <div className="col-12 col-md-6 d-flex justify-content-center align-items-center">
        <div
          className="w-75 p-4"
          style={{
            border: "2px solid black",
            borderRadius: "20px",
            color: "white",
          }}
        >
          {/* Logo */}
          <div className="text-center mb-4">
            <img
              src={Logo}
              alt="Logo"
              className="img-fluid"
              style={{ maxWidth: "50px" }}
            />
          </div>

          {/* Forgot Password Text */}
          <div className="text-center mb-4">
            <h2 className="mb-2" style={{ fontSize: "2rem", color: "#000000" }}>
              Forgot Password?
            </h2>
            <p style={{ fontSize: "1rem", color: "#000000" }}>
              Please enter your email
            </p>
          </div>

          {/* Forgot Password Form */}
          <form>
            {/* Email Input */}
            <div className="mb-3 position-relative">
              <input
                type="email"
                className="form-control"
                placeholder="example@mail.com"
                required
                style={{
                  backgroundColor: "transparent",
                  color: "white",
                  border: "1px solid #4f4f4f",
                }}
              />
            </div>

            {/* Reset Password Button */}
            <div className="d-grid mb-3">
              <button
                type="submit"
                className="btn"
                style={{
                  background: "linear-gradient(to right, #ff007f, #800080)",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Reset Password
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-4">
            <p
              style={{
                fontSize: "0.9rem",
                color: "#000000",
              }}
            >
              Don't have an account?{" "}
              <a href="#" className="text-decoration-none">
                Signup
              </a>
            </p>
            <div
              style={{
                fontSize: "0.8rem",
                color: "#b8b8b8",
              }}
            >
              Terms & Conditions | Support | Customer Care
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
