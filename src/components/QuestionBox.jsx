import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ArrowUp from '../icons/Arrowup';
import ArrowDown from '../icons/Arrowdown';
import Comment from '../icons/Comment';
import Send from '../icons/Send';
import moment from "moment";
import axios from 'axios';

const baseURL = import.meta.env.VITE_BACKEND_URL;

const fetchUserProfile = async () => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};

const QuestionBox = ({ openId, index, setOpenId, question, isDarkMode }) => {
  const [answer, setAnswer] = useState("");
  const [repliesData, setRepliesData] = useState([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [replyFetchAttempted, setReplyFetchAttempted] = useState(false);
  
  // Get user profile data
  const { data: userProfile, isLoading, isError } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    enabled: !!localStorage.getItem('token')
  });

  // Check if replies are already populated objects or just IDs
  const repliesNeedFetching = question.replies && 
    question.replies.length > 0 && 
    (typeof question.replies[0] === 'string' || !question.replies[0].author);
  
  // Function to fetch full reply data if needed
  const fetchRepliesIfNeeded = async () => {
    if (!repliesNeedFetching || replyFetchAttempted) return;
    
    setIsLoadingReplies(true);
    setReplyFetchAttempted(true);
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Fetch the full question with populated replies using getAllQuestions approach
      console.log("Attempting to fetch populated question data from API");
      
      // Based on the API structure, try to get the full question with populated replies
      const response = await axios.get(`${baseURL}/api/discussion/questions`, config);
      
      // Find our question in the results
      const fullQuestion = response.data.find(q => q._id === question._id);
      
      if (fullQuestion && fullQuestion.replies && fullQuestion.replies.length > 0) {
        console.log("Found populated question in all questions response:", fullQuestion);
        setRepliesData(fullQuestion.replies);
      } else {
        console.log("Question not found in all questions response, creating placeholder replies");
        
        // Create placeholder replies
        const placeholderReplies = question.replies.map(replyId => {
          return {
            _id: typeof replyId === 'string' ? replyId : Math.random().toString(),
            reply: "Reply content unavailable.",
            author: { username: 'Anonymous' },
            createdAt: new Date().toISOString()
          };
        });
        
        setRepliesData(placeholderReplies);
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
      
      // Create fallback reply data
      const fallbackReplies = question.replies.map(() => ({
        _id: Math.random().toString(),
        reply: "Unable to load reply content. Please try refreshing the page.",
        author: { username: 'System' },
        createdAt: new Date().toISOString()
      }));
      
      setRepliesData(fallbackReplies);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  // Effect to automatically fetch replies when component mounts
  // and question has replies that need fetching
  useEffect(() => {
    if (openId.includes(index) && repliesNeedFetching && !replyFetchAttempted) {
      fetchRepliesIfNeeded();
    }
  }, [openId, index, question, replyFetchAttempted]);

  const handleToggleReplies = (index) => {
    if (openId.includes(index)) {
      setOpenId(openId.filter(id => id !== index));
    } else {
      setOpenId([...openId, index]);
      if (repliesNeedFetching && !replyFetchAttempted) {
        fetchRepliesIfNeeded();
      }
    }
  };

  // Generate styles based on dark mode
  const styles = {
    container: {
      backgroundColor: isDarkMode ? '#495057' : '#E3F2FD',
      borderRadius: '0.5rem',
      margin: '1rem 0'
    },
    questionBox: {
      backgroundColor: isDarkMode ? '#343a40' : '#fff',
      color: isDarkMode ? '#fff' : '#212529',
      border: `1px solid ${isDarkMode ? '#6c757d' : '#dee2e6'}`
    },
    questionTitle: {
      color: isDarkMode ? '#fff' : '#212529'
    },
    questionDescription: {
      color: isDarkMode ? '#e9ecef' : '#212529'
    },
    tagBadge: {
      backgroundColor: isDarkMode ? '#6c757d' : '#6c757d',
      color: isDarkMode ? '#fff' : '#fff'
    },
    mutedText: {
      color: isDarkMode ? '#adb5bd' : '#6c757d'
    },
    replyBox: {
      backgroundColor: isDarkMode ? '#2c3136' : '#f8f9fa',
      border: `1px solid ${isDarkMode ? '#495057' : '#dee2e6'}`
    },
    replyText: {
      color: isDarkMode ? '#e9ecef' : '#212529'
    },
    replyAuthor: {
      color: isDarkMode ? '#adb5bd' : '#6c757d'
    },
    inputField: {
      backgroundColor: isDarkMode ? '#2c3136' : '#fff',
      color: isDarkMode ? '#fff' : '#212529',
      border: `1px solid ${isDarkMode ? '#495057' : '#ced4da'}`
    },
    loadingSpinner: {
      color: isDarkMode ? '#0d6efd' : '#0d6efd'
    }
  };

  if (isLoading) return <div style={{ color: isDarkMode ? '#fff' : '#212529' }}>Loading user data...</div>;
  if (isError) return <div style={{ color: isDarkMode ? '#dc3545' : '#dc3545' }}>Error fetching user profile</div>;

  // Determine which replies to display
  const displayReplies = repliesData.length > 0 ? repliesData : 
                         (question.replies && question.replies[0]?.author) ? question.replies : [];

  return (
    <div className="p-2" style={styles.container}>
      <div className="d-flex align-items-center rounded shadow-sm p-3" style={styles.questionBox}>
        <div className="d-flex flex-column align-items-center me-3">
          <ArrowUp id={question._id} isDarkMode={isDarkMode} />
          <span style={{ color: isDarkMode ? '#fff' : '#212529' }}>{question.upvote?.length - question.downvote?.length || 0}</span>
          <ArrowDown id={question._id} isDarkMode={isDarkMode} />
        </div>
        <div className="flex-grow-1">
          <h5 className="mb-1" style={styles.questionTitle}>{question.question}</h5>
          <p className="mb-1" style={styles.questionDescription}>{question.description}</p>
          
          {/* Tags Section */}
          {question.tags && question.tags.length > 0 && (
            <div className="mb-2">
              <span className="fw-bold" style={{ color: isDarkMode ? '#fff' : '#212529' }}>Tags: </span>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {question.tags.map((tag, tagIndex) => (
                  <Link 
                    key={tagIndex} 
                    to={`/discussions/find/${tag}`}
                    className="text-decoration-none"
                  >
                    <span className="badge px-2 py-1 me-1 mb-1" style={styles.tagBadge}>
                      {tag}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              {question.author?.profilePicture && (
                <img src={question.author.profilePicture} alt="Profile" style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }} />
              )}
              <span style={styles.mutedText}>
                posted by {question.author?.username || 'Anonymous'} {userProfile && question.author?._id === userProfile._id ? "(You)" : ""}
              </span>
            </div>
            <div className="posted-on mx-auto" style={{ whiteSpace: 'nowrap' }}>
              <small style={styles.mutedText}>{moment(question.createdAt).fromNow()}</small>
            </div>
            <div
              className="comment flex align-items-center gap-2 ml-auto cursor-pointer"
              onClick={() => handleToggleReplies(index)}
              style={{ cursor: 'pointer' }}
            >
              <Comment style={{ fontSize: '1rem', color: isDarkMode ? '#adb5bd' : '#6c757d' }} />
              <span style={{ fontSize: '1rem', verticalAlign: 'middle', color: isDarkMode ? '#adb5bd' : '#6c757d' }}>
                {question.replies?.length || 0}
              </span>
            </div>
          </div>
          
          {openId.includes(index) && (
            <>
              {isLoadingReplies ? (
                <div className="text-center my-3">
                  <div className="spinner-border spinner-border-sm" role="status" style={styles.loadingSpinner}>
                    <span className="visually-hidden">Loading replies...</span>
                  </div>
                  <span className="ms-2" style={{ color: isDarkMode ? '#fff' : '#212529' }}>Loading replies...</span>
                </div>
              ) : displayReplies.length > 0 ? (
                // Display fully populated replies
                displayReplies.map((reply, replyIndex) => (
                  <div key={reply._id || replyIndex} className="p-2 mt-2 rounded" style={styles.replyBox}>
                    <p className="mb-2" style={styles.replyText}>{reply.reply}</p>
                    <div className="d-flex align-items-center">
                      {reply.author?.profilePicture && (
                        <img 
                          src={reply.author.profilePicture} 
                          alt="" 
                          className="rounded-circle" 
                          style={{ width: '20px', height: '20px' }} 
                        />
                      )}
                      <div className="ms-2">
                        <small style={styles.replyAuthor}>
                          answered by {reply.author?.username || 'Anonymous'} {moment(reply.createdAt).fromNow()}
                        </small>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center my-3" style={styles.mutedText}>
                  <p>No replies yet. Be the first to respond!</p>
                </div>
              )}
              
              <div className="mt-2 d-flex justify-content-between">
                <input
                  type="text"
                  className="form-control form-control-sm flex-grow-1"
                  placeholder="Write a comment..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  style={styles.inputField}
                />
                <Send
                  answer={answer}
                  questionId={question._id}
                  setAnswer={setAnswer}
                  className="ms-2 btn-sm"
                  isDarkMode={isDarkMode}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionBox;