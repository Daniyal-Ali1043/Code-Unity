import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faMessage,
  faBell,
  faChartSimple,
  faComments,
  faCamera,
  faShoppingBag, // Added icon for orders
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import profileBg from "../assets/silver1.jpeg";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Skeleton from "react-loading-skeleton"; // Import Skeleton
import "react-loading-skeleton/dist/skeleton.css"; // Import Skeleton CSS
import Pusher from 'pusher-js';

const baseURL = import.meta.env.VITE_BACKEND_URL;

const ComSidebar = ({ isDarkMode }) => {
  const [username, setUsername] = useState("Loading...");
  const [role, setRole] = useState("user");
  const [profilePicture, setProfilePicture] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const fetchUserData = async (currentToken) => {
    if (!currentToken) {
      setUsername("Guest");
      setRole("user");
      setProfilePicture("");
      localStorage.setItem("userRole", "User");
      return;
    }

    try {
      const userRole = localStorage.getItem("userRole");
      const profileEndpoint =
        userRole === "developer"
          ? `${baseURL}/api/developers/profile`
          : `${baseURL}/api/users/profile`;

      const response = await axios.get(profileEndpoint, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (response.status === 200) {
        const { firstName, lastName, profilePicture, role, _id } = response.data;
        setUsername(`${firstName} ${lastName}`.trim());
        setRole(role || "student");
        setProfilePicture(profilePicture || "");
        localStorage.setItem("userRole", role || "Student");
        
        // Save user ID to localStorage
        if (_id) {
          localStorage.setItem("userId", _id);
        }
        
        return { userId: _id, userRole: role };
      }
    } catch (error) {
      console.error("No profile found for user.", error);
      setUsername("Guest");
      setRole("user");
      setProfilePicture("");
      localStorage.setItem("userRole", "User");
    }
  };

  // Fetch unread notifications count
  const fetchUnreadNotifications = async (id) => {
    if (!id) return;
    
    try {
      const endpoint = role === "developer" 
        ? `${baseURL}/api/notifications/developer/${id}`
        : `${baseURL}/api/notifications/${id}`;
        
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        const unread = response.data.filter(notif => !notif.isRead).length;
        setUnreadCount(unread);
        localStorage.setItem("unreadNotifications", unread);
        console.log(`✅ Fetched unread notifications: ${unread}`);
      }
    } catch (error) {
      console.error("❌ Error fetching unread notifications:", error);
    }
  };

  // Setup Pusher for notification updates
  useEffect(() => {
    if (!userId) return;
    
    // Initialize Pusher
    const pusher = new Pusher('c04d171d7e5f8f9fd830', {
      cluster: 'ap2',
      encrypted: true,
      authEndpoint: `${baseURL}/pusher/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Listen to the notifications channel
    const channelName = `notifications-${userId}`;
    const channel = pusher.subscribe(channelName);
    
    // Handle new notification
    channel.bind('new-notification', (data) => {
      console.log("📱 Sidebar received new notification");
      setUnreadCount(prev => {
        const newCount = prev + 1;
        localStorage.setItem("unreadNotifications", newCount);
        return newCount;
      });
    });

    // Create a custom event listener for notification count updates
    const updateNotificationCount = (e) => {
      if (e.key === "unreadNotifications") {
        console.log(`📱 Sidebar detected unread count change: ${e.newValue}`);
        setUnreadCount(parseInt(e.newValue) || 0);
      }
    };

    // Listen for localStorage changes
    window.addEventListener("storage", updateNotificationCount);
    
    // Listen for custom events from Notifications component
    const handleNotificationRead = (e) => {
      if (e.detail && typeof e.detail.count === 'number') {
        console.log(`📱 Sidebar received notification count update: ${e.detail.count}`);
        setUnreadCount(e.detail.count);
        localStorage.setItem("unreadNotifications", e.detail.count);
      }
    };
    
    window.addEventListener('notificationCountUpdated', handleNotificationRead);
    
    return () => {
      // Clean up
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      window.removeEventListener("storage", updateNotificationCount);
      window.removeEventListener('notificationCountUpdated', handleNotificationRead);
    };
  }, [userId, token, role]);

  useEffect(() => {
    const initializeData = async () => {
      const userData = await fetchUserData(token);
      if (userData && userData.userId) {
        fetchUnreadNotifications(userData.userId);
      } else {
        fetchUnreadNotifications(userId);
      }

      // Simulate a delay before hiding the skeleton loading
      setTimeout(() => {
        setLoading(false);
      }, 1500); 
    };
    
    initializeData();

    // Listen for token changes
    const tokenChangeListener = () => {
      const updatedToken = localStorage.getItem("token");
      setToken(updatedToken);
      fetchUserData(updatedToken);
    };

    window.addEventListener("storage", tokenChangeListener);
    return () => window.removeEventListener("storage", tokenChangeListener);
  }, [token]);

  // Check for notification count in localStorage
  useEffect(() => {
    const storedCount = localStorage.getItem("unreadNotifications");
    if (storedCount !== null) {
      setUnreadCount(parseInt(storedCount));
    }
  }, []);

  const formatRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append("profilePicture", selectedImage);

    try {
      const response = await axios.post(
        `${baseURL}/api/users/upload-profile-picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        setProfilePicture(response.data.profilePicture);
        setShowModal(false);
        toast.success("Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Failed to update profile picture.");
    }
  };

  // Navigate to the appropriate orders page based on user role
  const navigateToOrders = () => {
    if (role.toLowerCase() === "student") {
      navigate("/studentorders");
    } else if (role.toLowerCase() === "developer") {
      navigate("/developerorders");
    }
  };

  return (
    <aside
      className={`d-none d-lg-block shadow-sm ${
        isDarkMode ? "bg-dark text-light" : "bg-light text-dark"
      }`}
      style={{ width: "300px", height: "calc(100vh - 120px)", margin: "24px" }}
    >
      <div className="text-center position-relative">
        {/* Background image */}
        <img
          src={profileBg}
          alt="Profile Background"
          className="img-fluid"
          style={{ width: "100%", height: "120px", objectFit: "cover" }}
        />

        {/* Container for profile image & camera button */}
        <div
          className="position-absolute"
          style={{
            top: "70px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90px",
            height: "90px",
          }}
        >
          {loading ? (
            <Skeleton circle width={90} height={90} />
          ) : (
            <div className="position-relative">
              <img
                src={profilePicture || "https://via.placeholder.com/90"}
                alt="Profile"
                className="rounded-circle border border-3 border-white w-100 h-100"
                style={{ objectFit: "cover" }}
              />
              
              <button
                className={`btn ${
                  isDarkMode ? "btn-dark" : "btn-primary"
                } rounded-circle position-absolute d-flex align-items-center justify-content-center`}
                style={{
                  width: "30px",
                  height: "30px",
                  bottom: "3px",
                  right: "3px",
                  fontSize: "0.8rem",
                  zIndex: 2
                }}
                onClick={() => setShowModal(true)}
              >
                <FontAwesomeIcon icon={faCamera} />
              </button>
            </div>
          )}
        </div>

        <div className="mt-5">
          {loading ? (
            <>
              <Skeleton width={150} height={20} className="mb-2" />
              <Skeleton width={100} height={15} />
            </>
          ) : (
            <>
              <p className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>
                {username}
              </p>
              <p className={`small ${isDarkMode ? "text-light" : "text-muted"}`}>
                {formatRole(role)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4">
        <ul className="list-unstyled">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <li
                key={index}
                className={`d-flex align-items-center px-4 py-2 ${
                  isDarkMode ? "text-light" : "text-dark"
                }`}
              >
                <Skeleton width={20} height={20} className="me-3" />
                <Skeleton width={100} height={15} />
              </li>
            ))
          ) : (
            <>
              <li
                className={`d-flex align-items-center px-4 py-2 ${
                  isDarkMode ? "text-light" : "text-dark"
                }`}
                onClick={() =>
                  navigate(
                    role.toLowerCase() === "student"
                      ? "/studentdashboard"
                      : "/developerdashboard"
                  )
                }
                style={{ cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faHouse} className="me-3" />
                Home
              </li>
              <li
                className={`d-flex align-items-center px-4 py-2 ${
                  isDarkMode ? "text-light" : "text-dark"
                }`}
                onClick={() => navigate("/inbox")}
                style={{ cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faMessage} className="me-3" />
                Messages
              </li>
              <li
                className={`d-flex align-items-center px-4 py-2 ${
                  isDarkMode ? "text-light" : "text-dark"
                } position-relative`}
                onClick={() => navigate("/notifications")}
                style={{ cursor: "pointer" }}
              >
                <div className="position-relative d-inline-block">
                  <FontAwesomeIcon icon={faBell} className="me-3" />
                  {unreadCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
                      style={{ width: "10px", height: "10px", left: "-15px" }}
                    ></span>
                  )}
                </div>
                Notifications
                {unreadCount > 0 && (
                  <span className="badge bg-danger rounded-pill ms-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </li>
              <li
                className={`d-flex align-items-center px-4 py-2 ${
                  isDarkMode ? "text-light" : "text-dark"
                }`}
                onClick={() =>
                  navigate(
                    role.toLowerCase() === "student"
                      ? "/studentdashboardcontent"
                      : "/developerdashboard"
                  )
                }                style={{ cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faChartSimple} className="me-3" />
                Dashboard
              </li>
              <li
                className={`d-flex align-items-center px-4 py-2 ${
                  isDarkMode ? "text-light" : "text-dark"
                }`}
                onClick={() => navigate("/discussionforum")}
                style={{ cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faComments} className="me-3" />
                Discussion Forum
              </li>
              {/* New Orders Button */}
              <li
                className={`d-flex align-items-center px-4 py-2 ${
                  isDarkMode ? "text-light" : "text-dark"
                }`}
                onClick={navigateToOrders}
                style={{ cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faShoppingBag} className="me-3" />
                Orders
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        className={isDarkMode ? "dark-modal" : ""}
      >
        <Modal.Header
          closeButton
          className={isDarkMode ? "bg-dark text-light" : ""}
        >
          <Modal.Title>Update Profile Picture</Modal.Title>
        </Modal.Header>
        <Modal.Body className={`text-center ${isDarkMode ? "bg-dark text-light" : ""}`}>
          <img
            src={previewImage || profilePicture || "https://via.placeholder.com/150"}
            alt="Profile Preview"
            className="rounded-circle mb-3 mx-auto d-block"
            style={{ width: "150px", height: "150px", objectFit: "cover" }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className={`form-control mb-3 ${isDarkMode ? "bg-dark text-light" : ""}`}
          />
          <Button variant={isDarkMode ? "secondary" : "primary"} onClick={handleUpload}>
            Upload
          </Button>
        </Modal.Body>
      </Modal>

      <ToastContainer />
    </aside>
  );
};

export default ComSidebar;