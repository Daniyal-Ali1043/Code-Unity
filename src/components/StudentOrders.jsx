import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentOrders = ({ isDarkMode }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
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
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/student`,
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
    
    // Add 2 second skeleton loading
    const timer = setTimeout(() => {
      setSkeletonLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
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
    navigate(`/studentorders/${orderId}`);
  };

  // Styles for dark mode
  const styles = {
    container: {
      backgroundColor: isDarkMode ? 'transparent' : 'inherit',
      color: isDarkMode ? '#fff' : 'inherit'
    },
    card: {
      backgroundColor: isDarkMode ? '#343a40' : '#fff',
      color: isDarkMode ? '#fff' : 'inherit',
      borderColor: isDarkMode ? '#495057' : 'rgba(0,0,0,.125)'
    },
    cardHeader: {
      backgroundColor: isDarkMode ? '#2c3034' : '#0d6efd',
      color: '#fff', // Always white text for good contrast
      borderBottom: isDarkMode ? '1px solid #495057' : '1px solid rgba(0,0,0,.125)'
    },
    table: {
      color: isDarkMode ? '#fff' : 'inherit'
    },
    tableHeader: {
      backgroundColor: isDarkMode ? '#2c3034' : 'inherit',
      color: isDarkMode ? '#fff' : 'inherit',
      borderColor: isDarkMode ? '#495057' : 'rgba(0,0,0,.125)'
    },
    tableRow: {
      backgroundColor: isDarkMode ? '#343a40' : 'inherit',
      color: isDarkMode ? '#fff' : 'inherit',
      borderColor: isDarkMode ? '#495057' : 'rgba(0,0,0,.125)'
    },
    tableRowHover: {
      backgroundColor: isDarkMode ? '#424649' : '#f8f9fa'
    },
    muted: {
      color: isDarkMode ? '#adb5bd' : '#6c757d'
    },
    alert: {
      backgroundColor: isDarkMode ? '#224055' : '#cff4fc',
      color: isDarkMode ? '#fff' : '#055160',
      borderColor: isDarkMode ? '#1b3548' : '#b6effb'
    },
    skeleton: {
      background: isDarkMode 
        ? 'linear-gradient(90deg, #444 25%, #555 50%, #444 75%)'
        : 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)'
    }
  };

  // Skeleton loader component for table rows
  const SkeletonRow = () => (
    <tr style={styles.tableRow}>
      <td><div className="skeleton-loader" style={{ ...styles.skeleton, width: '80px', height: '20px' }}></div></td>
      <td><div className="skeleton-loader" style={{ ...styles.skeleton, width: '150px', height: '20px' }}></div></td>
      <td><div className="skeleton-loader" style={{ ...styles.skeleton, width: '100px', height: '20px' }}></div></td>
      <td><div className="skeleton-loader" style={{ ...styles.skeleton, width: '80px', height: '20px' }}></div></td>
      <td><div className="skeleton-loader" style={{ ...styles.skeleton, width: '100px', height: '20px' }}></div></td>
      <td><div className="skeleton-loader" style={{ ...styles.skeleton, width: '80px', height: '20px' }}></div></td>
      <td><div className="skeleton-loader" style={{ ...styles.skeleton, width: '100px', height: '30px' }}></div></td>
    </tr>
  );
  
  // Display spinner if real loading is happening but skeleton is done
  if (loading && !skeletonLoading) {
    return (
      <Container className="mt-5 text-center" style={styles.container}>
        <Spinner animation="border" role="status" variant={isDarkMode ? "light" : "primary"}>
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  
  if (error && !skeletonLoading) {
    return (
      <Container className="mt-5" style={styles.container}>
        <Alert variant={isDarkMode ? "dark" : "danger"} style={isDarkMode ? { backgroundColor: '#442a2a', color: '#f1aeb5', borderColor: '#58151c' } : {}}>
          {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4 mb-5" style={styles.container}>
      <style>
        {`
          .skeleton-loader {
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
          }
          
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          
          .table-hover tbody tr:hover {
            background-color: ${isDarkMode ? '#424649' : '#f8f9fa'} !important;
          }
        `}
      </style>
      <Row>
        <Col>
          <Card className="shadow-sm" style={styles.card}>
            <Card.Header style={styles.cardHeader}>
              <h4 className="mb-0">My Orders</h4>
            </Card.Header>
            <Card.Body style={styles.card}>
              {skeletonLoading ? (
                // Skeleton loading state
                <Table responsive hover className="mt-3" style={styles.table}>
                  <thead>
                    <tr>
                      {['Order ID', 'Title', 'Developer', 'Amount', 'Date', 'Status', 'Action'].map((header, idx) => (
                        <th key={idx} style={styles.tableHeader}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, index) => (
                      <SkeletonRow key={index} />
                    ))}
                  </tbody>
                </Table>
              ) : orders.length === 0 ? (
                <Alert variant={isDarkMode ? "dark" : "info"} style={styles.alert}>
                  You don't have any orders yet. Find a developer to place your first order!
                </Alert>
              ) : (
                <Table responsive hover className="mt-3" style={styles.table}>
                  <thead>
                    <tr>
                      {['Order ID', 'Title', 'Developer', 'Amount', 'Date', 'Status', 'Action'].map((header, idx) => (
                        <th key={idx} style={styles.tableHeader}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.orderId} style={styles.tableRow}>
                        <td>
                          <small style={styles.muted}>{order.orderId}</small>
                        </td>
                        <td>{order.title}</td>
                        <td>{order.developer}</td>
                        <td>PKR {order.amount}</td>
                        <td>{formatDate(order.startDate)}</td>
                        <td>
                          <Badge bg={getStatusBadgeVariant(order.status)}>
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

export default StudentOrders;