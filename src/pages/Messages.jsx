import React, { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import HelpButton from '../components/HelpButton';
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

// Lazy Load Components
const StudentMessages = lazy(() => import("../components/StudentMessages"));
const DeveloperMessages = lazy(() => import("../components/DevelopersMessages"));

const Messages = () => {
  const [role, setRole] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (response.data) {
          let userRole = response.data.role.toLowerCase(); // Normalize role case
          console.log("✅ Retrieved Role:", userRole); // Debugging
          setRole(userRole);
        } else {
          navigate("/login"); // Redirect if not authenticated
        }
      } catch (error) {
        console.error("❌ Error fetching user profile:", error);
        navigate("/login");
      }
    };

    fetchUserRole();
  }, [navigate]);

  // Listen for dark mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsDarkMode(localStorage.getItem("darkMode") === "true");
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Suspense fallback={<p>Loading messages...</p>}>
      {role === "student" ? <StudentMessages isDarkMode={isDarkMode} /> : role === "developer" ? <DeveloperMessages isDarkMode={isDarkMode} /> : null}
      {/* Help Button */}
      <HelpButton />
    </Suspense>
  );
};

export default Messages;
