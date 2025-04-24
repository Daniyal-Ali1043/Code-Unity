import React from "react";
import bgLogo from "../assets/vector.png"; // Assuming the logo is in the same folder
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";

const AdminHeader = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/"); // Redirect to home page
  };

  return (
    <header className="bg-white shadow fixed-top">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between p-3">
        {/* Logo Section */}
        <div className="d-flex align-items-center mb-2 mb-lg-0">
          <img
            src={bgLogo}
            alt="Logo"
            className="me-2"
            style={{ width: "40px", height: "auto" }}
          />
          <span
            className="fw-bold"
            style={{
              fontFamily: "'Pacifico', cursive",
              fontSize: "1.5rem",
              color: "#333",
            }}
          >
            codeunity
          </span>
        </div>

        {/* Search Bar */}
        <div className="d-flex align-items-center mb-2 mb-lg-0 flex-grow-1 flex-lg-grow-0">
          <input
            type="text"
            className="form-control flex-grow-1"
            placeholder="Search by name or @username"
            style={{ borderRadius: "4px 0 0 4px", minWidth: "150px" }}
          />
          <button
            className="btn btn-dark d-flex align-items-center"
            style={{ borderRadius: "0 4px 4px 0", height: "38px" }}
          >
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
          <span className="text-dark" style={{ cursor: "pointer" }}>
            Earnings
          </span>
          <span className="text-dark" style={{ cursor: "pointer" }}>
            Explore
          </span>
          <span className="text-dark" style={{ cursor: "pointer" }}>
            English
          </span>
          <span className="text-dark" style={{ cursor: "pointer" }}>
            Register as a Student
          </span>
          <span className="text-dark" style={{ cursor: "pointer" }}>
            Profile
          </span>
          <button
            className="btn btn-outline-danger"
            onClick={handleLogout}
            style={{ borderRadius: "4px" }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
