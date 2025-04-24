import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import { Dropdown, ButtonGroup, Button } from "react-bootstrap";
import Loading from "./Loading";
import NothingHere from "./NothingHere";
import QuestionBox from "./QuestionBox";

const baseURL = import.meta.env.VITE_BACKEND_URL;

const Content = ({ selectedQuestionProp = null, isDarkMode }) => {
  const { topic } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState([]); // State to track open questions
  const [sortBy, setSortBy] = useState("newest"); // Default sorting by newest
  const [sortedData, setSortedData] = useState([]); // State to hold sorted data
  
  // Get selectedQuestion from location state or prop
  const [selectedQuestion, setSelectedQuestion] = useState(
    selectedQuestionProp || 
    (location.state && location.state.selectedQuestion) || 
    null
  );

  // Generate styles based on dark mode
  const styles = {
    container: {
      color: isDarkMode ? '#fff' : '#212529'
    },
    heading: {
      color: isDarkMode ? '#fff' : '#212529'
    },
    dropdownButton: {
      backgroundColor: isDarkMode ? 'transparent' : 'transparent',
      borderColor: isDarkMode ? '#6c757d' : '#0d6efd',
      color: isDarkMode ? '#fff' : '#0d6efd'
    },
    dropdownToggle: {
      backgroundColor: isDarkMode ? 'transparent' : 'transparent',
      borderColor: isDarkMode ? '#6c757d' : '#0d6efd',
      color: isDarkMode ? '#fff' : '#0d6efd'
    },
    dropdownMenu: {
      backgroundColor: isDarkMode ? '#343a40' : '#fff',
      borderColor: isDarkMode ? '#495057' : '#dee2e6'
    },
    dropdownItem: {
      color: isDarkMode ? '#fff' : '#212529',
      backgroundColor: 'transparent'
    },
    dropdownItemActive: {
      backgroundColor: isDarkMode ? '#0d6efd' : '#e9ecef',
      color: isDarkMode ? '#fff' : '#212529'
    },
    errorText: {
      color: isDarkMode ? '#f8d7da' : '#dc3545'
    },
    backButton: {
      color: isDarkMode ? '#fff' : '#0d6efd',
      borderColor: isDarkMode ? '#6c757d' : '#0d6efd',
      backgroundColor: 'transparent'
    }
  };

  // Fetching Questions Using React Query
  const { isLoading, data, error } = useQuery({
    queryKey: ["getAllQuestions", topic],
    queryFn: async () => {
      const endpoint = topic
        ? `${baseURL}/api/discussion/find/${topic}`
        : `${baseURL}/api/discussion/questions`;

      const token = localStorage.getItem('token'); // Get the stored token
      const config = {
        headers: {
          Authorization: `Bearer ${token}` // Send the token in the Authorization header
        }
      };

      const response = await axios.get(endpoint, config); // Pass config to axios call
      return response.data;
    },
  });

  // Effect to update the selected question from props
  useEffect(() => {
    if (selectedQuestionProp) {
      setSelectedQuestion(selectedQuestionProp);
    }
  }, [selectedQuestionProp]);

  // Effect to update from navigation state
  useEffect(() => {
    if (location.state && location.state.selectedQuestion) {
      setSelectedQuestion(location.state.selectedQuestion);
      // Clear the location state to avoid persisting the selected question
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Sort data whenever data or sortBy changes
  useEffect(() => {
    if (data) {
      const sortData = () => {
        const sortedQuestions = [...data]; // Create a copy of the data

        switch (sortBy) {
          case "newest":
            sortedQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          case "oldest":
            sortedQuestions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
          case "mostUpvoted":
            sortedQuestions.sort((a, b) => 
              (b.upvote.length - b.downvote.length) - (a.upvote.length - a.downvote.length)
            );
            break;
          case "mostCommented":
            sortedQuestions.sort((a, b) => (b.replies?.length || 0) - (a.replies?.length || 0));
            break;
          default:
            // Default to newest
            sortedQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        setSortedData(sortedQuestions);
      };

      sortData();
    }
  }, [data, sortBy]);

  // Handle sort selection
  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
  };

  // Handle going back to all questions
  const handleBackToQuestions = () => {
    setSelectedQuestion(null);
    navigate("/discussions");
  };

  // Error Handling for API Calls
  if (isLoading) return <Loading isDarkMode={isDarkMode} />;
  if (error) return <div style={styles.errorText} className="text-center">⚠️ Error: {error.message}</div>;

  // If we have a selected question, show only that one
  if (selectedQuestion) {
    return (
      <div className="w-full flex flex-col items-center gap-y-6 my-6 px-4 md:px-0" style={styles.container}>
        <Toaster 
          toastOptions={{
            style: {
              background: isDarkMode ? '#343a40' : '#fff',
              color: isDarkMode ? '#fff' : '#212529',
            }
          }}
        />
        
        {/* Back button */}
        <div className="w-full d-flex justify-content-start mb-3">
          <Button 
            variant={isDarkMode ? "outline-light" : "outline-primary"} 
            size="sm" 
            onClick={handleBackToQuestions}
            className="d-flex align-items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left me-2" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            Back to all questions
          </Button>
        </div>
        
        {/* Selected question */}
        <QuestionBox
          key={selectedQuestion._id}
          question={selectedQuestion}
          index={0}
          openId={[0]} // Automatically open the comments for this question
          setOpenId={setOpenId}
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  // Otherwise show the normal list with sorting
  return (
    <div className="w-full flex flex-col items-center gap-y-6 my-6 px-4 md:px-0" style={styles.container}>
      <Toaster 
        toastOptions={{
          style: {
            background: isDarkMode ? '#343a40' : '#fff',
            color: isDarkMode ? '#fff' : '#212529',
          }
        }}
      />
      
      {/* Sort Dropdown */}
      <div className="w-full d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0" style={styles.heading}>
          {topic ? `Questions about ${topic}` : "All Questions"}
        </h4>
        <Dropdown as={ButtonGroup}>
          <Button 
            variant={isDarkMode ? "outline-secondary" : "outline-primary"} 
            size="sm" 
            disabled
            style={styles.dropdownButton}
          >
            Sort by: {sortBy === "newest" ? "Newest" : 
                     sortBy === "oldest" ? "Oldest" : 
                     sortBy === "mostUpvoted" ? "Most Upvoted" : 
                     "Most Commented"}
          </Button>
          <Dropdown.Toggle 
            split 
            variant={isDarkMode ? "outline-secondary" : "outline-primary"}
            id="dropdown-split-basic" 
            size="sm"
            style={styles.dropdownToggle}
          />
          <Dropdown.Menu style={styles.dropdownMenu}>
            <Dropdown.Item 
              onClick={() => handleSortChange("newest")}
              active={sortBy === "newest"}
              style={sortBy === "newest" ? styles.dropdownItemActive : styles.dropdownItem}
            >
              Newest First
            </Dropdown.Item>
            <Dropdown.Item 
              onClick={() => handleSortChange("oldest")}
              active={sortBy === "oldest"}
              style={sortBy === "oldest" ? styles.dropdownItemActive : styles.dropdownItem}
            >
              Oldest First
            </Dropdown.Item>
            <Dropdown.Item 
              onClick={() => handleSortChange("mostUpvoted")}
              active={sortBy === "mostUpvoted"}
              style={sortBy === "mostUpvoted" ? styles.dropdownItemActive : styles.dropdownItem}
            >
Most Upvoted
            </Dropdown.Item>
            <Dropdown.Item 
              onClick={() => handleSortChange("mostCommented")}
              active={sortBy === "mostCommented"}
              style={sortBy === "mostCommented" ? styles.dropdownItemActive : styles.dropdownItem}
            >
              Most Commented
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      
      {/* Questions List */}
      {sortedData?.length > 0 ? (
        sortedData.map((question, index) => (
          <QuestionBox
            key={question._id}
            question={question}
            index={index}
            openId={openId}
            setOpenId={setOpenId}
            isDarkMode={isDarkMode}
          />
        ))
      ) : (
        <NothingHere isDarkMode={isDarkMode} />
      )}
    </div>
  );
};

export default Content;