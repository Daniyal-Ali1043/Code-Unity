import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { FaTimesCircle } from 'react-icons/fa';

const Cancel = () => {
  const navigate = useNavigate();

  const handleBackToInbox = () => {
    navigate('/inbox');
  };

  const handleBackToHome = () => {
    navigate('/studentdashboard');
  };

  return (
    <Container className="mt-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-danger text-white">
          <h4 className="mb-0 text-center">Payment Cancelled</h4>
        </Card.Header>
        <Card.Body className="text-center">
          <div className="d-flex justify-content-center mb-4">
            <FaTimesCircle size={64} color="#dc3545" />
          </div>
          <h5 className="mb-3">Payment was cancelled</h5>
          <p className="text-muted mb-4">
            Your payment was not completed. You can try again later.
          </p>
          <Row className="justify-content-center">
            <Col xs={12} sm={6} className="mb-2 mb-sm-0 pe-sm-1">
              <Button 
                variant="primary" 
                onClick={handleBackToInbox}
                className="w-100"
              >
                Back to Inbox
              </Button>
            </Col>
            <Col xs={12} sm={6} className="ps-sm-1">
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

export default Cancel;