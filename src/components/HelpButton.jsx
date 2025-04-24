import React, { useState } from 'react';
import { FaQuestion } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HelpButton = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const buttonStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#1976d2',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    border: 'none',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  };

  const tooltipStyle = {
    position: 'absolute',
    bottom: '60px',
    right: '0',
    width: '200px',
    padding: '10px',
    backgroundColor: 'white',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '5px',
    display: showTooltip ? 'block' : 'none',
    zIndex: 1001
  };

  const dropdownStyle = {
    position: 'absolute',
    bottom: '60px',
    right: '0',
    width: '200px',
    backgroundColor: 'white',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    borderRadius: '5px',
    display: showDropdown ? 'block' : 'none',
    zIndex: 1001,
    overflow: 'hidden'
  };

  const dropdownItemStyle = {
    display: 'block',
    padding: '12px 16px',
    textDecoration: 'none',
    color: '#333',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    fontSize: '14px',
    fontWeight: '500'
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleOptionClick = (path) => {
    setShowDropdown(false);
    navigate(path);
  };

  const handleDocumentClick = (e) => {
    if (showDropdown && !e.target.closest('.help-button-container')) {
      setShowDropdown(false);
    }
  };

  // Add event listener to close dropdown when clicking outside
  React.useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [showDropdown]);

  return (
    <div className="help-button-container">
      <button
        style={buttonStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label="Help"
        title="Help options"
        className="help-button"
      >
        <FaQuestion size={24} />
      </button>
      <div style={tooltipStyle}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Get help or submit a complaint
        </p>
      </div>
      <div style={dropdownStyle}>
        <div 
          style={dropdownItemStyle} 
          onClick={() => handleOptionClick('/faq')}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          <FaQuestion style={{ marginRight: '8px' }} />
          Frequently Asked Questions
        </div>
        <div 
          style={dropdownItemStyle} 
          onClick={() => handleOptionClick('/complaint')}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          <span style={{ marginRight: '8px' }}>🔔</span>
          Submit a Complaint
        </div>
      </div>
    </div>
  );
};

export default HelpButton; 