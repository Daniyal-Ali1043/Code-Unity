import React, { useState } from 'react';
import { Alert, Button, Card, Container, Spinner } from 'react-bootstrap';
import { CheckCircle, AlertCircle } from 'lucide-react';

const SetProStatus = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [responseData, setResponseData] = useState(null);
  
  const baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  
  const handleSetPro = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setResponseData(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await fetch(`${baseURL}/api/subscription/debug-set-pro`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to set Pro status');
      }
      
      setSuccess(true);
      setResponseData(data);
      
      // Reload the page after a short delay to refresh header state
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Error setting Pro status:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container className="py-5">
      <Card className="shadow-lg mx-auto" style={{ maxWidth: '600px' }}>
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Debug: Set Pro Status</h4>
        </Card.Header>
        <Card.Body className="p-4">
          <p className="mb-4">
            This is a debug page to manually set your account to Pro status. 
            Use this only for testing purposes.
          </p>
          
          {error && (
            <Alert variant="danger" className="d-flex align-items-center mb-4">
              <AlertCircle size={20} className="me-2" />
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="d-flex align-items-center mb-4">
              <CheckCircle size={20} className="me-2" />
              Pro status set successfully! Reloading page...
            </Alert>
          )}
          
          {responseData && (
            <div className="mb-4">
              <h5>Response Data:</h5>
              <pre className="bg-light p-3 rounded" style={{ fontSize: '0.8rem' }}>
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          )}
          
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleSetPro}
            disabled={loading || success}
            className="w-100"
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Processing...
              </>
            ) : (
              'Set My Account to Pro Status'
            )}
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SetProStatus; 