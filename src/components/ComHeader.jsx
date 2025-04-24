import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faUser, faTimes, faCrown } from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { Dropdown, Modal } from "react-bootstrap";
import logo from "../assets/vector.png";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const ComHeader = ({ isDarkMode, toggleDarkMode, setSelectedQuestion = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchResultsRef = useRef(null);
  const searchInputRef = useRef(null);
  const baseURL = import.meta.env.VITE_BACKEND_URL;
  
  // Pro subscription status
  const [isProSubscriber, setIsProSubscriber] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  
  // User detail modal states
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Get user role from localStorage
  const userRole = localStorage.getItem("userRole");
  
  // Check if we're on the admin dashboard path
  const isAdminDashboard = location.pathname === "/admindashboard" || location.pathname.includes("/admin");
  
  // Determine if user is admin from role or URL path
  const isAdmin = userRole === "admin" || isAdminDashboard;
  
  // Other visibility flags - updated to check if we're NOT on the admin dashboard
  const isUpdateProfileVisible = userRole === "student" && !isAdminDashboard;
  const isApplyForDeveloperVisible = userRole === "student" && !isAdminDashboard;
  const isSettingsVisible = !isAdminDashboard;
  const isProButtonVisible = userRole === "student" && !isAdminDashboard && !isProSubscriber;

  // Fetch Pro subscription status
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (userRole !== "student") return;
      
      setLoadingSubscription(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        console.log("Fetching subscription status..."); // Debug log
        const response = await fetch(`${baseURL}/api/subscription/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        console.log("Subscription API response status:", response.status); // Debug log
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }

        const data = await response.json();
        console.log("Subscription data received:", data); // Debug log
        
        if (data && data.isPro) {
          console.log("Setting user as Pro subscriber"); // Debug log
          setIsProSubscriber(true);
        } else {
          console.log("User is not a Pro subscriber"); // Debug log
          setIsProSubscriber(false);
        }
      } catch (error) {
        console.error("Error fetching subscription status:", error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchSubscriptionStatus();
  }, [userRole, baseURL]);

  const handleUpdateProfile = () => {
    navigate("/profilecompleteness");
  };

  const handleApplyForDeveloper = () => {
    navigate("/applydeveloper");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
    localStorage.removeItem("token");
    setTimeout(() => {
      setShowLogoutModal(false);
      navigate("/");
    }, 2000);
  };

  const handleProUpgrade = () => {
    navigate("/codeunitypro");
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      setIsSearching(true);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchResults(false);
    }
  };

  // Clear search input and results
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setShowSearchResults(false);
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchQuery.trim().length > 0) {
      setShowSearchResults(true);
    }
  };

  // Search for posts or users when query changes
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        if (isAdmin) {
          searchUsers(searchQuery);
        } else {
          searchPosts(searchQuery);
        }
      }
    }, 500); // Debounce search to avoid too many requests

    return () => clearTimeout(searchTimer);
  }, [searchQuery, isAdmin]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle searching for posts (for students and developers)
  const searchPosts = async (query) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await axios.get(`${baseURL}/api/discussion/search?query=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && Array.isArray(response.data)) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching posts:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle searching for users (for admin)
  const searchUsers = async (query) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await axios.get(`${baseURL}/api/admin/users/search?query=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && Array.isArray(response.data.users)) {
        setSearchResults(response.data.users);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch detailed user information
  const fetchUserDetails = async (userId) => {
    setLoadingUserDetails(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await axios.get(`${baseURL}/api/admin/users/${userId}/details`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data) {
        setUserDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Handle selecting a search result
  const handleSelectSearchResult = (result) => {
    setShowSearchResults(false);
    
    if (isAdmin) {
      // For admin: show user details modal
      setSelectedUser(result);
      fetchUserDetails(result._id);
      setShowUserDetailModal(true);
    } else {
      // For others: navigate to question
      clearSearch();
      navigate(`/question/${result._id}`, { 
        state: { 
          selectedQuestion: result 
        }
      });
    }
  };

  // Close the user detail modal
  const handleCloseUserDetailModal = () => {
    setShowUserDetailModal(false);
    setSelectedUser(null);
    setUserDetails(null);
  };

  // Highlight matching text in search results
  const highlightText = (text, query) => {
    if (!query.trim() || !text) return text;
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <span key={index} className="bg-warning">{part}</span> : part
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <header className={`sticky-top py-2 ${isDarkMode ? "bg-dark" : "bg-light"}`}>
        <div className="container-fluid d-flex justify-content-between align-items-center">
          {/* Left Section: Logo and Text */}
          <div className="d-flex align-items-center">
            <img src={logo} alt="Logo" className="me-2" style={{ width: "40px" }} />
            <div className="d-flex align-items-center">
              <span className={`fs-4 fw-bold ${isDarkMode ? "text-light" : "text-dark"}`}>
                CodeUnity
              </span>
              {isProSubscriber && (
                <span 
                  className="ms-1 px-2 py-0 rounded-pill fw-bold text-white d-flex align-items-center"
                  style={{
                    background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
                    fontSize: "14px"
                  }}
                >
                  <FontAwesomeIcon icon={faCrown} className="me-1" style={{ fontSize: "10px" }} />
                  PRO
                </span>
              )}
            </div>
          </div>

          {/* Center Section: Search Bar */}
          <div className="d-none d-md-flex align-items-center flex-grow-1 justify-content-center position-relative">
            <div
              className={`d-flex align-items-center border rounded-pill px-3 ${
                isDarkMode ? "bg-secondary text-light" : "bg-light text-dark"
              }`}
              style={{
                width: "50%",
                height: "40px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
              ref={searchInputRef}
            >
              <FontAwesomeIcon
                icon={faSearch}
                className={`me-2 ${isDarkMode ? "text-light" : "text-muted"}`}
              />
              <input
                type="text"
                className={`form-control border-0 bg-transparent ${
                  isDarkMode ? "text-light" : "text-dark"
                }`}
                placeholder={isAdmin ? "Search users..." : "Search discussions..."}
                style={{ boxShadow: "none" }}
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
              />
              {searchQuery && (
                <FontAwesomeIcon
                  icon={faTimes}
                  className={`ms-2 ${isDarkMode ? "text-light" : "text-muted"}`}
                  style={{ cursor: "pointer" }}
                  onClick={clearSearch}
                />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div 
                ref={searchResultsRef}
                className={`position-absolute mt-1 w-50 ${
                  isDarkMode ? "bg-dark" : "bg-white"
                } shadow rounded`}
                style={{ 
                  top: "100%", 
                  zIndex: 1000,
                  maxHeight: "400px",
                  overflowY: "auto",
                  border: isDarkMode ? "1px solid #6c757d" : "1px solid #dee2e6"
                }}
              >
                {isSearching ? (
                  <div className="p-3 text-center">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span className={isDarkMode ? "text-light" : ""}>Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div>
                    <div className="p-2 border-bottom">
                      <small className={`text-muted ${isDarkMode ? "text-light" : ""}`}>
                        Found {searchResults.length} results
                      </small>
                    </div>
                    {searchResults.map((result) => (
                      <div
                        key={result._id}
                        onClick={() => handleSelectSearchResult(result)}
                        className={`p-3 border-bottom ${
                          isDarkMode ? "text-light hover-dark" : "text-dark hover-light"
                        }`}
                        style={{ 
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? "#424649" : "#f8f9fa";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "";
                        }}
                      >
                        {isAdmin ? (
                          // User search result for admin
                          <>
                            <div className="fw-bold mb-1">
                              {highlightText(result.name, searchQuery)}
                            </div>
                            <div className="small">
                              {highlightText(result.email, searchQuery)}
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                              <small className={`badge ${result.role === "developer" ? "bg-primary" : result.role === "admin" ? "bg-danger" : "bg-success"}`}>
                                {result.role}
                              </small>
                              <small className={`badge ${result.status === "Active" ? "bg-success" : "bg-danger"}`}>
                                {result.status}
                              </small>
                            </div>
                          </>
                        ) : (
                          // Discussion search result for students and developers
                          <>
                            <div className="fw-bold mb-1">
                              {highlightText(result.question, searchQuery)}
                            </div>
                            <div className="small text-truncate">
                              {highlightText(result.description ? result.description.substring(0, 100) + "..." : "", searchQuery)}
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                              <small className="text-muted">
                                Posted by {result.author?.username || "Anonymous"}
                              </small>
                              <small className="text-muted">
                                {new Date(result.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center">
                    <span className={isDarkMode ? "text-light" : ""}>No results found</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Section: Pro Button, Logout Button and User Icon with Dropdown */}
          <div className="d-flex align-items-center">
            {/* CodeUnity Pro Button with Gradient - Only shown to students who aren't Pro subscribers */}
            {isProButtonVisible && (
              <button
                className="btn me-3 rounded-pill d-flex align-items-center"
                style={{
                  background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  fontWeight: "600",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                }}
                onClick={handleProUpgrade}
              >
                <FontAwesomeIcon icon={faCrown} className="me-2" />
                Try CodeUnity Pro
              </button>
            )}
            
            <button
              className={`btn me-2 ${isDarkMode ? "btn-light" : "btn-primary"}`}
              onClick={handleLogout}
            >
              Logout
            </button>
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="link"
                className="p-0 border-0 text-decoration-none"
              >
                <FontAwesomeIcon
                  icon={faUser}
                  className={`fs-4 ${isDarkMode ? "text-light" : "text-secondary"}`}
                />
              </Dropdown.Toggle>
              <Dropdown.Menu className={`${isDarkMode ? "bg-dark" : ""}`}>
                {isUpdateProfileVisible && (
                  <Dropdown.Item
                    className={`${isDarkMode ? "text-light hover-dark" : ""}`}
                    onClick={handleUpdateProfile}
                  >
                    Update Profile
                  </Dropdown.Item>
                )}
                {isApplyForDeveloperVisible && (
                  <Dropdown.Item
                    className={`${isDarkMode ? "text-light hover-dark" : ""}`}
                    onClick={handleApplyForDeveloper}
                  >
                    Apply for Developer
                  </Dropdown.Item>
                )}
                {isProButtonVisible && (
                  <Dropdown.Item
                    className={`${isDarkMode ? "text-light hover-dark" : ""}`}
                    onClick={handleProUpgrade}
                  >
                    <FontAwesomeIcon icon={faCrown} className="me-2 text-warning" />
                    Upgrade to Pro
                  </Dropdown.Item>
                )}
                <Dropdown.Item
                  className={`${isDarkMode ? "text-light hover-dark" : ""}`}
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? "Disable Dark Mode" : "Enable Dark Mode"}
                </Dropdown.Item>
                {isSettingsVisible && (
                  <Dropdown.Item
                    className={`${isDarkMode ? "text-light hover-dark" : ""}`}
                    onClick={handleSettings}
                  >
                    Settings
                  </Dropdown.Item>
                )}
                <Dropdown.Item
                  className={`${isDarkMode ? "text-light hover-dark" : ""}`}
                  onClick={handleLogout}
                >
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Logout Modal */}
      <Modal
        show={showLogoutModal}
        onHide={() => setShowLogoutModal(false)}
        backdrop="static"
        centered
      >
        <Modal.Body className="text-center">
          <h5 className="fw-bold">You've Been Logged Out</h5>
          <p>Please log back in.</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowLogoutModal(false)}
          >
            OK
          </button>
        </Modal.Body>
      </Modal>

      {/* User Detail Modal for Admin */}
      <Modal
        show={showUserDetailModal}
        onHide={handleCloseUserDetailModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingUserDetails ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading user details...</p>
            </div>
          ) : userDetails ? (
            <div>
              {/* User Basic Information */}
              <div className="row mb-4">
                <div className="col-md-4 text-center mb-3 mb-md-0">
                  <img 
                    src={userDetails.profilePicture || 'https://randomuser.me/api/portraits/men/1.jpg'} 
                    alt={userDetails.name}
                    className="rounded-circle img-thumbnail" 
                    style={{width: "150px", height: "150px", objectFit: "cover"}}
                  />
                </div>
                <div className="col-md-8">
                  <h4>{userDetails.name}</h4>
                  <p><strong>Email:</strong> {userDetails.email}</p>
                  <p><strong>Role:</strong> <span className={`badge ${userDetails.role === "developer" ? "bg-primary" : userDetails.role === "admin" ? "bg-danger" : "bg-success"}`}>
                    {userDetails.role}
                  </span></p>
                  <p><strong>Status:</strong> <span className={`badge ${userDetails.status === "Active" ? "bg-success" : "bg-danger"}`}>
                    {userDetails.status || "Active"}
                  </span></p>
                  <p><strong>Joined on:</strong> {formatDate(userDetails.createdAt)}</p>
                </div>
              </div>

              {/* User Details based on role */}
              <div className="row">
                {userDetails.role === "developer" && (
                  <>
                    <div className="col-12">
                      <div className="card mb-3">
                        <div className="card-header bg-primary text-white">
                          Developer Information
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-6">
                              <p><strong>Bio:</strong> {userDetails.bio || "Not provided"}</p>
                              <p><strong>Developer Type:</strong> {userDetails.developerType || "Not specified"}</p>
                              <p><strong>Degree:</strong> {userDetails.degree || "Not specified"}</p>
                              <p><strong>Discipline:</strong> {userDetails.discipline || "Not specified"}</p>
                            </div>
                            <div className="col-md-6">
                              <p><strong>Projects Link:</strong> {userDetails.projectsLink ? (
                                <a href={userDetails.projectsLink} target="_blank" rel="noopener noreferrer">
                                  {userDetails.projectsLink}
                                </a>
                              ) : "Not provided"}</p>
                              <p><strong>Programming Languages:</strong> {userDetails.programmingLanguages && userDetails.programmingLanguages.length > 0 
                                ? userDetails.programmingLanguages.join(", ") 
                                : "Not specified"}</p>
                              <p><strong>Experience:</strong> {userDetails.previousExperiences && userDetails.previousExperiences.length > 0 
                                ? `${userDetails.previousExperiences.length} years` 
                                : "Not specified"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Developer Orders */}
                    <div className="col-12">
                      <div className="card mb-3">
                        <div className="card-header bg-info text-white">
                          Orders & Revenue
                        </div>
                        <div className="card-body">
                          <p><strong>Total Revenue:</strong> {userDetails.revenue?.total 
                            ? `$${userDetails.revenue.total.toFixed(2)}` 
                            : "$0.00"}</p>
                          
                          {userDetails.orders && userDetails.orders.length > 0 ? (
                            <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
                              <table className="table table-striped table-sm">
                                <thead>
                                  <tr>
                                    <th>Order ID</th>
                                    <th>Project</th>
                                    <th>Client</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userDetails.orders.map((order, index) => (
                                    <tr key={index}>
                                      <td>{order._id}</td>
                                      <td>{order.projectTitle || "N/A"}</td>
                                      <td>{order.clientName || "Anonymous"}</td>
                                      <td>
                                        <span className={`badge ${
                                          order.status === "completed" ? "bg-success" : 
                                          order.status === "in progress" ? "bg-warning" : 
                                          "bg-secondary"
                                        }`}>
                                          {order.status || "pending"}
                                        </span>
                                      </td>
                                      <td>${order.amount?.toFixed(2) || "0.00"}</td>
                                      <td>{formatDate(order.date)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p>No orders found for this developer.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {userDetails.role === "student" && (
                  <>
                    <div className="col-12">
                      <div className="card mb-3">
                        <div className="card-header bg-success text-white">
                          Student Information
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-6">
                              <p><strong>Degree:</strong> {userDetails.degree || "Not specified"}</p>
                              <p><strong>Discipline:</strong> {userDetails.discipline || "Not specified"}</p>
                              <p><strong>Degree Start Date:</strong> {formatDate(userDetails.degreeStartDate)}</p>
                              <p><strong>Degree End Date:</strong> {formatDate(userDetails.degreeEndDate)}</p>
                            </div>
                            <div className="col-md-6">
                              <p><strong>Date of Birth:</strong> {formatDate(userDetails.dateOfBirth)}</p>
                              <p><strong>Total Spent:</strong> {userDetails.spendingOverview?.totalSpent 
                                ? `$${userDetails.spendingOverview.totalSpent.toFixed(2)}` 
                                : "$0.00"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Student Projects */}
                    <div className="col-12">
                      <div className="card mb-3">
                        <div className="card-header bg-primary text-white">
                          Projects
                        </div>
                        <div className="card-body">
                          {userDetails.projects && userDetails.projects.length > 0 ? (
                            <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
                              <table className="table table-striped table-sm">
                                <thead>
                                  <tr>
                                    <th>Project ID</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Developer</th>
                                    <th>Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userDetails.projects.map((project, index) => (
                                    <tr key={index}>
                                      <td>{project._id}</td>
                                      <td>{project.title || "N/A"}</td>
                                      <td>
                                        <span className={`badge ${
                                          project.status === "completed" ? "bg-success" : 
                                          project.status === "in progress" ? "bg-warning" : 
                                          "bg-secondary"
                                        }`}>
                                          {project.status || "pending"}
                                        </span>
                                      </td>
                                      <td>{project.developerName || "N/A"}</td>
                                      <td>{formatDate(project.date)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p>No projects found for this student.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Student Invoices */}
                    <div className="col-12">
                      <div className="card mb-3">
                        <div className="card-header bg-info text-white">
                          Invoices
                        </div>
                        <div className="card-body">
                          {userDetails.invoices && userDetails.invoices.length > 0 ? (
                            <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
                              <table className="table table-striped table-sm">
                                <thead>
                                  <tr>
                                    <th>Invoice ID</th>
                                    <th>Project</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userDetails.invoices.map((invoice, index) => (
                                    <tr key={index}>
                                      <td>{invoice._id}</td>
                                      <td>{invoice.projectTitle || "N/A"}</td>
                                      <td>${invoice.amount?.toFixed(2) || "0.00"}</td>
                                      <td>
                                        <span className={`badge ${
                                          invoice.status === "paid" ? "bg-success" : 
                                          invoice.status === "pending" ? "bg-warning" : 
                                          "bg-danger"
                                        }`}>
                                          {invoice.status || "unpaid"}
                                        </span>
                                      </td>
                                      <td>{formatDate(invoice.date)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p>No invoices found for this student.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Student Payment Methods */}
                    <div className="col-12">
                      <div className="card">
                        <div className="card-header bg-secondary text-white">
                          Payment Methods
                        </div>
                        <div className="card-body">
                          {userDetails.paymentMethods && userDetails.paymentMethods.length > 0 ? (
                            <div className="row">
                              {userDetails.paymentMethods.map((method, index) => (
                                <div className="col-md-4 mb-3" key={index}>
                                  <div className="card h-100">
                                    <div className={`card-header text-white ${
                                      method.cardType === "visa" ? "bg-primary" : 
                                      method.cardType === "mastercard" ? "bg-danger" : 
                                      "bg-dark"
                                    }`}>
                                      {method.cardType.toUpperCase()}
                                      </div>
                                    <div className="card-body">
                                      <p className="card-text">
                                        <strong>Name:</strong> {method.name || "N/A"}
                                      </p>
                                      <p className="card-text">
                                        <strong>Card Number:</strong> **** **** **** {method.cardNumber.slice(-4)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p>No payment methods found for this student.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    </>
                )}
              </div>
            </div>
          ) : (
            <div className="alert alert-warning">
              No user details found. Try searching again.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={handleCloseUserDetailModal}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ComHeader;