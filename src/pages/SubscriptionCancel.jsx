import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { XCircle } from 'lucide-react';

const SubscriptionCancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set a timeout to automatically redirect to the Pro page after 5 seconds
    const redirectTimer = setTimeout(() => {
      navigate('/codeunitypro');
    }, 5000);
    
    // Clean up the timer on component unmount
    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Card className="shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
          <Card.Body className="p-5 text-center">
            <div className="mb-4 text-center">
              <div 
                className="mx-auto mb-3 d-flex justify-content-center align-items-center rounded-circle" 
                style={{ 
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  width: '80px',
                  height: '80px'
                }}
              >
                <XCircle size={40} color="#dc3545" />
              </div>
              <h2 className="mb-3">Subscription Cancelled</h2>
              <Alert variant="warning" className="mb-4">
                You've cancelled the CodeUnity Pro subscription process
              </Alert>
              <p>
                You didn't complete the subscription process. No charges have been made to your account.
              </p>
              <p className="text-muted mb-4">
                You can try again anytime when you're ready to enjoy the benefits of CodeUnity Pro, 
                including 20% discount on all orders.
              </p>
              <p className="text-muted mb-4">You'll be redirected to the Pro page in a few seconds...</p>
              <div className="d-flex flex-column gap-2">
                <Button 
                  variant="primary" 
                  className="d-block w-100"
                  onClick={() => navigate('/codeunitypro')}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline-secondary" 
                  className="d-block w-100"
                  onClick={() => navigate('/studentdashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default SubscriptionCancel; 