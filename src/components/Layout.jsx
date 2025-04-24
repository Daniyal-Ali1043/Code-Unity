import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ComHeader from "./ComHeader";
import ComSidebar from "./ComSidebar";
import AvailableDevelopers from "./AvailableDevelopers";
import HelpButton from "./HelpButton";
import Notifications from "./Notifications";
import DiscussionForum from "../pages/DiscussionForum";
import AskQuestion from "../components/Askquestion";
import MyAnswers from "../pages/MyAnswers";
import StudentOrders from "./StudentOrders";
import DeveloperDashboard from "../pages/DeveloperDashboard";
import DeveloperMessages from "./DevelopersMessages";
import DeveloperOrders from "./DeveloperOrders"; // Import the DeveloperOrders component

const Layout = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("bg-dark", "text-light");
      document.body.classList.remove("bg-light", "text-dark");
      localStorage.setItem("theme", "dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.body.classList.add("bg-light", "text-dark");
      document.body.classList.remove("bg-dark", "text-light");
      localStorage.setItem("theme", "light");
      localStorage.setItem("darkMode", "false");
    }
    
    // Dispatch an event for components that listen to theme changes
    window.dispatchEvent(new CustomEvent("themeChanged", { 
      detail: { darkMode: isDarkMode } 
    }));
  }, [isDarkMode]);

  const location = useLocation();

  // Function to check if the current route matches specific routes
  const isAvailableDevelopersRoute = location.pathname === "/studentdashboard";
  const isNotificationsRoute = location.pathname === "/notifications";
  const isDiscussionForumRoute = location.pathname === "/discussionforum";
  const isAskQuestionRoute = location.pathname === "/ask";
  const isQuestionViewRoute = location.pathname.startsWith("/question/");
  const isMyAnswersRoute = location.pathname === "/myqna";
  const isStudentOrdersRoute = location.pathname === "/studentorders";
  const isStudentOrderDetailRoute = location.pathname.startsWith("/studentorders/") && location.pathname !== "/studentorders";
  const isDeveloperDashboardRoute = location.pathname === "/developerdashboard";
  const isDeveloperMessagesRoute = location.pathname === "/messages";
  const isDeveloperOrdersRoute = location.pathname === "/developerorders"; // Add this line for DeveloperOrders

  // Generate styles based on dark mode
  const styles = {
    container: {
      backgroundColor: isDarkMode ? '#212529' : 'inherit',
      minHeight: '100vh'
    },
    mainContent: {
      backgroundColor: isDarkMode ? '#212529' : 'inherit',
      color: isDarkMode ? '#fff' : '#212529',
      flexGrow: 1,
      paddingBottom: '100px'
    }
  };

  return (
    <div style={styles.container}>
      <ComHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <div className="d-flex">
        <ComSidebar isDarkMode={isDarkMode} key={location.pathname} />
        <div className="container mt-4" style={styles.mainContent}>
          {/* Conditionally render components based on route */}
          {isDeveloperDashboardRoute ? (
            <DeveloperDashboard isDarkMode={isDarkMode} />
          ) : isDeveloperMessagesRoute ? (
            <DeveloperMessages isDarkMode={isDarkMode} />
          ) : isDeveloperOrdersRoute ? ( // Add this condition
            <DeveloperOrders isDarkMode={isDarkMode} />
          ) : isAvailableDevelopersRoute ? (
            <AvailableDevelopers isDarkMode={isDarkMode} />
          ) : isNotificationsRoute ? (
            <Notifications isDarkMode={isDarkMode} />
          ) : isDiscussionForumRoute ? (
            <DiscussionForum isDarkMode={isDarkMode} />
          ) : isAskQuestionRoute ? (
            <AskQuestion isDarkMode={isDarkMode} />
          ) : isMyAnswersRoute ? (
            <MyAnswers isDarkMode={isDarkMode} />
          ) : isStudentOrdersRoute ? (
            <StudentOrders isDarkMode={isDarkMode} />
          ) : isStudentOrderDetailRoute || isQuestionViewRoute ? (
            React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, { isDarkMode });
              }
              return child;
            })
          ) : (
            React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, { isDarkMode });
              }
              return child;
            })
          )}
        </div>
      </div>
      <HelpButton isDarkMode={isDarkMode} />
    </div>
  );
};

export default Layout;