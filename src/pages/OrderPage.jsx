import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import { FaCheckCircle, FaClock, FaUser, FaCalendar, FaDollarSign, FaStar, FaRegStar } from 'react-icons/fa';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const OrderPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // Student review state
  const [showStudentReviewModal, setShowStudentReviewModal] = useState(false);
  const [studentRating, setStudentRating] = useState(5);
  const [studentComment, setStudentComment] = useState('');
  const [studentReviewTags, setStudentReviewTags] = useState({
    attentionToDetail: false,
    creativity: false,
    visualAppeal: false,
    storytelling: false,
    professionalism: false,
    exceededExpectations: false
  });
  const [studentReviewSubmitting, setStudentReviewSubmitting] = useState(false);

  // Developer review state
  const [showDeveloperReviewModal, setShowDeveloperReviewModal] = useState(false);
  const [developerRating, setDeveloperRating] = useState(5);
  const [developerComment, setDeveloperComment] = useState('');
  const [developerReviewTags, setDeveloperReviewTags] = useState({
    communication: false,
    clarity: false,
    responsiveness: false,
    reasonableExpectations: false,
    promptPayment: false,
    goodCollaboration: false
  });
  const [developerReviewSubmitting, setDeveloperReviewSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        // First check if we have a token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }

        // Try to get user info first
        let userResponse;
        try {
          userResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setUserRole(userResponse.data.role);
        } catch (userError) {
          console.error('Error fetching user profile:', userError);
          // Default to checking from localStorage
          setUserRole(localStorage.getItem('userRole')?.toLowerCase() || 'student');
        }

        // Determine if we're on a student or developer route
        const isDeveloperRoute = location.pathname.includes('/developerorders/');
        
        // Use the appropriate endpoint based on the route or role
        let endpoint;
        if (isDeveloperRoute) {
          endpoint = `/api/orders/developer/${orderId}`;
        } else {
          endpoint = `/api/orders/student/${orderId}`;
        }

        console.log('Fetching order from endpoint:', endpoint);

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}${endpoint}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data && response.data.order) {
          // Add a 2-second delay before setting the order and removing the loading state
          setTimeout(() => {
            setOrder(response.data.order);
            setLoading(false);
          }, 2000);
        } else {
          throw new Error('Invalid order data received from server');
        }
      } catch (err) {
        console.error('Error in OrderPage:', err);
        // Add a 2-second delay before showing the error
        setTimeout(() => {
          setError(err.response?.data?.message || err.message || 'Failed to fetch order details');
          setLoading(false);
        }, 2000);
      }
    };

    fetchOrderDetails();
  }, [orderId, location.pathname]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log(`Updating order status to: ${newStatus}`);
      setLoading(true);
      
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/status`,
        {
          orderId,
          status: newStatus
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Determine if we're on a student or developer route
      const isDeveloperRoute = location.pathname.includes('/developerorders/');
      
      // Use the appropriate endpoint based on the route
      const endpoint = isDeveloperRoute 
        ? `/api/orders/developer/${orderId}`
        : `/api/orders/student/${orderId}`;

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.order) {
        // Add a delay before updating the UI
        setTimeout(() => {
          setOrder(response.data.order);
          setLoading(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setTimeout(() => {
        setError(err.response?.data?.message || err.message || 'Failed to update order status');
        setLoading(false);
      }, 2000);
    }
  };

  const acceptOrder = async () => {
    try {
      await handleStatusUpdate('completed');
      // For students, show the review modal after accepting the order
      if (userRole === 'student') {
        setShowStudentReviewModal(true);
      }
    } catch (err) {
      setError('Failed to accept the order. Please try again.');
    }
  };

  const deliverOrder = async () => {
    try {
      await handleStatusUpdate('delivered');
    } catch (err) {
      setError('Failed to deliver the order. Please try again.');
    }
  };

  const submitStudentReview = async () => {
    try {
      setStudentReviewSubmitting(true);
      
      // Get selected tags
      const selectedTags = Object.keys(studentReviewTags).filter(tag => studentReviewTags[tag]);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/feedback`,
        {
          orderId,
          rating: studentRating,
          comment: studentComment,
          tags: selectedTags,
          type: 'student_to_developer' // Indicate this is student rating developer
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Close the modal and refresh order details
      setShowStudentReviewModal(false);
      setLoading(true);
      
      // Refresh order details to show the feedback
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/student/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.order) {
        // Add a delay before updating the UI
        setTimeout(() => {
          setOrder(response.data.order);
          setLoading(false);
          setStudentReviewSubmitting(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
      setStudentReviewSubmitting(false);
    }
  };

  const submitDeveloperReview = async () => {
    try {
      setDeveloperReviewSubmitting(true);
      
      // Get selected tags
      const selectedTags = Object.keys(developerReviewTags).filter(tag => developerReviewTags[tag]);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/developer-feedback`,
        {
          orderId,
          rating: developerRating,
          comment: developerComment,
          tags: selectedTags,
          type: 'developer_to_student' // Indicate this is developer rating student
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Close the modal and refresh order details
      setShowDeveloperReviewModal(false);
      setLoading(true);
      
      // Refresh order details to show the feedback
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/developer/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.order) {
        // Add a delay before updating the UI
        setTimeout(() => {
          setOrder(response.data.order);
          setLoading(false);
          setDeveloperReviewSubmitting(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Error submitting developer review:', err);
      setError('Failed to submit review. Please try again.');
      setDeveloperReviewSubmitting(false);
    }
  };

  const handleStudentTagChange = (tag) => {
    setStudentReviewTags({
      ...studentReviewTags,
      [tag]: !studentReviewTags[tag]
    });
  };

  const handleDeveloperTagChange = (tag) => {
    setDeveloperReviewTags({
      ...developerReviewTags,
      [tag]: !developerReviewTags[tag]
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in-progress':
        return 'primary';
      case 'delivered':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getBackToOrdersLink = () => {
    // Determine where to return to based on the current route
    const isDeveloperRoute = location.pathname.includes('/developerorders/');
    return isDeveloperRoute ? '/developerorders' : '/studentorders';
  };

  // Updated renderStars function
  const renderStars = (rating, interactive = false, setRatingFunc = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (interactive && setRatingFunc) {
        stars.push(
          <span 
            key={i} 
            onClick={() => setRatingFunc(i)} 
            style={{ cursor: 'pointer', marginRight: '5px', fontSize: '24px', display: 'inline-block' }}
          >
            {i <= rating ? <FaStar color="#FFD700" /> : <FaRegStar />}
          </span>
        );
      } else {
        stars.push(
          <span key={i} style={{ marginRight: '5px', fontSize: '22px', display: 'inline-block' }}>
            {i <= rating ? <FaStar color="#FFD700" /> : <FaRegStar />}
          </span>
        );
      }
    }
    return <div className="d-inline-flex">{stars}</div>;
  };

  // Check if student has reviewed the developer
  const hasStudentReviewedDeveloper = order?.feedback && order.feedback.rating;
  
  // Check if developer has reviewed the student
  const hasDeveloperReviewedStudent = order?.studentFeedback && order.studentFeedback.rating;

  if (loading) {
    // Skeleton loading UI
    return (
      <Container className="mt-4 mb-5">
        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0"><Skeleton width={150} height={30} baseColor="#3d85f0" highlightColor="#5c9aff" /></h4>
            <Skeleton width={80} height={30} baseColor="#3d85f0" highlightColor="#5c9aff" />
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <Skeleton height={32} width="70%" className="mb-2" />
                <Skeleton count={3} className="mb-3" />
                
                <div className="mt-4">
                  <h6 className="mb-3"><Skeleton width={150} /></h6>
                  <Row className="g-3">
                    <Col sm={6}>
                      <div className="d-flex align-items-center">
                        <Skeleton circle width={20} height={20} className="me-2" />
                        <div style={{ width: '100%' }}>
                          <Skeleton width={80} height={16} />
                          <Skeleton width={120} />
                        </div>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="d-flex align-items-center">
                        <Skeleton circle width={20} height={20} className="me-2" />
                        <div style={{ width: '100%' }}>
                          <Skeleton width={80} height={16} />
                          <Skeleton width={120} />
                        </div>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="d-flex align-items-center">
                        <Skeleton circle width={20} height={20} className="me-2" />
                        <div style={{ width: '100%' }}>
                          <Skeleton width={80} height={16} />
                          <Skeleton width={120} />
                        </div>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="d-flex align-items-center">
                        <Skeleton circle width={20} height={20} className="me-2" />
                        <div style={{ width: '100%' }}>
                          <Skeleton width={80} height={16} />
                          <Skeleton width={120} />
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Col>
              
              <Col md={4} className="mt-4 mt-md-0">
                <Card className="border">
                  <Card.Body>
                    <h6 className="mb-3"><Skeleton width={100} /></h6>
                    <Skeleton height={38} className="mb-2" />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
          <Card.Footer className="text-center">
            <Skeleton width={120} height={38} />
          </Card.Footer>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <div className="text-center mt-3">
          <Button variant="primary" onClick={() => navigate(getBackToOrdersLink())}>
            Back to Orders
          </Button>
        </div>
      </Container>
    );
  }

  // Handle the case where order is still null despite loading being false
  if (!order) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">Order not found or couldn't be loaded</Alert>
        <div className="text-center mt-3">
          <Button variant="primary" onClick={() => navigate(getBackToOrdersLink())}>
            Back to Orders
          </Button>
        </div>
      </Container>
    );
  }

  // Check if we're on a developer route
  const isDeveloperRoute = location.pathname.includes('/developerorders/');
  
  // Check if the order has been delivered
  const isOrderDelivered = order.status === 'delivered';
  // Check if the order is in progress (developer working on it)
  const isOrderInProgress = order.status === 'in-progress';
  // Check if the order is completed
  const isOrderCompleted = order.status === 'completed';
  // Only students can accept orders that are delivered
  const canAcceptOrder = !isDeveloperRoute && isOrderDelivered;
  // Only developers can deliver orders that are in progress
  const canDeliverOrder = isDeveloperRoute && isOrderInProgress;

  return (
    <Container className="mt-4 mb-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Order Details</h4>
          <Badge bg={getStatusBadgeVariant(order.status)} className="fs-6">
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              <h5>{order.title}</h5>
              <p className="text-muted">{order.description}</p>
              
              <div className="mt-4">
                <h6 className="mb-3">Order Information</h6>
                <Row className="g-3">
                  <Col sm={6}>
                    <div className="d-flex align-items-center">
                      <FaUser className="text-primary me-2" />
                      <div>
                        <small className="text-muted d-block">
                          {isDeveloperRoute ? 'Client' : 'Developer'}
                        </small>
                        <span>{isDeveloperRoute ? order.studentName : order.developerName || 'User'}</span>
                      </div>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="d-flex align-items-center">
                      <FaCalendar className="text-primary me-2" />
                      <div>
                        <small className="text-muted d-block">Start Date</small>
                        <span>{new Date(order.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="d-flex align-items-center">
                      <FaClock className="text-primary me-2" />
                      <div>
                        <small className="text-muted d-block">Delivery Time</small>
                        <span>{order.deliveryTime || 1} days</span>
                      </div>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="d-flex align-items-center">
                      <FaDollarSign className="text-primary me-2" />
                      <div>
                        <small className="text-muted d-block">Amount</small>
                        <span>PKR {order.amount}</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* Display feedback section */}
              {isOrderCompleted && (
                <div className="mt-4">
                  <h6 className="mb-3 fw-bold">Order Feedback</h6>
                  
                  {/* For student: Display developer feedback if student has rated */}
                  {!isDeveloperRoute && (
                    <div className="mb-3">
                      <Card className="border shadow-sm p-3">
                        <Card.Title as="h6" className="mb-3 border-bottom pb-2">Your Feedback to Developer</Card.Title>
                        {hasStudentReviewedDeveloper ? (
                          <div>
                            <div className="d-flex align-items-center mb-3">
                              <div className="me-2">
                                {renderStars(order.feedback.rating)}
                              </div>
                              <span className="fw-bold fs-5">{order.feedback.rating}/5</span>
                            </div>
                            {order.feedback.comment && (
                              <div className="mb-3">
                                <p className="lead mb-2" style={{ fontSize: '1.1rem' }}>{order.feedback.comment}</p>
                              </div>
                            )}
                            {order.feedback.tags && order.feedback.tags.length > 0 && (
                              <div>
                                {order.feedback.tags.map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    bg="info" 
                                    className="me-2 mb-1 px-3 py-2"
                                    style={{ fontSize: '0.85rem' }}
                                  >
                                    {tag.replace(/([A-Z])/g, ' $1').trim()}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-3">
                            <p>You haven't provided feedback yet.</p>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => setShowStudentReviewModal(true)}
                            >
                              Rate Developer
                            </Button>
                          </div>
                        )}
                      </Card>
                    </div>
                  )}
                  
                  {/* For developer: Display student's feedback or prompt */}
                  {isDeveloperRoute && (
                    <div className="mb-3">
                      <Card className="border shadow-sm p-3">
                        <Card.Title as="h6" className="mb-3 border-bottom pb-2">Client Feedback</Card.Title>
                        {hasStudentReviewedDeveloper ? (
                          hasDeveloperReviewedStudent ? (
                            <div>
                              <div className="d-flex align-items-center mb-3">
                                <div className="me-2">
                                  {renderStars(order.feedback.rating)}
                                </div>
                                <span className="fw-bold fs-5">{order.feedback.rating}/5</span>
                              </div>
                              {order.feedback.comment && (
                                <div className="mb-3">
                                  <p className="lead mb-2" style={{ fontSize: '1.1rem' }}>{order.feedback.comment}</p>
                                </div>
                              )}
                              {order.feedback.tags && order.feedback.tags.length > 0 && (
                                <div>
                                  {order.feedback.tags.map((tag, index) => (
                                    <Badge 
                                      key={index} 
                                      bg="info" 
                                      className="me-2 mb-1 px-3 py-2"
                                      style={{ fontSize: '0.85rem' }}
                                    >
                                      {tag.replace(/([A-Z])/g, ' $1').trim()}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <p>Client has submitted a review. Rate the client to see their feedback.</p>
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => setShowDeveloperReviewModal(true)}
                              >
                                Rate Client
                              </Button>
                            </div>
                          )
                        ) : (
                          <p className="text-muted">Waiting for client to provide feedback.</p>
                        )}
                      </Card>
                    </div>
                  )}
                  
                  {/* Developer's feedback to student (visible to both after both have rated) */}
                  {hasDeveloperReviewedStudent && (
                    <div className="mt-3">
                      <Card className="border shadow-sm p-3">
                        <Card.Title as="h6" className="mb-3 border-bottom pb-2">
                          {isDeveloperRoute ? "Your Feedback to Client" : "Developer's Feedback"}
                        </Card.Title>
                        <div className="d-flex align-items-center mb-3">
                          <div className="me-2">
                            {renderStars(order.studentFeedback.rating)}
                          </div>
                          <span className="fw-bold fs-5">{order.studentFeedback.rating}/5</span>
                        </div>
                        {order.studentFeedback.comment && (
                          <div className="mb-3">
                            <p className="lead mb-2" style={{ fontSize: '1.1rem' }}>{order.studentFeedback.comment}</p>
                          </div>
                        )}
                        {order.studentFeedback.tags && order.studentFeedback.tags.length > 0 && (
                          <div>
                            {order.studentFeedback.tags.map((tag, index) => (
                              <Badge 
                                key={index} 
                                bg="info" 
                                className="me-2 mb-1 px-3 py-2"
                                style={{ fontSize: '0.85rem' }}
                              >
                                {tag.replace(/([A-Z])/g, ' $1').trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </Col>
            
            <Col md={4} className="mt-4 mt-md-0">
              <Card className="border">
                <Card.Body>
                  <h6 className="mb-3">Order Actions</h6>
                  
                  {/* For developers: Show "Deliver Order" button for in-progress orders */}
                  {canDeliverOrder && (
                    <Button
                      variant="success"
                      className="w-100 mb-2"
                      onClick={deliverOrder}
                    >
                      Deliver Order
                    </Button>
                  )}
                  
                  {/* For students: Show "Accept Order" button for delivered orders */}
                  {canAcceptOrder && (
                    <Button
                      variant="success"
                      className="w-100"
                      onClick={acceptOrder}
                    >
                      Accept Order
                    </Button>
                  )}
                  
                  {/* For both: Show disabled buttons when not applicable */}
                  {!canDeliverOrder && !canAcceptOrder && !isOrderCompleted && (
                    <Button
                      variant="secondary"
                      className="w-100"
                      disabled
                    >
                      Accept Order
                    </Button>
                  )}
                  
                  {/* For completed orders: Show disabled "Order Completed" button */}
                  {isOrderCompleted && (
                    <Button
                      variant="success"
                      className="w-100"
                      disabled
                    >
                      Order Completed
                    </Button>
                  )}
                  
                  {/* For students with completed orders without feedback: Show "Add Review" button */}
                  {isOrderCompleted && !hasStudentReviewedDeveloper && !isDeveloperRoute && (
                    <Button
                      variant="outline-primary"
                      className="w-100 mt-2"
                      onClick={() => setShowStudentReviewModal(true)}
                    >
                      Rate Developer
                    </Button>
                  )}
                  
                  {/* For developers with completed orders: Show "Rate Client" button if student has reviewed but developer hasn't */}
                  {isOrderCompleted && hasStudentReviewedDeveloper && !hasDeveloperReviewedStudent && isDeveloperRoute && (
                    <Button
                      variant="outline-primary"
                      className="w-100 mt-2"
                      onClick={() => setShowDeveloperReviewModal(true)}
                    >
                      Rate Client
                    </Button>
                  )}
                </Card.Body>
              </Card>

              {order.status === 'completed' && (
                <Card className="border mt-3">
                  <Card.Body className="text-center">
                    <FaCheckCircle className="text-success mb-2" size={24} />
                    <h6>Order Completed</h6>
                    <p className="text-muted small mb-0">
                      {order.completionDate 
                        ? new Date(order.completionDate).toLocaleDateString()
                        : 'Completion date not available'}
                    </p>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer className="text-center">
          <Button
            variant="outline-primary"
            onClick={() => navigate(getBackToOrdersLink())}
          >
            Back to Orders
          </Button>
        </Card.Footer>
      </Card>
      
      {/* Student Review Modal */}
      <Modal show={showStudentReviewModal} onHide={() => setShowStudentReviewModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rate your experience with the developer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <h5>Order ID: {orderId}</h5>
            <p className="mb-3">Based on your expectations, how would you rate the quality of this delivery?</p>
            <div className="d-flex justify-content-center mb-3">
              {renderStars(studentRating, true, setStudentRating)}
            </div>
          </div>
          
          {studentRating === 5 && (
            <div className="mb-4">
              <p className="mb-3">We love to hear that! What made it exceptional?</p>
              <Form.Group>
                <Row>
                  <Col xs={6} className="mb-2">
                    <Form.Check 
                      type="checkbox"
                      id="attention-detail"
                      label="Attention to details"
                      checked={studentReviewTags.attentionToDetail}
                      onChange={() => handleStudentTagChange('attentionToDetail')}
                      />
                    </Col>
                    <Col xs={6} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id="creativity"
                        label="Creativity"
                        checked={studentReviewTags.creativity}
                        onChange={() => handleStudentTagChange('creativity')}
                      />
                    </Col>
                    <Col xs={6} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id="visual-appeal"
                        label="Visual appeal"
                        checked={studentReviewTags.visualAppeal}
                        onChange={() => handleStudentTagChange('visualAppeal')}
                      />
                    </Col>
                    <Col xs={6} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id="storytelling"
                        label="Storytelling"
                        checked={studentReviewTags.storytelling}
                        onChange={() => handleStudentTagChange('storytelling')}
                      />
                    </Col>
                    <Col xs={6} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id="professionalism"
                        label="Professionalism of work"
                        checked={studentReviewTags.professionalism}
                        onChange={() => handleStudentTagChange('professionalism')}
                      />
                    </Col>
                    <Col xs={6} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id="exceeded-expectations"
                        label="Exceeded expectations"
                        checked={studentReviewTags.exceededExpectations}
                        onChange={() => handleStudentTagChange('exceededExpectations')}
                      />
                    </Col>
                  </Row>
                </Form.Group>
              </div>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Additional comments (optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={studentComment}
                onChange={(e) => setStudentComment(e.target.value)}
                placeholder="Share your experience with the developer..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStudentReviewModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={submitStudentReview} 
              disabled={studentReviewSubmitting}
            >
              {studentReviewSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </Modal.Footer>
        </Modal>
  
        {/* Developer Review Modal */}
        <Modal show={showDeveloperReviewModal} onHide={() => setShowDeveloperReviewModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Rate your experience with the client</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center mb-4">
              <h5>Order ID: {orderId}</h5>
              <p className="mb-3">How would you rate your experience working with this client?</p>
              <div className="d-flex justify-content-center mb-3">
                {renderStars(developerRating, true, setDeveloperRating)}
              </div>
            </div>
            
            {developerRating === 5 && (
              <div className="mb-4">
                <p className="mb-3">Great! What made this client exceptional to work with?</p>
                <Form.Group>
                  <Row>
                    <Col xs={6} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id="communication"
                        label="Clear communication"
                        checked={developerReviewTags.communication}
                        onChange={() => handleDeveloperTagChange('communication')}
                      />
                    </Col>
                    <Col xs={6} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id="clarity"
                        label="Project clarity"
                        checked={developerReviewTags.clarity}
                        onChange={() => handleDeveloperTagChange('clarity')}
                      />
                    </Col>
                    <Col xs={6} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id="responsiveness"
                        label="Responsiveness"
                        checked={developerReviewTags.responsiveness}
                        onChange={() => handleDeveloperTagChange('responsiveness')}
                      />
                    </Col>
                    <Col xs={6} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id="reasonable-expectations"
                        label="Reasonable expectations"
                        checked={developerReviewTags.reasonableExpectations}
                        onChange={() => handleDeveloperTagChange('reasonableExpectations')}
                      />
                    </Col>
                    <Col xs={6} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id="prompt-payment"
                        label="Prompt payment"
                        checked={developerReviewTags.promptPayment}
                        onChange={() => handleDeveloperTagChange('promptPayment')}
                      />
                    </Col>
                    <Col xs={6} className="mb-2">
                      <Form.Check 
                        type="checkbox"
                        id="good-collaboration"
                        label="Good collaboration"
                        checked={developerReviewTags.goodCollaboration}
                        onChange={() => handleDeveloperTagChange('goodCollaboration')}
                      />
                    </Col>
                  </Row>
                </Form.Group>
              </div>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Additional comments (optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={developerComment}
                onChange={(e) => setDeveloperComment(e.target.value)}
                placeholder="Share your experience with the client..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeveloperReviewModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={submitDeveloperReview} 
              disabled={developerReviewSubmitting}
            >
              {developerReviewSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    );
  };
  
  export default OrderPage;