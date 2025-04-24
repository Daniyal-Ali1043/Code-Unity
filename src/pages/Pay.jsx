import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, ListGroup, Container, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const Pay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stripeError, setStripeError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingFreeOrder, setProcessingFreeOrder] = useState(false);
  const [isProSubscriber, setIsProSubscriber] = useState(false);
  const [discountedAmount, setDiscountedAmount] = useState(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  
  // Ref to prevent duplicate order creation
  const orderProcessedRef = useRef(false);

  // Get order details from location state
  const orderDetails = location.state || {};
  const { 
    developerId, 
    title, 
    description, 
    amount = "10.00", 
    rate = "0.00",
    deliveryTime = 1, 
    revisions = 0, 
    meetingIncluded = false,
    offerId,
    isFree = false,
    hours = 1
  } = orderDetails;

  // Generate a consistent order ID format for both free and paid orders
  const generateOrderId = () => {
    // Generate a random 8-character alphanumeric string
    return `ORD-${uuidv4().substring(0, 8)}`;
  };

  // Use the rate from the developer if available, otherwise use the amount
  const baseAmount = rate !== "0.00" ? rate : amount;
  
  // Check for Pro subscription and calculate discount
  useEffect(() => {
    const checkProSubscription = async () => {
      setIsCheckingSubscription(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/subscription/status`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          }
        );
        
        console.log('Subscription data received:', response.data);
        
        if (response.data && response.data.isPro && response.data.status === 'active') {
          setIsProSubscriber(true);
          
          // Calculate 20% discount
          const originalAmount = parseFloat(baseAmount);
          const discount = originalAmount * 0.2;
          const discounted = originalAmount - discount;
          
          // Round to 2 decimal places
          setDiscountedAmount(Math.round(discounted * 100) / 100);
          
          console.log(`Pro discount applied: Original: ${originalAmount}, Discounted: ${discounted}`);
        } else {
          setIsProSubscriber(false);
          setDiscountedAmount(null);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        setIsProSubscriber(false);
        setDiscountedAmount(null);
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    if (!isFree) {
      checkProSubscription();
    } else {
      setIsCheckingSubscription(false);
    }
  }, [baseAmount, isFree]);
  
  // Get the final display amount with or without discount
  const displayAmount = isFree 
    ? "0.00" 
    : (isProSubscriber && discountedAmount !== null) 
      ? discountedAmount.toString() 
      : baseAmount;

  // Automatically process free orders when component loads
  useEffect(() => {
    // Check if this is a free order and hasn't been processed yet
    if (isFree && offerId && !orderProcessedRef.current) {
      handleFreeOrder();
    }
    
    // Cleanup function
    return () => {
      // If component unmounts, mark as processed to prevent duplicate processing
      orderProcessedRef.current = true;
    };
  }, [isFree, offerId]);

  // Create a direct order for free developers
  const handleFreeOrder = async () => {
    // If already processing or processed, don't proceed
    if (processingFreeOrder || orderProcessedRef.current) {
      return;
    }
    
    // Mark as processed immediately
    orderProcessedRef.current = true;
    
    setProcessingFreeOrder(true);
    setStripeError(null);

    try {
      // Generate an orderId with the consistent format
      const orderId = generateOrderId();

      // Create the order directly without going through Stripe
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/create`,
        {
          developerId: developerId,
          offerId: offerId, // Include offerId
          orderId: orderId, // Include orderId with new format
          title: title || `Free development service`,
          description: description || `${hours} hour${hours > 1 ? 's' : ''} of development work`,
          amount: "0.00",
          hours: hours,
          isPaid: true, // Mark as paid since it's free
          paymentMethod: "Free Service"
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Free order response:', response.data);

      // If order created successfully
      if (response.data && response.data.success) {
        // Navigate to success page
        navigate(`/success?orderId=${orderId}`);
      } else {
        throw new Error('Failed to create free order');
      }
    } catch (error) {
      console.error('Error creating free order:', error);
      setStripeError(
        error.response?.data?.message || 
        error.message || 
        'Failed to create free order'
      );
      // Navigate to cancel page if there's an error
      navigate(`/cancel?orderId=${offerId}`);
    } finally {
      setProcessingFreeOrder(false);
    }
  };

  const handlePayNow = async () => {
    // If already loading, don't proceed
    if (isLoading) {
      return;
    }
    
    // If it's a free order, handle it directly
    if (isFree) {
      await handleFreeOrder();
      return;
    }
    
    // Process paid order through Stripe
    setIsLoading(true);
    setStripeError(null);

    try {
      // Ensure we have required fields
      if (!offerId) {
        throw new Error('Offer ID is missing. Please try again.');
      }

      if (!developerId) {
        throw new Error('Developer ID is missing. Please try again.');
      }

      // Generate an orderId with consistent format
      const orderId = generateOrderId();

      // Save order details to localStorage
      localStorage.setItem('orderDetails', JSON.stringify({
        developerId,
        title,
        description,
        amount: displayAmount,
        originalAmount: isProSubscriber ? baseAmount : null,
        deliveryTime,
        revisions,
        meetingIncluded,
        hours,
        offerId,
        orderId,
        proDiscountApplied: isProSubscriber
      }));

      console.log('Creating payment session with:', {
        amount: parseFloat(displayAmount),
        description: title || "Custom Development Work",
        offerId: offerId,
        orderId: orderId,
        developerId: developerId,
        hours: hours,
        proDiscountApplied: isProSubscriber,
        successUrl: `${window.location.origin}/success?orderId=${orderId}`,
        cancelUrl: `${window.location.origin}/cancel?orderId=${orderId}`
      });

      // Create a payment session
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/payment/create-checkout-session`,
        {
          amount: parseFloat(displayAmount),
          description: title || "Custom Development Work",
          offerId: offerId,
          orderId: orderId,
          developerId: developerId,
          hours: hours,
          proDiscountApplied: isProSubscriber,
          originalAmount: isProSubscriber ? parseFloat(baseAmount) : null,
          successUrl: `${window.location.origin}/success?orderId=${orderId}`,
          cancelUrl: `${window.location.origin}/cancel?orderId=${orderId}`
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Log the response for debugging
      console.log('Payment session response:', response.data);

      // Check if the response is successful and has a URL
      if (response.data && response.data.success && response.data.url) {
        // Only mark order as processed right before redirection
        orderProcessedRef.current = true;
        
        // Use timeout to ensure the UI updates before redirection
        setTimeout(() => {
          // Redirect to Stripe payment page
          window.location.href = response.data.url;
          
          // Add a fallback in case the redirect doesn't happen immediately
          setTimeout(() => {
            if (document.visibilityState !== 'hidden') {
              // If we're still on the page after 2 seconds, show a message and link
              setStripeError(
                'Redirection to payment page is taking longer than expected. ' +
                'If you are not redirected automatically, please click Pay Now again.'
              );
              orderProcessedRef.current = false;
              setIsLoading(false);
            }
          }, 2000);
        }, 100);
      } else {
        console.error('Invalid response format:', response.data);
        throw new Error('No payment URL received from server');
      }
    } catch (error) {
      console.error('Error creating payment session:', error);
      setStripeError(
        error.response?.data?.message || 
        error.message || 
        'Failed to create payment session'
      );
      // Reset the processed flag if there's an error so user can try again
      orderProcessedRef.current = false;
      setIsLoading(false);
    }
  };

  // Handle successful payment
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('orderId');
      
      if (orderId) {
        // Trigger payment success event
        window.dispatchEvent(new CustomEvent('paymentSuccess', {
          detail: { orderId }
        }));
        
        // Navigate back to messages
        navigate('/inbox');
      }
    };

    handlePaymentSuccess();
  }, [navigate]);

  const handleCancel = () => {
    navigate('/inbox');
  };

  // If this is a free order and it's already processing, show a loading screen
  if (isFree && processingFreeOrder) {
    return (
      <Container fluid className="mt-5 text-center">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="shadow-sm p-4">
              <Card.Body>
                <h4 className="mb-4">Processing Free Booking</h4>
                <Spinner animation="border" role="status" className="mb-3" />
                <p>Please wait while we process your free booking...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  
  // Show loading screen while checking subscription
  if (isCheckingSubscription && !isFree) {
    return (
      <Container fluid className="mt-5 text-center">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="shadow-sm p-4">
              <Card.Body>
                <h4 className="mb-4">Checking Subscription</h4>
                <Spinner animation="border" role="status" className="mb-3" />
                <p>Please wait while we check your subscription status...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4 pb-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white py-3 d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Complete Your {isFree ? "Booking" : "Payment"}</h4>
              {isProSubscriber && !isFree && (
                <Badge bg="warning" text="dark" pill className="px-2 py-1">PRO</Badge>
              )}
            </Card.Header>
            <Card.Body>
              <h5 className="mb-4">{title || "Development Services"}</h5>
              
              {isProSubscriber && !isFree && (
                <Alert variant="success" className="d-flex justify-content-between align-items-center">
                  <span>
                    <strong>PRO Discount Applied!</strong> You're saving 20% with your Pro subscription.
                  </span>
                  <Badge bg="success" pill className="px-2 py-1">-20%</Badge>
                </Alert>
              )}
              
              {stripeError && (
                <Alert variant="danger">{stripeError}</Alert>
              )}
              
              <div className="mb-4">
                <h6 className="text-muted mb-3">Order Summary</h6>
                <ListGroup variant="flush" className="border rounded">
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span>Description</span>
                      <span className="text-truncate" style={{ maxWidth: '250px' }}>
                        {description || `${hours} hour${hours > 1 ? 's' : ''} of development work`}
                      </span>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span>Hours Booked</span>
                      <span>{hours} hour{hours !== 1 ? 's' : ''}</span>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span>Delivery Time</span>
                      <span>{deliveryTime} day{deliveryTime !== 1 ? 's' : ''}</span>
                    </div>
                  </ListGroup.Item>
                  {revisions > 0 && (
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span>Revisions</span>
                        <span>{revisions}</span>
                      </div>
                    </ListGroup.Item>
                  )}
                  {meetingIncluded && (
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span>Video Meeting</span>
                        <span>Included</span>
                      </div>
                    </ListGroup.Item>
                  )}
                  {/* Original price if Pro discount applied */}
                  {isProSubscriber && !isFree && (
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span>Original Price</span>
                        <span className="text-decoration-line-through">PKR {baseAmount}</span>
                      </div>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span>Sub Total</span>
                      <span>
                        {isFree ? "Free" : (
                          isProSubscriber 
                            ? <span className="text-success">PKR {displayAmount} <small className="text-muted">(with PRO discount)</small></span>
                            : `PKR ${displayAmount}`
                        )}
                      </span>
                    </div>
                  </ListGroup.Item>
                  {!isFree && (
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span>Tax</span>
                        <span>PKR 0.00</span>
                      </div>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item className="bg-light">
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total Amount</span>
                      <span>{isFree ? "Free" : `PKR ${displayAmount}`}</span>
                    </div>
                  </ListGroup.Item>
                </ListGroup>
              </div>
              
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handlePayNow}
                  disabled={isLoading || processingFreeOrder}
                  className="pay-button"
                >
                  {isLoading || processingFreeOrder ? 'Processing...' : (isFree ? 'Confirm Booking' : 'Pay Now')}
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={handleCancel}
                  disabled={isLoading || processingFreeOrder}
                >
                  Cancel
                </Button>
              </div>
              
              <div className="mt-4 text-center">
                <small className="text-muted">
                  {isFree 
                    ? "By proceeding, you agree to our Terms of Service."
                    : "Your payment is secure and encrypted. By proceeding, you agree to our Terms of Service."}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Pay;