import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import { Button } from "react-bootstrap";
import QuestionBox from "./QuestionBox";
import Loading from "../components/Loading";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const baseURL = import.meta.env.VITE_BACKEND_URL;

const QuestionView = ({ isDarkMode }) => {
  const { questionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState([0]); // Always open comments for this view
  const [loading, setLoading] = useState(true); // Added loading state for skeleton
  
  // Get question from location state or fetch it
  const [question, setQuestion] = useState(
    location.state?.selectedQuestion || null
  );

  // Add 2-second skeleton loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2000 milliseconds = 2 seconds
    
    return () => clearTimeout(timer);
  }, []);

  // Log the questionId to debug
  useEffect(() => {
    console.log("QuestionView - Question ID:", questionId);
    console.log("QuestionView - Question from location state:", location.state?.selectedQuestion);
  }, [questionId, location.state]);

  // Try to find the question in the cached data first
  useEffect(() => {
    // Check if we can get the question from the already cached getAllQuestions data
    const cachedQuestionsData = queryClient.getQueryData(["getAllQuestions"]);
    
    if (cachedQuestionsData && questionId && !question) {
      console.log("Looking for question in cached data");
      const foundQuestion = cachedQuestionsData.find(q => q._id === questionId);
      
      if (foundQuestion) {
        console.log("Found question in cached data:", foundQuestion);
        setQuestion(foundQuestion);
      }
    }
  }, [questionId, queryClient, question]);

  // Fetch question data if not available in state or cache
  const { isLoading: isQueryLoading, error } = useQuery({
    queryKey: ["getQuestion", questionId],
    queryFn: async () => {
      // If we already have the question data from location state or cache, use it
      if (question) {
        console.log("Using existing question data:", question);
        return question;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication required");
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      console.log("Fetching question from API for ID:", questionId);
      
      try {
        // First, try to get all questions and find our question with populated replies
        console.log("Fetching all questions to find the specific one with populated replies");
        const allQuestionsResponse = await axios.get(`${baseURL}/api/discussion/questions`, config);
        const foundQuestion = allQuestionsResponse.data.find(q => q._id === questionId);
        
        if (foundQuestion) {
          console.log("Found question in all questions response:", foundQuestion);
          setQuestion(foundQuestion);
          return foundQuestion;
        }
        
        // If not found in all questions, try the direct question endpoint
        console.log("Question not found in all questions, trying direct endpoint");
        const directResponse = await axios.get(`${baseURL}/api/discussion/question/${questionId}`, config);
        console.log("Direct endpoint response:", directResponse.data);
        
        // Set the question data, even if replies might not be populated
        setQuestion(directResponse.data);
        return directResponse.data;
      } catch (err) {
        console.log("Error fetching question data:", err.message);
        throw new Error(`Failed to fetch question: ${err.message}`);
      }
    },
    enabled: !!questionId && !question,
    retry: 1 // Retry once if it fails
  });

  // Handle going back to discussion forum
  const handleBackToDiscussions = () => {
    navigate("/discussionforum");
  };

  // If we're loading data from the API
  if (isQueryLoading) return <Loading />;
  
  // Handle error state
  if (error) {
    console.error("Error in QuestionView:", error);
    return (
      <div className="container mt-5 text-center">
        <div className="alert alert-danger">
          <p>Error loading question: {error.message}</p>
          <Button variant="primary" onClick={handleBackToDiscussions}>
            Back to Discussions
          </Button>
        </div>
      </div>
    );
  }

  // If we don't have a question after loading
  if (!question) {
    console.error("No question data available after fetch attempts");
    return (
      <div className="container mt-5 text-center">
        <div className="alert alert-warning">
          <p>Question not found</p>
          <Button variant="primary" onClick={handleBackToDiscussions}>
            Back to Discussions
          </Button>
        </div>
      </div>
    );
  }

  // Log the question data before rendering to verify structure
  console.log("Question data being passed to QuestionBox:", question);
  if (question.replies) {
    console.log("Replies data structure:", 
      typeof question.replies[0] === 'string' 
        ? "Reply IDs (needs fetching)" 
        : "Populated reply objects"
    );
  }

  return (
    <div className="container mt-4">
      <Toaster />
      
      {/* Back button */}
      <div className="w-100 d-flex justify-content-start mb-3">
        <Button 
          variant="outline-primary" 
          onClick={handleBackToDiscussions}
          className="d-flex align-items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left me-2" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          Back to all discussions
        </Button>
      </div>
      
      {/* Display the question or skeleton loading */}
      <div className="row justify-content-center">
        <div className="col-md-10">
          {loading ? (
            // Skeleton Loading for Question
            <div 
              className="p-2"
              style={{ backgroundColor: "#E3F2FD", borderRadius: "0.5rem", margin: "1rem 0" }}
            >
              <div className="d-flex align-items-start border rounded shadow-sm bg-white p-3">
                {/* Upvote/Downvote Skeleton */}
                <div className="d-flex flex-column align-items-center me-3">
                  <Skeleton circle width={20} height={20} className="mb-1" />
                  <Skeleton width={30} height={20} />
                  <Skeleton circle width={20} height={20} className="mt-1" />
                </div>
                
                {/* Question Content Skeleton */}
                <div className="flex-grow-1">
                  <Skeleton height={40} width="80%" className="mb-2" /> {/* Title */}
                  <Skeleton height={20} count={4} className="mb-2" /> {/* Description */}
                  
                  {/* Author and Metadata Skeleton */}
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="d-flex align-items-center">
                      <Skeleton circle width={40} height={40} className="me-2" /> {/* Profile Picture */}
                      <Skeleton width={120} height={20} /> {/* Author */}
                    </div>
                    <Skeleton width={100} height={20} /> {/* Posted Time */}
                  </div>
                  
                  {/* Comments Section Skeleton */}
                  <div className="mt-4">
                    <Skeleton height={30} width="40%" className="mb-3" /> {/* Comments Header */}
                    
                    {/* Comment Skeletons */}
                    <div className="border rounded p-3 mb-3">
                      <div className="d-flex align-items-start">
                        <Skeleton circle width={30} height={30} className="me-2" />
                        <div className="flex-grow-1">
                          <Skeleton height={15} width="30%" className="mb-2" />
                          <Skeleton height={15} count={2} className="mb-2" />
                          <Skeleton height={15} width="20%" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded p-3 mb-3">
                      <div className="d-flex align-items-start">
                        <Skeleton circle width={30} height={30} className="me-2" />
                        <div className="flex-grow-1">
                          <Skeleton height={15} width="40%" className="mb-2" />
                          <Skeleton height={15} count={3} className="mb-2" />
                          <Skeleton height={15} width="20%" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Add Comment Skeleton */}
                    <div className="mt-3">
                      <Skeleton height={100} className="mb-2" />
                      <div className="d-flex justify-content-end">
                        <Skeleton width={100} height={40} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Actual Question Box
            <QuestionBox
              key={question._id}
              question={question}
              index={0}
              openId={openId}
              setOpenId={setOpenId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionView;