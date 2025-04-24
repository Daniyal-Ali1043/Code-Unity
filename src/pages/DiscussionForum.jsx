import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Row, Col } from "react-bootstrap";
import Content from "../components/Content";
import Skeleton from "react-loading-skeleton"; 
import "react-loading-skeleton/dist/skeleton.css"; 
import TrendingTechnologies from "../components/TrendingTenchologies"; 
import HelpButton from '../components/HelpButton';

const DiscussionForum = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Configure Skeleton theme for dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.style.setProperty('--skeleton-base-color', '#333');
      document.documentElement.style.setProperty('--skeleton-highlight-color', '#444');
    } else {
      document.documentElement.style.setProperty('--skeleton-base-color', '#ebebeb');
      document.documentElement.style.setProperty('--skeleton-highlight-color', '#f5f5f5');
    }
  }, [isDarkMode]);

  // Simulate a 2-second delay before hiding the skeleton loading
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 2000); // 2000 milliseconds = 2 seconds
  }, []);

  const handleShowForm = () => {
    navigate("/ask");
  };

  const handleShowMyQuestions = () => {
    // Check for token presence before navigating
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in.");
      navigate("/login");
    } else {
      navigate("/myqna");
    }
  };

  // Generate styles based on dark mode
  const styles = {
    container: {
      backgroundColor: isDarkMode ? '#343a40' : '#fff',
      color: isDarkMode ? '#fff' : '#212529'
    },
    button: {
      primary: {
        backgroundColor: isDarkMode ? '#0d6efd' : '#0d6efd',
        borderColor: isDarkMode ? '#0d6efd' : '#0d6efd',
        color: '#fff'
      },
      secondary: {
        backgroundColor: isDarkMode ? '#6c757d' : '#6c757d', 
        borderColor: isDarkMode ? '#6c757d' : '#6c757d',
        color: '#fff'
      }
    },
    skeletonContainer: {
      backgroundColor: isDarkMode ? '#495057' : '#E3F2FD',
      borderRadius: '0.5rem', 
      margin: '1rem 0'
    },
    skeletonInner: {
      backgroundColor: isDarkMode ? '#343a40' : '#fff',
      border: `1px solid ${isDarkMode ? '#6c757d' : '#dee2e6'}`,
      boxShadow: isDarkMode ? '0 .125rem .25rem rgba(0,0,0,.3)' : '0 .125rem .25rem rgba(0,0,0,.075)'
    }
  };

  return (
    <>
      {/* Main Layout */}
      <div className="d-flex" style={{ backgroundColor: isDarkMode ? '#212529' : 'inherit' }}>
        {/* Discussion Forum Content */}
        <Container fluid className="mt-4 pb-5" style={styles.container}>
          <Row>
            <Col>
              <Button 
                variant={isDarkMode ? "outline-light" : "primary"} 
                onClick={handleShowForm}
              >
                Add Question
              </Button>
              <Button
                variant={isDarkMode ? "outline-secondary" : "secondary"}
                onClick={handleShowMyQuestions}
                className="ms-2"
              >
                My Questions
              </Button>
            </Col>
          </Row>
          <Row className="mt-3">
            {/* Main content column - 9 columns wide */}
            <Col md={9}>
              {loading ? (
                // Skeleton Loading Placeholder for Content
                <div className="w-full flex flex-col items-center gap-y-6 my-6 px-4 md:px-0">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="p-2"
                      style={styles.skeletonContainer}
                    >
                      <div className="d-flex align-items-center rounded p-3" style={styles.skeletonInner}>
                        {/* Upvote/Downvote Skeleton */}
                        <div className="d-flex flex-column align-items-center me-3">
                          <Skeleton circle width={20} height={20} className="mb-1" />
                          <Skeleton width={30} height={20} />
                          <Skeleton circle width={20} height={20} className="mt-1" />
                        </div>
                        {/* Question Content Skeleton */}
                        <div className="flex-grow-1">
                          <Skeleton height={30} width="80%" className="mb-2" /> {/* Title */}
                          <Skeleton height={20} count={2} className="mb-2" /> {/* Description */}
                          {/* Author and Metadata Skeleton */}
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <Skeleton circle width={30} height={30} className="me-2" /> {/* Profile Picture */}
                              <Skeleton width={100} height={20} /> {/* Author */}
                            </div>
                            <Skeleton width={80} height={20} /> {/* Posted Time */}
                            <div className="d-flex align-items-center">
                              <Skeleton circle width={20} height={20} className="me-2" /> {/* Comment Icon */}
                              <Skeleton width={30} height={20} /> {/* Comment Count */}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Pass the selectedQuestion and isDarkMode to the Content component
                <Content selectedQuestionProp={selectedQuestion} isDarkMode={isDarkMode} />
              )}
            </Col>
            
            {/* Trending technologies sidebar - 3 columns wide */}
            <Col md={3}>
              <TrendingTechnologies isDarkMode={isDarkMode} />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Help Button */}
      <HelpButton isDarkMode={isDarkMode} />
    </>
  );
};

export default DiscussionForum;