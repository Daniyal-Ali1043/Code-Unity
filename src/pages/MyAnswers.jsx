import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import SyncLoader from 'react-spinners/SyncLoader';
import NothingHere from '../components/NothingHere';
import QuestionBox from '../components/QuestionBox';

// Define the base URL using the environment variable from Vite
const baseUrl = import.meta.env.VITE_BACKEND_URL;

const MyAnswers = ({ isDarkMode }) => {
  const [openId, setOpenId] = useState([]);

  const fetchQuestions = async () => {
    const { data } = await axios.get(`${baseUrl}/api/discussion/my-questions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data;
  };

  const { isLoading, error, data } = useQuery({
    queryKey: ['getMyQuestions'],
    queryFn: fetchQuestions
  });

  // Generate styles based on dark mode
  const styles = {
    container: {
      backgroundColor: isDarkMode ? '#212529' : 'inherit',
      color: isDarkMode ? '#fff' : '#212529',
      minHeight: '100vh'
    },
    contentSection: {
      backgroundColor: isDarkMode ? '#212529' : 'inherit',
      color: isDarkMode ? '#fff' : '#212529',
      flexGrow: 1,
      overflow: 'visible',
      padding: '1rem'
    },
    heading: {
      color: isDarkMode ? '#fff' : '#0d6efd'
    },
    loadingSpinner: {
      color: isDarkMode ? '#fff' : '#333'
    },
    errorText: {
      color: isDarkMode ? '#ff6b6b' : '#dc3545'
    }
  };

  return (
    <div style={styles.container}>
      {/* Main Layout */}
      <div className="d-flex">
        {/* Content Section */}
        <div className="container mt-3" style={styles.contentSection}>
          <h2 className="text-center fw-bold mb-4" style={styles.heading}>My Answers</h2>

          {isLoading ? (
            <div className="text-center">
              <SyncLoader color={isDarkMode ? "#fff" : "#333"} />
            </div>
          ) : error ? (
            <div className="text-center" style={styles.errorText}>Error: {error.message}</div>
          ) : data && data.length === 0 ? (
            <NothingHere isDarkMode={isDarkMode} />
          ) : (
            data.map((question, index) => (
              <QuestionBox 
                key={question._id} 
                question={question} 
                openId={openId} 
                setOpenId={setOpenId} 
                index={index} 
                isDarkMode={isDarkMode}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAnswers; 