import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DeveloperOrders = ({ isDarkMode }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }
        
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/developer`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        if (response.data && response.data.orders) {
          setOrders(response.data.orders);
        } else {
          throw new Error('Invalid data received from server');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
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
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // Format date as MMM DD, YYYY (e.g., "Jan 01, 2023")
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };
  
  const handleViewOrder = (orderId) => {
    navigate(`/developerorders/${orderId}`);
  };
  
  if (loading) {
    return (
      <Container 
        className="mt-5 text-center" 
        style={{ 
          backgroundColor: isDarkMode ? '#212529' : 'inherit',
          color: isDarkMode ? '#e9ecef' : 'inherit'
        }}
      >
        <Spinner 
          animation="border" 
          role="status" 
          variant={isDarkMode ? "light" : "primary"}
        >
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container 
        className="mt-5"
        style={{ 
          backgroundColor: isDarkMode ? '#212529' : 'inherit',
          color: isDarkMode ? '#e9ecef' : 'inherit'
        }}
      >
        <Alert variant={isDarkMode ? "danger-subtle" : "danger"}>{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container 
      className="mt-4 mb-5" 
      style={{ 
        backgroundColor: isDarkMode ? '#212529' : 'inherit',
        color: isDarkMode ? '#e9ecef' : 'inherit'
      }}
    >
      <Row>
        <Col>
          <Card 
            className="shadow-sm" 
            style={{ 
              backgroundColor: isDarkMode ? '#343a40' : 'white',
              color: isDarkMode ? '#e9ecef' : 'inherit'
            }}
          >
            <Card.Header 
              className={`${isDarkMode ? 'bg-secondary' : 'bg-primary'} text-white`}
            >
              <h4 className="mb-0">My Client Orders</h4>
            </Card.Header>
            <Card.Body>
              {orders.length === 0 ? (
                <Alert 
                  variant={isDarkMode ? "secondary" : "info"}
                  style={{ 
                    backgroundColor: isDarkMode ? '#495057' : undefined,
                    color: isDarkMode ? '#e9ecef' : undefined
                  }}
                >
                  You don't have any client orders yet. They will appear here once students place orders.
                </Alert>
              ) : (
                <Table 
                  responsive 
                  hover 
                  className="mt-3" 
                  variant={isDarkMode ? "dark" : undefined}
                >
                  <thead>
                    <tr>
                      <th style={{ color: isDarkMode ? '#e9ecef' : undefined }}>Order ID</th>
                      <th style={{ color: isDarkMode ? '#e9ecef' : undefined }}>Title</th>
                      <th style={{ color: isDarkMode ? '#e9ecef' : undefined }}>Client</th>
                      <th style={{ color: isDarkMode ? '#e9ecef' : undefined }}>Amount</th>
                      <th style={{ color: isDarkMode ? '#e9ecef' : undefined }}>Date</th>
                      <th style={{ color: isDarkMode ? '#e9ecef' : undefined }}>Status</th>
                      <th style={{ color: isDarkMode ? '#e9ecef' : undefined }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr 
                        key={order.orderId}
                        style={{ 
                          backgroundColor: isDarkMode ? '#495057' : undefined,
                          color: isDarkMode ? '#e9ecef' : undefined
                        }}
                      >
                        <td>
                          <small 
                            className={`${isDarkMode ? 'text-light-subtle' : 'text-muted'}`}
                          >
                            {order.orderId}
                          </small>
                        </td>
                        <td>{order.title}</td>
                        <td>{order.student}</td>
                        <td>PKR {order.amount}</td>
                        <td>{formatDate(order.startDate)}</td>
                        <td>
                          <Badge 
                            bg={getStatusBadgeVariant(order.status)}
                            style={{ 
                              backgroundColor: isDarkMode 
                                ? (order.status === 'pending' ? '#ffc107' : 
                                   order.status === 'in-progress' ? '#0d6efd' :
                                   order.status === 'delivered' ? '#0dcaf0' :
                                   order.status === 'completed' ? '#198754' :
                                   order.status === 'cancelled' ? '#dc3545' : '#6c757d')
                                : undefined
                            }}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant={isDarkMode ? "outline-light" : "outline-primary"} 
                            size="sm"
                            onClick={() => handleViewOrder(order.orderId)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DeveloperOrders;