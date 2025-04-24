import React, { useState } from "react";
import { Link } from "react-router-dom"; // Import Link for routing
import bgLogo from "../assets/vector.png"; // Assuming this is the correct path for your logo
import '@fortawesome/fontawesome-free/css/all.min.css'; // Importing Font Awesome

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to control mobile menu visibility

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen); // Toggle the menu visibility
  };

  return (
    <header className="bg-light py-3 border-bottom">
      <div className="container-fluid d-flex align-items-center justify-content-between px-0">
        {/* Logo Section */}
        <div className="d-flex align-items-center ms-3">
          <img src={bgLogo} alt="Logo" className="me-2" style={{ width: '40px', height: '40px' }} />
          <span className="fs-4 fw-bold text-primary">CodeUnity</span>
        </div>

        {/* Search Bar (Hidden on Mobile) */}
        <div className="d-flex flex-grow-1 mx-3 d-none d-lg-flex" style={{ maxWidth: '600px', marginLeft: '20px', marginRight: '20px' }}>
          <div className="input-group">
            <input
              type="text"
              className="form-control border-end-0"
              placeholder="What service are you looking for today?"
              style={{ paddingLeft: '20px', paddingRight: '20px' }}
            />
            <button className="btn btn-outline-secondary border-start-0" style={{ backgroundColor: 'black', color: 'white' }}>
              <i className="fas fa-search" style={{ color: 'white' }}></i> {/* Make icon white */}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="d-flex align-items-center d-none d-lg-flex me-3">
          <a href="#" className="text-decoration-none me-3 text-dark">
            CodeUnity Pro
          </a>
          <a href="#" className="text-decoration-none me-3 text-dark">
            Explore
          </a>
          <a href="#" className="text-decoration-none me-3 text-dark">
            English
          </a>
          <Link to="/login" className="text-decoration-none me-3 text-dark">
            Become a Developer
          </Link>
          <Link to="/login" className="text-decoration-none me-3 text-dark">
            Sign in
          </Link>
          <Link to="/signup">
            <button className="btn btn-success ms-3">Join</button>
          </Link>
        </div>

        {/* Mobile Menu Icon (Visible on Mobile) */}
        <div className="d-flex d-lg-none">
          <button onClick={handleMenuToggle} className="btn btn-light">
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu bg-light p-3 d-lg-none">
          <div className="d-flex flex-column">
            <Link to="/login" className="text-decoration-none text-dark py-2">Sign in</Link>
            <Link to="#" className="text-decoration-none text-dark py-2">Browse Categories</Link>
            <Link to="#" className="text-decoration-none text-dark py-2">Explore</Link>
            <Link to="/login" className="text-decoration-none text-dark py-2">Become a Developer</Link>
            <Link to="/signup" className="text-decoration-none text-dark py-2">Join</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
