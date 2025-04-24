import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
const baseURL = import.meta.env.VITE_BACKEND_URL;

const AskQuestion = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [isValid, setIsValid] = useState(false);

  // Common tech tags for suggestions
  const commonTechTags = [
    "javascript", "react", "node.js", "python", "java", "c++", 
    "mongodb", "express", "html", "css", "typescript"
  ];
  
  // Process tags whenever tagInput changes
  useEffect(() => {
    // Process the input to extract tags (split by commas or spaces)
    const processTagInput = () => {
      // Split by both commas and spaces, and filter out empty strings
      const inputTags = tagInput
        .split(/[,\s]+/)
        .filter(tag => tag.trim() !== "")
        .map(tag => tag.trim().toLowerCase());
      
      // Update the tags array with unique values
      setTags([...new Set(inputTags)]);
    };
    
    processTagInput();
  }, [tagInput]);
  
  // Validate the form whenever relevant fields change
  useEffect(() => {
    // Validate that we have at least a title, description, and 3 tags
    const validateForm = () => {
      const isValidTitle = title.trim().length >= 5;
      const isValidDescription = description.trim().length >= 20;
      const isValidTags = tags.length >= 3;
      
      setIsValid(isValidTitle && isValidDescription && isValidTags);
    };
    
    validateForm();
  }, [title, description, tags]);

  // Handle tag removal
  const removeTag = (tagToRemove) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    
    // Also update the input field to reflect the changes
    setTagInput(updatedTags.join(", "));
  };
  
  // Handle tag suggestion click
  const addTagSuggestion = (tag) => {
    if (!tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      setTagInput(newTags.join(", "));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Additional validation
    if (tags.length < 3) {
      toast.error("Please add at least 3 tags");
      return;
    }
  
    // Retrieve the token from localStorage
    const token = localStorage.getItem("token");
  
    if (!token) {
      toast.error("You are not logged in.");
      navigate("/login");
      return;
    }
  
    console.log("🔹 Token before sending request:", token); // Debugging line
  
    const questionData = {
      question: title,
      description: description,
      tags: tags, // Already an array
    };
  
    try {
      const res = await axios.post(`${baseURL}/api/discussion/ask-question`, questionData, {
        headers: {
          "Content-Type": "application/json", // Ensures proper format
          Authorization: `Bearer ${token}`, // Sending JWT token
        },
      });
  
      if (res.status === 201) {
        toast.success("Question added successfully");
        setTimeout(() => {
          navigate("/studentdashboard");
        }, 2000);
      } else {
        throw new Error("Failed to post question");
      }
    } catch (error) {
      console.error("🚨 Failed to submit question:", error);
      toast.error("Error submitting question. Please try again.");
    }
  };
  
  // Define styles based on dark mode
  const styles = {
    container: {
      backgroundColor: isDarkMode ? '#212529' : '#fff',
      color: isDarkMode ? '#fff' : '#212529'
    },
    card: {
      backgroundColor: isDarkMode ? '#343a40' : '#fff',
      color: isDarkMode ? '#fff' : '#212529',
      borderColor: isDarkMode ? '#495057' : 'rgba(0,0,0,.125)'
    },
    cardTitle: {
      color: isDarkMode ? '#fff' : '#212529'
    },
    formLabel: {
      color: isDarkMode ? '#fff' : '#212529'
    },
    formControl: {
      backgroundColor: isDarkMode ? '#2c3136' : '#fff',
      color: isDarkMode ? '#fff' : '#212529',
      borderColor: isDarkMode ? '#495057' : '#ced4da'
    },
    textMuted: {
      color: isDarkMode ? '#adb5bd' : '#6c757d'
    },
    textSuccess: {
      color: isDarkMode ? '#8BC34A' : '#198754'
    },
    textDanger: {
      color: isDarkMode ? '#f77' : '#dc3545'
    },
    badge: {
      backgroundColor: isDarkMode ? '#6c757d' : '#6c757d',
      color: '#fff'
    },
    badgeSuccess: {
      backgroundColor: isDarkMode ? '#198754' : '#198754',
      color: '#fff'
    },
    badgePrimary: {
      backgroundColor: isDarkMode ? '#0d6efd' : '#0d6efd',
      color: '#fff'
    },
    submitButton: {
      backgroundColor: isDarkMode ? '#0d6efd' : '#0d6efd',
      borderColor: isDarkMode ? '#0d6efd' : '#0d6efd',
      color: '#fff'
    },
    submitButtonDisabled: {
      backgroundColor: isDarkMode ? '#3e4a57' : '#6c757d',
      borderColor: isDarkMode ? '#3e4a57' : '#6c757d',
      color: isDarkMode ? '#9fadba' : '#fff'
    }
  };
  
  return (
    <>
      {/* Main Layout */}
      <div className="d-flex" style={styles.container}>
        {/* Ask Question Form */}
        <div className="container mt-4 pb-5" style={{ flexGrow: 1 }}>
          <Toaster 
            toastOptions={{
              style: {
                background: isDarkMode ? '#343a40' : '#fff',
                color: isDarkMode ? '#fff' : '#212529',
              }
            }}
          />
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card shadow" style={styles.card}>
                <div className="card-body">
                  <h1 className="card-title text-center mb-4" style={styles.cardTitle}>Ask a Question</h1>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label" style={styles.formLabel}>Question Title</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required 
                        minLength={5}
                        style={styles.formControl}
                      />
                      <small style={styles.textMuted}>Be specific and clear about your question</small>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label" style={styles.formLabel}>Question Description</label>
                      <textarea 
                        className="form-control" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="5" 
                        required 
                        minLength={20}
                        style={styles.formControl}
                      />
                      <small style={styles.textMuted}>Provide details to help others understand your question</small>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label" style={styles.formLabel}>Related Tags (at least 3)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Enter tags separated by commas or spaces" 
                        style={styles.formControl}
                      />
                      <small style={tags.length >= 3 ? styles.textSuccess : styles.textDanger}>
                        {tags.length} of 3 required tags added
                      </small>
                      
                      {/* Tag suggestions */}
                      <div className="mt-2">
                        <small style={styles.textMuted}>Suggestions:</small>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {commonTechTags.map((tag) => (
                            <span 
                              key={tag} 
                              className="badge me-1 mb-1"
                              style={tags.includes(tag) ? styles.badgeSuccess : styles.badge}
                              onClick={() => addTagSuggestion(tag)}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Display selected tags */}
                      {tags.length > 0 && (
                        <div className="mt-3">
                          <label className="form-label" style={styles.formLabel}>Selected Tags:</label>
                          <div className="d-flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                              <div key={index} className="badge p-2 d-flex align-items-center" style={styles.badgePrimary}>
                                {tag}
                                <button 
                                  type="button" 
                                  className="btn-close btn-close-white ms-2" 
                                  style={{ fontSize: '0.6rem' }}
                                  onClick={() => removeTag(tag)}
                                  aria-label="Remove tag"
                                ></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn w-100" 
                      disabled={!isValid}
                      style={isValid ? styles.submitButton : styles.submitButtonDisabled}
                    >
                      Ask on Community
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AskQuestion;