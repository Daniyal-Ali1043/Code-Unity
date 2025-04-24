import React from "react";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope } from "react-icons/fa6";

const SignupForm = ({
  formData,
  handleChange,
  handleSubmit,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}) => {
  // Validate email format
  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // Validate password format: At least 8 characters, 1 uppercase, 1 digit, 1 special character
  const validatePassword = (password) => {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_-])[A-Za-z\d@$!%*?&_-]{8,}$/.test(password);
  };

  // Full form validation
  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      alert("All fields are required.");
      return false;
    }

    if (!validateEmail(formData.email)) {
      alert("Please enter a valid email address.");
      return false;
    }

    if (!validatePassword(formData.password)) {
      alert(
        "Password must be at least 8 characters long, include at least one digit, one uppercase letter, and one special character."
      );
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      handleSubmit(); // Call the parent handleSubmit
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      {/* Username Field */}
      <div className="mb-3 position-relative">
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="form-control"
          placeholder="Username"
          required
        />
        <span className="position-absolute" style={iconStyle}>
          <FaUser />
        </span>
      </div>

      {/* Email Field */}
      <div className="mb-3 position-relative">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="form-control"
          placeholder="Email"
          required
        />
        <span className="position-absolute" style={iconStyle}>
          <FaEnvelope />
        </span>
      </div>

      {/* Password Field */}
      <div className="mb-3 position-relative">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="form-control"
          placeholder="Password"
          required
        />
        <span
          className="position-absolute"
          style={iconStyle}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>

      {/* Confirm Password Field */}
      <div className="mb-3 position-relative">
        <input
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="form-control"
          placeholder="Confirm Password"
          required
        />
        <span
          className="position-absolute"
          style={iconStyle}
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>

      {/* Submit Button */}
      <div className="d-grid mb-3">
        <button
          type="submit"
          className="btn"
          style={{
            background: "linear-gradient(to right, #4f4fff, #8000ff)",
            color: "white",
            fontWeight: "bold",
          }}
        >
          Signup
        </button>
      </div>
    </form>
  );
};

// Icon Style for Inputs
const iconStyle = {
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  position: "absolute",
  cursor: "pointer",
  color: "black",
};

export default SignupForm;
