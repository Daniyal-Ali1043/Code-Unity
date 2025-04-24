import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import BackgroundLogin from "../components/BackgroundLogin";
import LoginForm from "../components/LoginForm";
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if state contains 'showPopup' flag
    if (location.state?.showPopup) {
      setShowPopup(true);
    }
  }, [location.state]);

  const closePopup = () => {
    setShowPopup(false);
    window.history.replaceState({}, ""); // Clear state to prevent showing popup again on reload
  };

  const handleLogin = async (email, password) => {
    try {
        const res = await axios.post("/api/auth/login", {
            email,
            password,
        });

        if (res.status === 200) {
            const { token, user } = res.data;

            // ✅ Store user details in localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("userId", user.id);
            localStorage.setItem("username", user.username);
            localStorage.setItem("role", user.role); // ✅ Store role properly

            console.log(`✅ User logged in: ${user.id} - ${user.username} | Role: ${user.role}`);

            // ✅ Redirect Based on Role
            if (user.role === "developer") {
                navigate("/developerdashboard");
            } else if (user.role === "student") {
                navigate("/studentdashboard");
            } else {
                navigate("/dashboard"); // Default fallback
            }
        }
    } catch (error) {
        console.error("❌ Login failed:", error);
        alert("Login failed. Please check your credentials.");
    }
};

  return (
    <>
      {/* Main Layout */}
      <div className="d-flex flex-column flex-md-row vh-100">
        {/* Left Section */}
        <BackgroundLogin />

        {/* Right Section */}
        <div
          className="col-12 col-md-6 d-flex justify-content-center align-items-center"
          style={{ paddingTop: "50px", paddingBottom: "50px" }}
        >
          <div
            className="w-75 p-4"
            style={{
              border: "2px solid black",
              borderRadius: "20px",
            }}
          >
            <LoginForm onLogin={handleLogin} /> {/* Pass login function */}
          </div>
        </div>
      </div>

      {/* Popup Overlay */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h5 className="mb-3" style={{ color: "#dc3545" }}>
              You are not logged in
            </h5>
            <p>Please log in to access this page.</p>
            <button className="btn btn-primary" onClick={closePopup}>
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
