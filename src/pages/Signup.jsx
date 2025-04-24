import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import Logo from "../assets/vector.png";
import LoginPic from "../assets/loginpic.jpg";
import SignupForm from "../components/SignupForm";
import SocialAuthButtons from "../components/SocialAuthButtons";
import { useNavigate } from 'react-router-dom'; 

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate(); // Initialize navigate function
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false); // State to control the visibility of the popup

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(`${backendUrl}/api/users/signup`, formData);      setSuccessMessage(response.data.message || "Signup successful!");
      setShowPopup(true); // Show popup on successful signup
      setTimeout(() => {
        setShowPopup(false); // Hide popup after 2 seconds
        navigate("/login"); // Redirect to login after showing popup
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="d-flex flex-column flex-md-row vh-100">
      <div className="col-md-6 d-none d-md-flex justify-content-center align-items-center position-relative" style={{
        backgroundImage: `url(${LoginPic})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
        <div className="position-absolute" style={{
          bottom: "20px",
          left: "20px",
          textAlign: "left",
        }}>
          <div style={{
            color: "white",
            fontSize: "1.8rem",
            fontWeight: "bold",
            textShadow: "2px 2px 5px rgba(0, 0, 0, 0.7)",
          }}>SIGN UP TO</div>
          <div style={{
            fontSize: "2rem",
            fontWeight: "bold",
            background: "linear-gradient(to right, #ffffff, #800080)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>CODE UNITY!</div>
        </div>
      </div>
      <div className="col-12 col-md-6 d-flex justify-content-center align-items-center">
        <div className="w-75 p-4" style={{
          border: "2px solid black",
          borderRadius: "20px",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          backgroundColor: "white",
        }}>
          <div className="text-center mb-4">
            <img src={Logo} alt="Logo" className="img-fluid" style={{ maxWidth: "50px" }} />
          </div>
          <div className="text-center mb-4">
            <h2 className="mb-2" style={{ fontSize: "2rem", color: "#000000" }}>
              Signup
            </h2>
            <p style={{ fontSize: "1rem", color: "#6c757d" }}>Just some details to get you in!</p>
          </div>
          {error && <p className="text-danger text-center">{error}</p>}
          {successMessage && <p className="text-success text-center">{successMessage}</p>}
          <SignupForm
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
          />
          <div className="d-flex align-items-center justify-content-center my-3">
            <hr style={{ width: "30%", borderTop: "1px solid #000", margin: "0" }} />
            <span style={{ margin: "0 10px", color: "#000", fontWeight: "bold" }}>Or</span>
            <hr style={{ width: "30%", borderTop: "1px solid #000", margin: "0" }} />
          </div>
          <SocialAuthButtons />
          <div className="text-center mt-4">
            <p style={{ fontSize: "1rem", color: "#000" }}>
              Already registered?{" "}
              <button type="button" className="btn btn-link text-decoration-none" onClick={() => navigate("/login")}>
                Login
              </button>
            </p>
          </div>
          {showPopup && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              borderRadius: '10px',
              textAlign: 'center',
              zIndex: 1000,
            }}>
              <h4>Signup Successful!</h4>
              <p>Redirecting to login...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
