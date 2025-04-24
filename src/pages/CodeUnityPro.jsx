import React, { useState, useEffect } from 'react';
import { Check, X, Crown, Star, AlertCircle } from 'lucide-react';
import { Alert, Spinner } from 'react-bootstrap';

// Retrieve the base URL from environment variables
const baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const CodeUnityProPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isPro: false,
    status: null,
    endDate: null
  });
  
  // Fetch subscription status on component mount
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return;
        }
        
        const response = await fetch(`${baseURL}/api/subscription/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }
        
        const data = await response.json();
        setSubscriptionStatus(data);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        // Don't set error state, just log it, as this is not a critical error
      }
    };
    
    fetchSubscriptionStatus();
  }, []);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle upgrade button click
  const handleUpgradeClick = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await fetch(`${baseURL}/api/subscription/create-checkout-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect user to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ur-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="mb-3 fw-bold">Upgrade Your Coding Experience</h1>
        <p className="lead text-muted">Choose the plan that's right for you</p>
        
        {/* Subscription Status Alert */}
        {subscriptionStatus.isPro && (
          <Alert variant="success" className="d-inline-block mt-3">
            <div className="d-flex align-items-center">
              <Crown size={20} className="me-2 text-warning" />
              <div>
                <strong>You are a CodeUnity Pro member!</strong>
                <div className="small">
                  Status: {subscriptionStatus.status}
                  {subscriptionStatus.endDate && (
                    <span> • Next billing date: {formatDate(subscriptionStatus.endDate)}</span>
                  )}
                </div>
              </div>
            </div>
          </Alert>
        )}
        
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mt-3">
            <AlertCircle size={20} className="me-2" />
            {error}
          </Alert>
        )}
      </div>
      
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="card shadow mb-5">
            <div className="card-header bg-white border-0 pt-4 pb-0">
              <div className="row align-items-center">
                <div className="col-4">
                  <h5 className="fw-bold">Plan</h5>
                </div>
                <div className="col-4">
                  <div className="p-3 rounded-3 bg-light">
                    <h5 className="fw-bold mb-1">Free</h5>
                    <p className="mb-0 text-muted">Basic access</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 rounded-3 text-white" style={{background: "linear-gradient(90deg, #4e54c8, #8f94fb)"}}>
                    <div className="bg-white text-dark px-2 py-1 rounded-pill d-inline-flex align-items-center mb-2" style={{fontSize: "12px"}}>
                      <Crown size={12} className="me-1 text-warning" />
                      Recommended
                    </div>
                    <h5 className="fw-bold mb-1">Pro</h5>
                    <p className="mb-0">Enhanced access</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-body">
              <div className="row border-bottom py-4">
                <div className="col-4 d-flex align-items-center">
                  <h6 className="mb-0 fw-bold">Price</h6>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span>Free</span>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span className="fw-bold">{formatCurrency(20)} / month</span>
                </div>
              </div>
              
              <div className="row border-bottom py-4">
                <div className="col-4 d-flex align-items-center">
                  <h6 className="mb-0 fw-bold">Community Access</h6>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span>Basic discussions</span>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span className="fw-bold">Priority access to all discussions</span>
                </div>
              </div>
              
              <div className="row border-bottom py-4">
                <div className="col-4 d-flex align-items-center">
                  <h6 className="mb-0 fw-bold">Expert Help</h6>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <X size={24} color="#dc3545" />
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <Check size={24} color="#198754" />
                </div>
              </div>
              
              <div className="row border-bottom py-4">
                <div className="col-4 d-flex align-items-center">
                  <h6 className="mb-0 fw-bold">Code Reviews</h6>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span>2 per month</span>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span className="fw-bold">Unlimited</span>
                </div>
              </div>
              
              <div className="row border-bottom py-4">
                <div className="col-4 d-flex align-items-center">
                  <h6 className="mb-0 fw-bold">Private Messaging</h6>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <X size={24} color="#dc3545" />
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <Check size={24} color="#198754" />
                </div>
              </div>
              
              <div className="row border-bottom py-4">
                <div className="col-4 d-flex align-items-center">
                  <h6 className="mb-0 fw-bold">Development Resources</h6>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span>Limited access</span>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span className="fw-bold">Full access to premium resources</span>
                </div>
              </div>
              
              <div className="row border-bottom py-4">
                <div className="col-4 d-flex align-items-center">
                  <h6 className="mb-0 fw-bold">Profile Badge</h6>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <X size={24} color="#dc3545" />
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <div className="d-flex align-items-center">
                    <Crown size={16} className="me-1 text-warning" />
                    <span className="fw-bold">Pro Badge</span>
                  </div>
                </div>
              </div>
              
              <div className="row border-bottom py-4">
                <div className="col-4 d-flex align-items-center">
                  <h6 className="mb-0 fw-bold">Money-back Guarantee</h6>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span>-</span>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span className="fw-bold">30-day money-back guarantee</span>
                </div>
              </div>
              
              <div className="row border-bottom py-4">
                <div className="col-4 d-flex align-items-center">
                  <h6 className="mb-0 fw-bold">Discount on All Orders</h6>
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <X size={24} color="#dc3545" />
                </div>
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span className="fw-bold">20% off on all orders</span>
                </div>
              </div>
            </div>
            
            <div className="card-footer bg-white border-0 py-4">
              <div className="row">
                <div className="col-4"></div>
                <div className="col-4 text-center">
                  <p className="text-muted mb-3">
                    {subscriptionStatus.isPro ? 'Current plan' : 'Free plan'}
                  </p>
                </div>
                <div className="col-4 text-center">
                  <button 
                    className="btn btn-lg fw-bold text-white py-3 px-4 rounded-pill w-100"
                    style={{
                      background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
                      boxShadow: "0 4px 15px rgba(78, 84, 200, 0.4)"
                    }}
                    onClick={handleUpgradeClick}
                    disabled={loading || (subscriptionStatus.isPro && subscriptionStatus.status === 'active')}
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
                    ) : subscriptionStatus.isPro ? (
                      'Already Pro'
                    ) : (
                      'Upgrade to Pro'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h5 className="mb-4">Frequently Asked Questions</h5>
            <div className="accordion" id="proFAQ">
              <div className="accordion-item border mb-3 rounded">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                    What is CodeUnity Pro?
                  </button>
                </h2>
                <div id="faq1" className="accordion-collapse collapse" data-bs-parent="#proFAQ">
                  <div className="accordion-body">
                    CodeUnity Pro is our premium subscription that offers enhanced features like unlimited code reviews, expert help, private messaging, and access to premium resources to accelerate your coding journey.
                  </div>
                </div>
              </div>
              
              <div className="accordion-item border mb-3 rounded">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                    Can I cancel my subscription anytime?
                  </button>
                </h2>
                <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#proFAQ">
                  <div className="accordion-body">
                    Yes, you can cancel your CodeUnity Pro subscription at any time. Your benefits will continue until the end of your current billing period.
                  </div>
                </div>
              </div>
              
              <div className="accordion-item border mb-3 rounded">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                    How does the money-back guarantee work?
                  </button>
                </h2>
                <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#proFAQ">
                  <div className="accordion-body">
                    If you're not satisfied with CodeUnity Pro within the first 30 days of your subscription, you can request a full refund. Simply contact our support team, and we'll process your refund with no questions asked.
                  </div>
                </div>
              </div>
              
              <div className="accordion-item border mb-3 rounded">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
                    How does the 20% discount work?
                  </button>
                </h2>
                <div id="faq4" className="accordion-collapse collapse" data-bs-parent="#proFAQ">
                  <div className="accordion-body">
                    As a CodeUnity Pro member, you automatically receive a 20% discount on all orders you place with developers. This discount is applied at checkout and helps you save money on every project.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeUnityProPage;