import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, Container, Card, Button, Spinner } from 'react-bootstrap';
import { Crown, Check } from 'lucide-react';

const SubscriptionSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  
  // Extract session_id from URL query params
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // Set a timeout to automatically redirect to the dashboard after 5 seconds
    const redirectTimer = setTimeout(() => {
      if (!error) {
        navigate('/studentdashboard');
      }
    }, 5000);
    
    // Verify the subscription with the backend
    const verifySubscription = async () => {
      try {
        setLoading(true);
        
        // If no session ID, just show success but don't verify
        if (!sessionId) {
          setLoading(false);
          return;
        }
        
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found");
        }
        
        // Optional: verify the subscription on the backend
        const response = await fetch(`${baseURL}/api/subscription/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to verify subscription');
        }
        
        // Successfully verified
        setLoading(false);
      } catch (err) {
        console.error('Error verifying subscription:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    verifySubscription();
    
    // Clean up the timer on component unmount
    return () => clearTimeout(redirectTimer);
  }, [sessionId, navigate, baseURL]);
  
  return (
    <Container className="py-5">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Card className="shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
          <Card.Body className="p-5 text-center">
            {loading ? (
              <div className="text-center p-4">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <h3>Confirming your subscription...</h3>
                <p className="text-muted">Please wait a moment while we set up your CodeUnity Pro account.</p>
              </div>
            ) : error ? (
              <div>
                <Alert variant="danger" className="mb-4">{error}</Alert>
                <Button 
                  variant="outline-primary" 
                  className="d-block w-100"
                  onClick={() => navigate('/studentdashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-4 text-center">
                  <div 
                    className="mx-auto mb-3 d-flex justify-content-center align-items-center rounded-circle" 
                    style={{ 
                      background: 'linear-gradient(90deg, #4e54c8, #8f94fb)',
                      width: '80px',
                      height: '80px'
                    }}
                  >
                    <Crown size={40} color="white" />
                  </div>
                  <h2 className="mb-3">Welcome to CodeUnity Pro!</h2>
                  <Alert variant="success" className="mb-4">
                    <Check size={20} className="me-2" />
                    Your subscription was successful
                  </Alert>
                  <p>You now have access to all our premium features including:</p>
                  <ul className="list-unstyled text-start mb-4">
                    <li className="mb-2"><Check size={16} className="me-2 text-success" /> 20% discount on all orders</li>
                    <li className="mb-2"><Check size={16} className="me-2 text-success" /> Unlimited code reviews</li>
                    <li className="mb-2"><Check size={16} className="me-2 text-success" /> Private messaging with developers</li>
                    <li className="mb-2"><Check size={16} className="me-2 text-success" /> Premium learning resources</li>
                  </ul>
                  <p className="text-muted mb-4">You'll be redirected to your dashboard in a few seconds...</p>
                  <div>
                    <Button 
                      variant="primary" 
                      className="d-block w-100"
                      onClick={() => navigate('/studentdashboard')}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default SubscriptionSuccess; 