import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const TrendingTechnologies = ({ isDarkMode }) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL;
  
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
  
  // Generate styles based on dark mode
  const styles = {
    container: {
      backgroundColor: isDarkMode ? '#343a40' : '#fff',
      color: isDarkMode ? '#fff' : '#212529',
      border: `1px solid ${isDarkMode ? '#495057' : '#dee2e6'}`,
    },
    heading: {
      color: isDarkMode ? '#fff' : '#212529'
    },
    tagItem: {
      backgroundColor: isDarkMode ? '#2c3136' : '#f8f9fa',
      color: isDarkMode ? '#fff' : '#212529',
      border: `1px solid ${isDarkMode ? '#495057' : '#dee2e6'}`,
      transition: 'background-color 0.2s ease'
    },
    tagItemHover: {
      backgroundColor: isDarkMode ? '#3c4246' : '#e9ecef',
    },
    tagNumber: {
      color: isDarkMode ? '#8bbeff' : '#0d6efd'
    },
    tagName: {
      color: isDarkMode ? '#fff' : '#212529'
    },
    tagCount: {
      color: isDarkMode ? '#adb5bd' : '#6c757d'
    },
    errorText: {
      color: isDarkMode ? '#adb5bd' : '#6c757d'
    }
  };
  
  // Fetch trending tags using React Query
  const { data: trendingTags, isLoading, error } = useQuery({
    queryKey: ['trendingTags'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${baseURL}/api/discussion/trending-tags`, config);
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute to keep tags updated
    // Only run the query if we have a token
    enabled: !!localStorage.getItem('token')
  });

  if (isLoading) {
    return (
      <div className="p-3 rounded shadow-sm" style={styles.container}>
        <h5 className="mb-3 fw-bold" style={styles.heading}>Trending Technologies</h5>
        <div className="d-flex flex-column gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-2 rounded" style={styles.tagItem}>
              <Skeleton width={20} height={20} className="me-2" />
              <Skeleton width={100} height={20} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded shadow-sm" style={styles.container}>
        <h5 className="mb-3 fw-bold" style={styles.heading}>Trending Technologies</h5>
        <p style={styles.errorText}>Unable to load trending tags</p>
      </div>
    );
  }

  return (
    <div className="p-3 rounded shadow-sm" style={styles.container}>
      <h5 className="mb-3 fw-bold" style={styles.heading}>Trending Technologies</h5>
      {trendingTags && trendingTags.length > 0 ? (
        <div className="d-flex flex-column gap-2">
          {trendingTags.map((tag, index) => (
            <Link 
              key={tag._id || index} 
              to={`/discussions/find/${tag.name}`}
              className="text-decoration-none"
            >
              <div 
                className="trending-tag p-2 rounded d-flex align-items-center"
                style={styles.tagItem}
                onMouseOver={(e) => {
                  Object.assign(e.currentTarget.style, styles.tagItemHover);
                }}
                onMouseOut={(e) => {
                  Object.assign(e.currentTarget.style, styles.tagItem);
                }}
              >
                <span className="fw-bold me-2" style={styles.tagNumber}>#{index + 1}</span>
                <span className="technology-name" style={styles.tagName}>{tag.name}</span>
                <span className="count ms-auto" style={styles.tagCount}>({tag.count})</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p style={styles.errorText}>No trending technologies yet</p>
      )}
    </div>
  );
};

export default TrendingTechnologies;