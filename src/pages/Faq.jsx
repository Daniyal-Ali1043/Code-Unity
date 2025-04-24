import React, { useState } from 'react';
import { Container, Accordion, Card, Button, Row, Col, InputGroup, FormControl } from 'react-bootstrap';

const Faq = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // FAQ data
  const faqs = [
    {
      id: '1',
      question: 'What is CodeUnity?',
      answer: 'CodeUnity is a platform that connects students with professional developers for coding assistance, project support, and mentorship. It allows students to get help with their coding projects and assignments, while developers can offer their expertise and earn income.'
    },
    {
      id: '2',
      question: 'How does the payment system work?',
      answer: 'CodeUnity uses a secure payment system. When you place an order, the payment is held in escrow until the project is completed to your satisfaction. Once you accept the completed work, the developer receives the payment. This ensures that developers get paid for their work and students receive quality service.'
    },
    {
      id: '3',
      question: 'How do I create an account?',
      answer: 'To create an account, click on the "Sign Up" button on the homepage. Fill out the registration form with your details, verify your email address, and complete your profile. You can sign up as either a student seeking help or as a developer offering services.'
    },
    {
      id: '4',
      question: 'What is two-factor authentication and how do I set it up?',
      answer: 'Two-factor authentication (2FA) adds an extra layer of security to your account. After entering your password, you\'ll need to provide a second verification code sent to your email or phone. To enable 2FA, go to your account settings, select "Security," and follow the instructions to set up two-factor authentication.'
    },
    {
      id: '5',
      question: 'How do I place an order for coding help?',
      answer: 'To place an order, log in to your student account, browse available developers, and select one based on their expertise and ratings. Click "Hire" and fill out the project details form with your requirements, budget, and deadline. Once the developer accepts, payment will be processed, and work can begin.'
    },
    {
      id: '6',
      question: 'How can I apply to become a developer on CodeUnity?',
      answer: 'To become a developer on CodeUnity, sign up for an account and select "Apply as Developer" from your dashboard. Complete the application form detailing your skills, experience, and areas of expertise. Upload your resume and relevant documents. Our team will review your application, and if approved, you can start accepting projects.'
    },
    {
      id: '7',
      question: 'What happens if I\'m not satisfied with the work?',
      answer: 'If you\'re not satisfied with the work delivered, you can request revisions from the developer. If issues persist, you can open a dispute through our support system. Our team will review the case and may mediate or issue a refund depending on the circumstances.'
    }
  ];
  
  // Filter FAQs based on search term
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Container className="py-5">
      <Card className="shadow">
        <Card.Header as="h4" className="text-center bg-primary text-white py-3">
          Frequently Asked Questions
        </Card.Header>
        
        <Card.Body className="p-4">
          <Row className="mb-4">
            <Col md={8} className="mx-auto">
              <InputGroup>
                <FormControl
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSearchTerm('')}
                  >
                    Clear
                  </Button>
                )}
              </InputGroup>
            </Col>
          </Row>
          
          <Accordion defaultActiveKey="0" flush className="mb-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <Accordion.Item eventKey={index.toString()} key={faq.id}>
                  <Accordion.Header>
                    <span className="fw-bold">{faq.question}</span>
                  </Accordion.Header>
                  <Accordion.Body className="bg-light">
                    <p>{faq.answer}</p>
                  </Accordion.Body>
                </Accordion.Item>
              ))
            ) : (
              <Card className="text-center p-4">
                <Card.Body>
                  <p>No results found for "{searchTerm}"</p>
                  <Button 
                    variant="primary" 
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Accordion>
          
          <Card className="bg-light p-3 mt-4">
            <Card.Body>
              <h5>Still have questions?</h5>
              <p>If you couldn't find the answer to your question, please submit a complaint or contact our support team.</p>
              <Button 
                variant="primary" 
                onClick={() => window.location.href = '/complaint'}
              >
                Submit a Complaint
              </Button>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Faq; 