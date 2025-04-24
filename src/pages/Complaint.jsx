import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Complaint = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    contactPreference: '',
    complaintType: '',
    orderId: '',
    comments: '',
    files: []
  });

  // Get user info on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login', { state: { showPopup: true } });
          return;
        }

        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data) {
          setUserRole(response.data.role);
          setUserId(response.data._id);
          
          // Pre-fill the name fields if available
          if (response.data.name) {
            const nameParts = response.data.name.split(' ');
            setFormData(prev => ({
              ...prev,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: response.data.email || ''
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        navigate('/login');
      }
    };

    fetchUserInfo();
  }, [navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      files: Array.from(e.target.files)
    }));
  };

  // Validate form based on contact preference
  const validateForm = () => {
    // Common required fields
    if (!formData.firstName || !formData.lastName || !formData.complaintType || !formData.comments || !formData.contactPreference) {
      throw new Error('Please fill all required fields');
    }

    // Validate based on contact preference
    if (formData.contactPreference === 'email' && !formData.email) {
      throw new Error('Email is required based on your contact preference');
    }

    if (formData.contactPreference === 'phone' && !formData.phone) {
      throw new Error('Phone number is required based on your contact preference');
    }

    // Validate order ID if complaint type is related to orders
    if (formData.complaintType === 'againstOrder' && !formData.orderId) {
      throw new Error('Please provide an Order ID for order-related complaints');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate form data
      validateForm();

      const token = localStorage.getItem('token');
      
      // Create form data for file uploads
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('contactPreference', formData.contactPreference);
      formDataToSend.append('complaintType', formData.complaintType);
      formDataToSend.append('comments', formData.comments);
      formDataToSend.append('userId', userId);
      formDataToSend.append('userRole', userRole);
      
      if (formData.orderId) {
        formDataToSend.append('orderId', formData.orderId);
      }

      // Add files to form data
      formData.files.forEach((file, index) => {
        formDataToSend.append(`files`, file);
      });

      // Send the complaint
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/complaints/submit`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        contactPreference: '',
        complaintType: '',
        orderId: '',
        comments: '',
        files: []
      });
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error submitting complaint:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container className="py-5">
        <Card className="shadow">
          <Card.Header as="h4" className="text-center bg-primary text-white py-3">
            Submit a Complaint
          </Card.Header>
          <Card.Body className="p-4">
            {success && (
              <Alert variant="success" className="mb-4">
                Your complaint has been submitted successfully. We will review it and contact you soon.
              </Alert>
            )}
            
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      placeholder="Enter your first name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Enter your last name"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email {formData.contactPreference === 'email' && <span className="text-danger">*</span>}</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required={formData.contactPreference === 'email'}
                      placeholder="Enter your email address"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number {formData.contactPreference === 'phone' && <span className="text-danger">*</span>}</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required={formData.contactPreference === 'phone'}
                      placeholder="Enter your phone number"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Preferred Contact Method <span className="text-danger">*</span></Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    id="contact-email"
                    label="Email"
                    name="contactPreference"
                    value="email"
                    checked={formData.contactPreference === 'email'}
                    onChange={handleChange}
                    required
                  />
                  <Form.Check
                    inline
                    type="radio"
                    id="contact-phone"
                    label="Phone"
                    name="contactPreference"
                    value="phone"
                    checked={formData.contactPreference === 'phone'}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Form.Text className="text-muted">
                  Please select how you would prefer to be contacted regarding this complaint
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Complaint Type <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="complaintType"
                  value={formData.complaintType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select complaint type</option>
                  <option value="againstWebsite">Against Website</option>
                  <option value="againstOrder">Against Order</option>
                  {userRole === 'student' && (
                    <option value="againstDeveloper">Against Developer</option>
                  )}
                  {userRole === 'developer' && (
                    <option value="againstClient">Against Client</option>
                  )}
                  <option value="feedback">General Feedback</option>
                  <option value="other">Other</option>
                </Form.Select>
              </Form.Group>
              
              {formData.complaintType === 'againstOrder' && (
                <Form.Group className="mb-3">
                  <Form.Label>Order ID <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleChange}
                    required
                    placeholder="Enter the order ID"
                  />
                  <Form.Text className="text-muted">
                    Please provide the ID of the order you're having issues with
                  </Form.Text>
                </Form.Group>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label>Comments <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  required
                  placeholder="Please describe your complaint in detail"
                />
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label>Attachments</Form.Label>
                <Form.Control
                  type="file"
                  onChange={handleFileChange}
                  multiple
                />
                <Form.Text className="text-muted">
                  Optional. You can attach screenshots or relevant documents (Max 5MB per file)
                </Form.Text>
              </Form.Group>
              
              <div className="d-grid">
                <Button 
                  variant="primary" 
                  type="submit" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Submitting...
                    </>
                  ) : 'Submit Complaint'}
                </Button>
              </div>
            </Form>
          </Card.Body>
          <Card.Footer className="text-muted text-center py-3">
            Your complaint will be reviewed by our support team and we'll respond within 48 hours.
          </Card.Footer>
        </Card>
      </Container>
    </>
  );
};

export default Complaint; 