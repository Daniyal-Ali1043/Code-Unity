import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { FaCheckCircle } from 'react-icons/fa';

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  // Using a ref to prevent multiple order creations
  const orderProcessedRef = useRef(false);

  useEffect(() => {
    // Only run this once per component mount
    if (orderProcessedRef.current) return;

    const createOrder = async () => {
      try {
        // Get the orderId from URL params
        const orderIdFromURL = searchParams.get('orderId');
        console.log('🔍 Order ID from URL:', orderIdFromURL);
        
        if (!orderIdFromURL) {
          const errorMsg = 'Order ID not found in URL parameters';
          console.error('❌ ' + errorMsg);
          throw new Error(errorMsg);
        }
        
        // Mark order as processed immediately to prevent duplicate processing
        orderProcessedRef.current = true;
        setOrderId(orderIdFromURL);
        
        // First, check if the order already exists in the database
        try {
          console.log('🔍 Checking if order already exists:', orderIdFromURL);
          const checkResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/orders/student/${orderIdFromURL}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }
            }
          );
          
          if (checkResponse.data && checkResponse.data.success) {
            console.log('✅ Order already exists in database:', orderIdFromURL);
            setSuccess(true);
            setIsLoading(false);
            return;
          }
        } catch (checkError) {
          // If we get a 404, the order doesn't exist, which is expected
          if (checkError.response && checkError.response.status === 404) {
            console.log('⚠️ Order does not exist yet, will create it:', orderIdFromURL);
          } else {
            console.error('❌ Error checking order existence:', checkError);
          }
        }

        // Get order details from localStorage
        const orderDetailsStr = localStorage.getItem('orderDetails');
        console.log('📋 Order details from localStorage (raw):', orderDetailsStr);
        
        if (!orderDetailsStr) {
          const errorMsg = 'Order details not found. Please try the payment process again.';
          console.error('❌ ' + errorMsg);
          throw new Error(errorMsg);
        }

        const orderDetails = JSON.parse(orderDetailsStr);
        console.log('📋 Parsed order details:', orderDetails);

        // Create the order payload with all required fields
        const orderPayload = {
          orderId: orderIdFromURL,
          offerId: orderDetails.offerId,
          developerId: orderDetails.developerId,
          title: orderDetails.title,
          description: orderDetails.description,
          amount: parseFloat(orderDetails.amount),
          deliveryTime: orderDetails.deliveryTime || 1,
          revisions: orderDetails.revisions || 0,
          meetingIncluded: orderDetails.meetingIncluded || false,
          hours: orderDetails.hours || 1
        };
        
        console.log('📤 Sending order payload:', orderPayload);

        // Create the order in the backend
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/create`,
          orderPayload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('📥 Order creation response:', response.data);

        if (response.data.success) {
          setSuccess(true);
          // Clear order details from localStorage after successful creation
          localStorage.removeItem('orderDetails');
        } else {
          throw new Error(response.data.message || 'Failed to create order');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error creating order:', error);
        setError(error.response?.data?.message || error.message || 'Failed to create order');
        setIsLoading(false);
      }
    };

    createOrder();
    
    // Clean-up function
    return () => {
      orderProcessedRef.current = true; // Ensure the effect doesn't run again if component remounts
    };
  }, []); // Empty dependency array to run only once on mount

  const handleBackToInbox = () => {
    navigate('/inbox');
  };

  const handleBackToHome = () => {
    navigate('/studentdashboard');
  };

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Processing your payment and creating order...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <h4>Error</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={handleBackToInbox} className="me-2">
            Back to Inbox
          </Button>
          <Button variant="outline-primary" onClick={handleBackToHome}>
            Back to Home
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-success text-white">
          <h4 className="mb-0 text-center">Payment Successful</h4>
        </Card.Header>
        <Card.Body className="text-center">
          <div className="d-flex justify-content-center mb-4">
            <FaCheckCircle size={64} color="#28a745" />
          </div>
          <h5 className="mb-3">Thank you for your payment!</h5>
          <p className="text-muted mb-4">
            Your order has been successfully processed and is now in progress. 
            You will receive a confirmation email shortly.
          </p>
          <Row className="justify-content-center">
            <Col xs={12} md={4} className="mb-2 mb-md-0 pe-md-1">
              <Button 
                variant="outline-primary" 
                onClick={handleBackToInbox}
                className="w-100"
              >
                Back to Inbox
              </Button>
            </Col>
            <Col xs={12} md={4} className="mb-2 mb-md-0 px-md-1">
              <Button 
                variant="primary" 
                onClick={() => navigate(`/studentorders/${orderId}`)}
                className="w-100"
              >
                Go to Order
              </Button>
            </Col>
            <Col xs={12} md={4} className="ps-md-1">
              <Button 
                variant="outline-secondary" 
                onClick={handleBackToHome}
                className="w-100"
              >
                Back to Home
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Success;