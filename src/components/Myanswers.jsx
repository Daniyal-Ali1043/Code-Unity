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

  // Define styles based on dark mode
  const styles = {
    container: {
      backgroundColor: isDarkMode ? '#212529' : '#fff',
      color: isDarkMode ? '#fff' : '#212529'
    },
    heading: {
      color: isDarkMode ? '#8bbeff' : '#0d6efd',
      textAlign: 'center',
      fontWeight: 'bold',
      marginBottom: '1.5rem'
    },
    errorText: {
      color: isDarkMode ? '#f77' : '#dc3545', 
      textAlign: 'center'
    },
    loaderContainer: {
      display: 'flex',
      justifyContent: 'center',
      padding: '2rem'
    }
  };

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

  return (
    <>
      {/* Main Layout */}
      <div className="d-flex" style={styles.container}>
        {/* Content Section */}
        <div className="container mt-3" style={{ flexGrow: 1, overflow: 'visible' }}>
          <h2 style={styles.heading}>My Answers</h2>

          {isLoading ? (
            <div style={styles.loaderContainer}>
              <SyncLoader color={isDarkMode ? '#8bbeff' : '#0d6efd'} />
            </div>
          ) : error ? (
            <div style={styles.errorText}>Error: {error.message}</div>
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
    </>
  );
};

export default MyAnswers;