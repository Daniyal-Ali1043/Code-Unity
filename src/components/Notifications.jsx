import React, { useState, useEffect } from "react";
import { Container, Row, Col, ListGroup, Button, Badge } from "react-bootstrap";
import axios from "axios";
import Pusher from 'pusher-js';
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton"; 
import "react-loading-skeleton/dist/skeleton.css"; 

// Define the base URL using the environment variable from Vite
const baseUrl = import.meta.env.VITE_BACKEND_URL;

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true // This is critical for sending cookies with requests
});

// Add auth token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to update badge across components
const updateNotificationBadge = (count) => {
  // Update localStorage
  localStorage.setItem("unreadNotifications", count);
  
  // Dispatch a custom event that ComSidebar can listen for
  const event = new CustomEvent('notificationCountUpdated', { 
    detail: { count } 
  });
  window.dispatchEvent(event);
  
  console.log(`📣 Dispatched notification count update: ${count}`);
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState(""); // Using state to track role
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const [pusherConnected, setPusherConnected] = useState(false);
  const [developerUserId, setDeveloperUserId] = useState(null); // Store the actual developer userId
  
  // Add state to detect dark mode
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true" || 
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Detect changes in dark mode setting
  useEffect(() => {
    // Function to handle changes to localStorage
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };

    // Listen for storage events (when other components change darkMode)
    window.addEventListener("storage", handleStorageChange);
    
    // Also set up a custom event listener for theme changes within the app
    window.addEventListener("themeChanged", (event) => {
      setDarkMode(event.detail.darkMode);
    });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChanged", handleStorageChange);
    };
  }, []);

  // ✅ First, fetch user data to get the correct role - similar to ComSidebar
  const fetchUserData = async () => {
    try {
      // Use the profile endpoint to get user data with our configured axios instance
      const response = await api.get("/api/users/profile");
      
      if (response.status === 200) {
        console.log("✅ Fetched user profile:", response.data);
        const { role, username, _id } = response.data;
        
        // Set the role and username in state
        setRole(role || "student");
        setUsername(username || "");
        
        // Also update localStorage for consistency
        localStorage.setItem("role", role || "student");
        localStorage.setItem("userId", _id);
        
        // For developers, we need to fetch their developer ID
        if (role === "developer") {
          try {
            const devResponse = await api.get("/api/developers/profile");
            if (devResponse.status === 200 && devResponse.data._id) {
              setDeveloperUserId(devResponse.data._id);
              console.log("✅ Developer ID fetched:", devResponse.data._id);
            }
          } catch (devError) {
            console.error("❌ Error fetching developer profile:", devError);
          }
        }
        
        return { role, userId: _id };
      }
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      // Default to student if there's an error
      setRole("student");
      localStorage.setItem("role", "student");
      return { role: "student", userId };
    }
  };

  // First useEffect to fetch user data
  useEffect(() => {
    const setupUserAndData = async () => {
      const userData = await fetchUserData();
      
      // Fetch notifications only after we have user data
      if (userData && userData.userId) {
        fetchNotifications(userData.userId, userData.role);
      }
      
      // Simulate a loading delay for skeleton
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };
    
    setupUserAndData();
  }, []);

  // Fetch notifications based on user role
  const fetchNotifications = (id, userRole) => {
    if (!id) return;
    
    console.log("🔍 Current Role from state:", userRole);
    
    // ✅ Determine endpoint based on the role from state
    const endpoint = 
      userRole === "developer" 
        ? `/api/notifications/developer/${id}` 
        : `/api/notifications/${id}`;
    
    console.log("🔍 Using endpoint:", endpoint);

    // Fetch initial notifications
    api.get(endpoint)
      .then((res) => {
        console.log("✅ Fetched Notifications:", res.data);
        setNotifications(res.data);
        const newUnreadCount = res.data.filter((notif) => !notif.isRead).length;
        setUnreadCount(newUnreadCount);
        
        // Update badge across components
        updateNotificationBadge(newUnreadCount);
      })
      .catch((err) => console.error("❌ Error fetching notifications:", err));
  };

  // Setup Pusher for real-time notifications
  useEffect(() => {
    if (!userId || !role) return;

    let channelName = `notifications-${userId}`;
    
    // For developers, we need to set up notification subscriptions differently
    const setupPusherForDeveloper = async () => {
      if (role === "developer") {
        try {
          const devResponse = await api.get("/api/developers/profile");
          if (devResponse.status === 200 && devResponse.data._id) {
            setDeveloperUserId(devResponse.data._id);
            // Use the developer ID for notifications channel
            channelName = `notifications-${devResponse.data._id}`;
            console.log("🔌 Developer using channel:", channelName);
            setupPusherConnection(channelName);
          }
        } catch (error) {
          console.error("❌ Error setting up developer Pusher:", error);
          // Fall back to regular channel
          setupPusherConnection(channelName);
        }
      } else {
        // For students, just use the regular channel
        setupPusherConnection(channelName);
      }
    };
    
    // Function to set up the Pusher connection
    const setupPusherConnection = (channel) => {
      // Initialize Pusher with your app key
      const pusher = new Pusher('c04d171d7e5f8f9fd830', {
        cluster: 'ap2',
        encrypted: true,
        authEndpoint: `${import.meta.env.VITE_BACKEND_URL}/pusher/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      });
      
      console.log("🔌 Subscribing to Pusher notifications channel:", channel);
      
      // Subscribe to the channel
      const pusherChannel = pusher.subscribe(channel);
      
      // Add connection event handlers
      pusher.connection.bind('connected', () => {
        console.log('✅ Pusher connected successfully for notifications');
        setPusherConnected(true);
      });
      
      pusher.connection.bind('error', (err) => {
        console.error('❌ Pusher connection error for notifications:', err);
        setPusherConnected(false);
      });
      
      // Listen for new notifications
      pusherChannel.bind('new-notification', (data) => {
        console.log('📥 New notification received:', data);
        
        // Update notifications state
        setNotifications(prevNotifications => {
          // Check if notification already exists
          const notificationExists = prevNotifications.some(notif => notif._id === data._id);
          if (notificationExists) return prevNotifications;
          
          // Add new notification at the beginning of the list
          return [data, ...prevNotifications];
        });
        
        // Update unread count
        setUnreadCount(prevCount => {
          const newCount = prevCount + 1;
          
          // Update badge across components
          updateNotificationBadge(newCount);
          
          return newCount;
        });
      });
      
      // Return cleanup function
      return () => {
        console.log("🧹 Cleaning up Pusher connection");
        pusherChannel.unbind_all();
        pusher.unsubscribe(channel);
        pusher.disconnect();
      };
    };
    
    // Run the setup
    const cleanup = setupPusherForDeveloper();
    
    // Return cleanup function
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
    
  }, [userId, role]);

  // ✅ Mark Notification as Read
  const markAsRead = (id) => {
    api.put(`/api/notifications/mark-read/${id}`)
      .then(() => {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === id ? { ...notif, isRead: true } : notif
          )
        );
        
        const updatedCount = Math.max(0, unreadCount - 1);
        setUnreadCount(updatedCount);
        
        // Update badge across components
        updateNotificationBadge(updatedCount);
      })
      .catch((err) =>
        console.error("❌ Error marking notification as read:", err)
      );
  };

  // ✅ Mark All Notifications as Read - Updated for both roles
  const markAllAsRead = () => {
    // Determine the correct ID to use for the API call
    const targetId = role === "developer" && developerUserId ? developerUserId : userId;
    
    console.log(`🔍 Mark All Read: Using ID ${targetId} for role ${role}`);
    
    api.put(`/api/notifications/mark-all-read/${targetId}`)
      .then((response) => {
        console.log("✅ Mark all as read response:", response.data);
        
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
        
        // Update badge across components
        updateNotificationBadge(0);
      })
      .catch((err) =>
        console.error("❌ Error marking all notifications as read:", err)
      );
  };

  // ✅ Delete a Notification
  const deleteNotification = (id) => {
    api.delete(`/api/notifications/${id}`)
      .then(() => {
        // First check if the notification was unread
        const deletedNotif = notifications.find(notif => notif._id === id);
        const wasUnread = deletedNotif && !deletedNotif.isRead;
        
        // Update notifications state
        setNotifications((prev) => prev.filter((notif) => notif._id !== id));
        
        // If the deleted notification was unread, decrement the count
        if (wasUnread) {
          const updatedCount = Math.max(0, unreadCount - 1);
          setUnreadCount(updatedCount);
          
          // Update badge across components
          updateNotificationBadge(updatedCount);
        }
      })
      .catch((err) => console.error("❌ Error deleting notification:", err));
  };

  // ✅ Clear All Notifications - Updated for both roles
  const clearAllNotifications = () => {
    // Determine the correct ID to use for the API call
    const targetId = role === "developer" && developerUserId ? developerUserId : userId;
    
    console.log(`🔍 Clear All: Using ID ${targetId} for role ${role}`);
    
    api.delete(`/api/notifications/clear/${targetId}`)
      .then((response) => {
        console.log("✅ Clear all notifications response:", response.data);
        
        setNotifications([]);
        setUnreadCount(0);
        
        // Update badge across components
        updateNotificationBadge(0);
      })
      .catch((err) => console.error("❌ Error clearing notifications:", err));
  };

  // ✅ Redirect to Messages on Click
  const handleNotificationClick = (notif) => {
    // Make sure we have a valid sender ID before navigating
    if (notif.senderId && notif.senderId._id) {
      navigate(`/inbox?user=${notif.senderId._id}`);
      markAsRead(notif._id);
    } else if (typeof notif.senderId === 'string') {
      // If senderId is just a string (ID only), use that
      navigate(`/inbox?user=${notif.senderId}`);
      markAsRead(notif._id);
    } else {
      console.error("Cannot navigate: invalid sender ID", notif);
    }
  };

  // Helper function to render sender name
  const renderSenderName = (notif) => {
    const { senderId } = notif;
    
    // Check if senderId is null
    if (!senderId) return "Unknown Sender";
    
    // If senderId is just a string (ID only)
    if (typeof senderId === 'string') return "User";
    
    // For developer view, show student's username
    if (role === "developer") {
      return senderId.username || "User";
    } 
    
    // For student view, show developer's name
    if (senderId.firstName && senderId.lastName) {
      return `${senderId.firstName} ${senderId.lastName}`;
    }
    
    // Fallback to username if available
    if (senderId.username) return senderId.username;
    
    // Final fallback
    return "User";
  };

  // Function to refresh notifications manually
  const refreshNotifications = () => {
    if (role === "developer" && developerUserId) {
      fetchNotifications(developerUserId, role);
    } else {
      fetchNotifications(userId, role);
    }
  };

  // Generate dynamic styles based on dark mode
  const getStyles = () => {
    return {
      container: {
        color: darkMode ? '#fff' : '#212529',
      },
      heading: {
        color: darkMode ? '#fff' : '#212529',
      },
      smallText: {
        color: darkMode ? '#adb5bd' : '#6c757d', 
      },
      listItem: (isRead) => ({
        backgroundColor: isRead 
          ? (darkMode ? 'rgba(52, 58, 64, 0.3)' : 'transparent')
          : (darkMode ? 'rgba(13, 110, 253, 0.2)' : 'rgba(13, 110, 253, 0.05)'),
        color: darkMode ? '#fff' : '#212529',
        borderColor: darkMode ? '#495057' : '#dee2e6',
      }),
      noNotifications: {
        color: darkMode ? '#adb5bd' : '#6c757d',
      }
    };
  };

  const styles = getStyles();

  // Configure Skeleton theme for dark mode
  useEffect(() => {
    // Set Skeleton theme inline if needed
    if (darkMode) {
      document.documentElement.style.setProperty('--skeleton-base-color', '#333');
      document.documentElement.style.setProperty('--skeleton-highlight-color', '#444');
    } else {
      document.documentElement.style.setProperty('--skeleton-base-color', '#ebebeb');
      document.documentElement.style.setProperty('--skeleton-highlight-color', '#f5f5f5');
    }
  }, [darkMode]);

  return (
    <Container fluid className="mt-4 pb-5" style={styles.container}>
      <Row>
        <Col>
          {/* Centered Heading */}
          <h3 className="text-center" style={styles.heading}>Notifications</h3>
          
          {/* ✅ DEBUGGING: Display role for testing - can be removed later */}
          <div className="text-center mb-2" style={styles.smallText}>
            <small>Current role: {role || "Not set"}</small>
            {pusherConnected && (
              <span className="ms-2 badge bg-success">Realtime Connected</span>
            )}
            {role === "developer" && developerUserId && (
              <span className="ms-2 small" style={styles.smallText}>Developer ID: {developerUserId.substring(0, 8)}...</span>
            )}
            <Button 
              variant={darkMode ? "dark" : "link"}
              className={`${darkMode ? 'text-light' : 'text-muted'} p-0 ms-2`}
              style={{ fontSize: '0.8rem', textDecoration: 'none' }}
              onClick={refreshNotifications}
            >
              <small>⟳ Refresh</small>
            </Button>
          </div>
          
          <div className="d-flex justify-content-between mb-3">
            <Button 
              variant={darkMode ? "outline-light" : "outline-primary"}
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All as Read
            </Button>
            <Button 
              variant={darkMode ? "outline-danger" : "outline-danger"}
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              Clear All
            </Button>
          </div>
          <ListGroup>
            {loading ? (
              // Skeleton Loading Placeholder
              Array.from({ length: 5 }).map((_, index) => (
                <ListGroup.Item
                  key={index}
                  className="d-flex justify-content-between align-items-center"
                  style={{ 
                    backgroundColor: darkMode ? '#343a40' : '', 
                    borderColor: darkMode ? '#495057' : ''
                  }}
                >
                  <div>
                    <Skeleton width={150} height={20} className="mb-1" />
                    <Skeleton width={100} height={15} />
                  </div>
                  <div>
                    <Skeleton width={80} height={30} />
                  </div>
                </ListGroup.Item>
              ))
            ) : notifications.length === 0 ? (
              <p className="text-center py-4" style={styles.noNotifications}>No notifications</p>
            ) : (
              notifications.map((notif) => (
                <ListGroup.Item
                  key={notif._id}
                  className="d-flex justify-content-between align-items-center"
                  onClick={() => handleNotificationClick(notif)}
                  style={{ 
                    cursor: "pointer",
                    ...styles.listItem(notif.isRead)
                  }}
                >
                  <div>
                    <strong>
                      {renderSenderName(notif)}
                    </strong>{" "}
                    sent you a message
                    <br />
                    <small style={styles.smallText}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <div>
                    {!notif.isRead && <Badge bg="danger">Unread</Badge>}
                    {!notif.isRead && (
                      <Button
                        size="sm"
                        variant={darkMode ? "outline-light" : "outline-primary"}
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif._id);
                        }}
                        className="mx-1"
                      >
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif._id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
          
          {/* Display total notification count */}
          {!loading && notifications.length > 0 && (
            <div className="text-end mt-2" style={styles.smallText}>
              <small>
                Total: {notifications.length} | Unread: {unreadCount}
              </small>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Notifications;