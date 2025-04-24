import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const ApplyDeveloper = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        programmingLanguages: '',
        previousExperiences: '',
        projectsLink: '',
        degree: '',
        discipline: '',
        educationYear: '',
    });

    useEffect(() => {
        const checkApplicationStatus = async () => {
            try {
                const response = await axios.get('/api/developers/check-application', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (response.data.hasApplied) {
                    setHasAlreadyApplied(true);
                    // Use autoClose instead of onClose to prevent toast manipulation issues
                    toast.info("You have already submitted an application.", {
                        position: "top-center",
                        autoClose: 3000,
                        onOpen: () => setTimeout(() => navigate('/track'), 3000)
                    });
                } else {
                    fetchStudentData();
                }
            } catch (error) {
                console.error('Error checking application status:', error);
            }
        };

        const fetchStudentData = async () => {
            try {
                const response = await axios.get('/api/students/profile', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                
                const { firstName, lastName, dateOfBirth, degree, discipline } = response.data;
                
                // Safely handle dateOfBirth splitting with a null check
                const formattedDate = dateOfBirth && typeof dateOfBirth === 'string' 
                    ? dateOfBirth.split('T')[0] 
                    : '';
                    
                setFormData(prevState => ({
                    ...prevState,
                    firstName: firstName || '',
                    lastName: lastName || '',
                    dateOfBirth: formattedDate,
                    degree: degree || '',
                    discipline: discipline || '',
                }));
            } catch (error) {
                console.error('Error fetching student data:', error);
                // Use autoClose instead of callbacks to prevent toast manipulation issues
                toast.error("Failed to fetch student data", {
                    autoClose: 3000
                });
            }
        };

        checkApplicationStatus();
    }, [navigate]);

    const handleFileChange = (event) => {
        if (event.target.files.length > 0) {
            // Only accept PDF, DOC, DOCX files
            const file = event.target.files[0];
            
            if (file.type !== 'application/pdf' && 
                file.type !== 'application/msword' && 
                file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                toast.error("Please upload a valid resume file (PDF, DOC, or DOCX)");
                return;
            }
            
            setResumeFile(file);
            setErrors(prev => ({ ...prev, resume: '' }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevFormData => ({ ...prevFormData, [name]: value }));
        
        // Clear error when user types in a field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Check all required fields
        Object.entries(formData).forEach(([key, value]) => {
            if (!value || value.trim() === '') {
                newErrors[key] = `${key.split(/(?=[A-Z])/).join(" ").replace(/\b\w/g, l => l.toUpperCase())} is required`;
            }
        });
        
        // Check if resume is uploaded
        if (!resumeFile) {
            newErrors.resume = 'Resume is required';
        }
        
        // Validate programming languages (max 3)
        if (formData.programmingLanguages) {
            const languages = formData.programmingLanguages.split(',').map(lang => lang.trim()).filter(Boolean);
            if (languages.length > 3) {
                newErrors.programmingLanguages = 'Maximum 3 programming languages allowed';
            }
        }
        
        // Validate date of birth (must be at least 18 years old)
        if (formData.dateOfBirth) {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (age < 18 || (age === 18 && monthDiff < 0)) {
                newErrors.dateOfBirth = 'You must be at least 18 years old';
            }
        }
        
        // Validate project link (must be a valid URL)
        if (formData.projectsLink && !isValidUrl(formData.projectsLink)) {
            newErrors.projectsLink = 'Please enter a valid URL';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Helper function to validate URLs
    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Validate form before submission
        if (!validateForm()) {
            toast.error("Please fill in all required fields correctly");
            return;
        }
        
        const formDataToSend = new FormData();
        
        // Add all form data fields
        Object.entries(formData).forEach(([key, value]) => {
            formDataToSend.append(key, value);
        });

        // Add resume file - use 'resume' as the field name to match backend
        if (resumeFile) {
            formDataToSend.append('resume', resumeFile);
        }

        try {
            const response = await axios.post('/api/developers/apply', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                }
            });
            
            if (response.status === 201) {
                toast.success("Application submitted successfully", {
                    autoClose: 3000,
                    onOpen: () => setTimeout(() => navigate('/track'), 3000)
                });
            } else {
                toast.error("Application submission failed", {
                    autoClose: 5000
                });
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            const errorMessage = error.response?.data?.message || "An unexpected error occurred";
            toast.error(`Error submitting application: ${errorMessage}`, {
                autoClose: 5000
            });
        }
    };

    // Function to get the display title for a field
    const getFieldTitle = (key) => {
        if (key === 'programmingLanguages') return 'Programming Languages (max 3, comma-separated)';
        if (key === 'previousExperiences') return 'Previous Experiences';
        if (key === 'projectsLink') return 'Projects Link (GitHub, Portfolio, etc.)';
        if (key === 'educationYear') return 'Year of Education Completion';
        
        return key.split(/(?=[A-Z])/).join(" ").replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <>
            <div className="d-flex">
                <div className="container mt-4">
                    {!hasAlreadyApplied ? (
                        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow" style={{ maxWidth: '800px', margin: 'auto' }}>
                            <h3 className="text-center mb-4">Apply for Developer Position</h3>
                            
                            {Object.keys(formData).map(key => (
                                <div className="form-group mb-3" key={key}>
                                    <label htmlFor={key}>{getFieldTitle(key)} *</label>
                                    <input
                                        id={key}
                                        type={key === 'dateOfBirth' ? 'date' : 'text'}
                                        name={key}
                                        placeholder={getFieldTitle(key)}
                                        value={formData[key]}
                                        onChange={handleInputChange}
                                        className={`form-control ${errors[key] ? 'is-invalid' : ''}`}
                                    />
                                    {errors[key] && <div className="invalid-feedback">{errors[key]}</div>}
                                </div>
                            ))}
                            
                            <div className="form-group mb-3">
                                <label>Resume (PDF, DOC, DOCX) *</label>
                                <div
                                    className={`text-center p-3 ${errors.resume ? 'border border-danger' : 'border border-secondary'}`}
                                    style={{
                                        borderStyle: 'dashed',
                                        borderRadius: '8px',
                                        backgroundColor: '#f8f9fa',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <p className="mb-2">Drag and drop your resume here or click to browse</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <button type="button" className="btn btn-outline-primary">Browse Files</button>
                                    {resumeFile ? (
                                        <div className="mt-2 text-success">
                                            <i className="bi bi-check-circle"></i> {resumeFile.name}
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-muted">No file selected</div>
                                    )}
                                    {errors.resume && <div className="text-danger mt-2">{errors.resume}</div>}
                                </div>
                            </div>
                            
                            <button type="submit" className="btn btn-primary w-100 mt-3">Submit Application</button>
                        </form>
                    ) : (
                        <div className="text-center mt-5">
                            <h2>You have already applied for the Developer Position.</h2>
                            <button onClick={() => navigate('/track')} className="btn btn-primary mt-3">Track Your Application</button>
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer />
        </>
    );
};

export default ApplyDeveloper;