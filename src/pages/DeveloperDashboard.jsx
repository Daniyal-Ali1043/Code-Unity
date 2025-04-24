import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { Line, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import axios from 'axios';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import Messages from '../components/ComMessages';
import DiscussionForum from '../pages/DiscussionForum';
import HelpButton from '../components/HelpButton';

const DeveloperDashboard = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [selectedPage, setSelectedPage] = useState('dashboard'); // Default page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    orderStats: { pending: 0, inProgress: 0, completed: 0, cancelled: 0, total: 0 },
    revenueOverview: { labels: [], datasets: [] },
    ratings: { average: 0, count: 0 },
    recentOrders: []
  });

  // State for projects data (developer's orders)
  const [projects, setProjects] = useState([]);
  
  // State for participants data (conversations)
  const [participants, setParticipants] = useState([]);
  
  // Order time data based on orders' start dates (morning, afternoon, evening)
  const [orderTimeData, setOrderTimeData] = useState({
    labels: ['Morning', 'Afternoon', 'Evening'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#1E90FF', '#ADD8E6', '#4682B4'] }]
  });

  // Styles for dark mode
  const styles = {
    container: {
      backgroundColor: isDarkMode ? '#212529' : '#ffffff',
      color: isDarkMode ? '#e9ecef' : '#212529'
    },
    card: {
      backgroundColor: isDarkMode ? '#343a40' : '#ffffff',
      color: isDarkMode ? '#e9ecef' : '#212529',
      borderColor: isDarkMode ? '#495057' : 'rgba(0,0,0,.125)'
    },
    tableHeader: {
      backgroundColor: isDarkMode ? '#2c3034' : '#f8f9fa',
      color: isDarkMode ? '#e9ecef' : '#212529',
      borderColor: isDarkMode ? '#495057' : 'rgba(0,0,0,.125)'
    },
    tableRow: {
      backgroundColor: isDarkMode ? '#343a40' : '#ffffff',
      color: isDarkMode ? '#e9ecef' : '#212529',
      borderColor: isDarkMode ? '#495057' : 'rgba(0,0,0,.125)'
    },
    tableRowAlt: {
      backgroundColor: isDarkMode ? '#2c3034' : '#f2f2f2',
      color: isDarkMode ? '#e9ecef' : '#212529',
      borderColor: isDarkMode ? '#495057' : 'rgba(0,0,0,.125)'
    },
    button: {
      backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
      color: isDarkMode ? '#e9ecef' : '#0d6efd',
      borderColor: isDarkMode ? '#6c757d' : '#0d6efd'
    },
    linkButton: {
      color: isDarkMode ? '#8bbeff' : '#0d6efd'
    },
    headingText: {
      color: isDarkMode ? '#e9ecef' : '#212529'
    },
    mutedText: {
      color: isDarkMode ? '#adb5bd' : '#6c757d'
    },
    chartContainer: {
      backgroundColor: isDarkMode ? '#343a40' : '#ffffff'
    },
    skeletonBaseColor: isDarkMode ? '#343a40' : '#f0f0f0',
    skeletonHighlightColor: isDarkMode ? '#495057' : '#e0e0e0'
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // Fetch developer dashboard data
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/dashboard/developer`, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Fetch developer orders to calculate order time distribution and populate projects table
        const ordersResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/developer`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data && ordersResponse.data) {
          setDashboardData(response.data);
          
          // Process orders to get time distribution data
          calculateOrderTimeDistribution(ordersResponse.data.orders);
          
          // Format orders for projects table
          if (ordersResponse.data.orders && Array.isArray(ordersResponse.data.orders)) {
            const formattedProjects = ordersResponse.data.orders.map(order => ({
              title: order.title || 'Untitled Project',
              budget: order.amount ? `PKR ${order.amount.toLocaleString()}` : 'N/A',
              status: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'
            }));
            
            setProjects(formattedProjects);
          }
        }
        
        // Fetch developer profile to get the developer ID
        const developerProfileResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/developers/profile`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (developerProfileResponse.data && developerProfileResponse.data._id) {
          const developerId = developerProfileResponse.data._id;
          
          // Fetch conversations for the developer
          const conversationsResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/conversations/receiver/${developerId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          if (conversationsResponse.data && Array.isArray(conversationsResponse.data)) {
            // Format conversations for participants table
            const formattedParticipants = conversationsResponse.data.map(conv => ({
              name: conv.sender?.username || 'Unknown User',
              message: conv.messages?.[0]?.text 
                ? conv.messages[0].isHTML 
                  ? "Video call invitation"
                  : truncateText(conv.messages[0].text, 25)
                : conv.messages?.[0]?.fileUrl
                ? "1 File"
                : "No messages yet",
              action: 'Reply',
              conversationId: conv._id
            }));
            
            setParticipants(formattedParticipants);
          }
        }
        
        // Add a 2-second delay before hiding the skeleton loading
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    
    // Check if the text is HTML
    if (text.includes('<div') || text.includes('<p')) {
      // For HTML content, return a generic description
      if (text.includes('offer-container')) {
        return 'Project offer';
      } else if (text.includes('video-call-invitation')) {
        return 'Video call invitation';
      } else {
        return 'HTML message';
      }
    }
    
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  // Function to calculate order time distribution
  const calculateOrderTimeDistribution = (orders) => {
    if (!orders || orders.length === 0) return;
    
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    
    orders.forEach(order => {
      if (!order.startDate) return;
      
      const startTime = new Date(order.startDate);
      const hours = startTime.getHours();
      
      if (hours >= 5 && hours < 12) {
        morningCount++;
      } else if (hours >= 12 && hours < 17) {
        afternoonCount++;
      } else {
        eveningCount++;
      }
    });
    
    const totalOrders = morningCount + afternoonCount + eveningCount;
    
    // Calculate percentages
    const morningPercentage = totalOrders > 0 ? Math.round((morningCount / totalOrders) * 100) : 0;
    const afternoonPercentage = totalOrders > 0 ? Math.round((afternoonCount / totalOrders) * 100) : 0;
    const eveningPercentage = totalOrders > 0 ? Math.round((eveningCount / totalOrders) * 100) : 0;
    
    setOrderTimeData({
      labels: ['Morning', 'Afternoon', 'Evening'],
      datasets: [{
        data: [morningPercentage, afternoonPercentage, eveningPercentage],
        backgroundColor: ['#1E90FF', '#ADD8E6', '#4682B4'],
        hoverBackgroundColor: ['#0000FF', '#87CEFA', '#4169E1']
      }]
    });
  };

  // Function to render star rating
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add filled stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-warning" size={30} />);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-warning" style={{ opacity: 0.5 }} size={30} />);
    }
    
    // Add empty stars
    const emptyStarsCount = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStarsCount; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-warning" size={30} />);
    }
    
    return stars;
  };

  // Handle navigation to inbox for replying to a conversation
  const handleReplyClick = () => {
    navigate('/inbox');
  };

  const handleSidebarSelection = (page) => {
    setSelectedPage(page); // Update selected page based on sidebar selection
  };

  const renderContent = () => {
    if (selectedPage === 'messages') {
      return (
        <div className="message-container" style={styles.container}>
          <h5 style={styles.headingText}>Messages</h5>
          <Messages isDarkMode={isDarkMode} />
        </div>
      );
    } else if (selectedPage === 'notifications') {
      return (
        <div className="notification-container" style={styles.container}>
          <h5 style={styles.headingText}>Notifications</h5>
          <Notifications isDarkMode={isDarkMode} />
        </div>
      );
    } else if (selectedPage === 'forum') {
      // Add condition for Discussion Forum
      return (
        <div className="discussion-forum-container" style={styles.container}>
          <h5 className="text-center" style={styles.headingText}>Discussion Forum</h5>
          <DiscussionForum isDarkMode={isDarkMode} />
        </div>
      );
    } else {
      // Default: Dashboard content
      return (
        <div className="dashboard-content" style={styles.container}>
          {/* Top Section with skeleton loading */}
          <div className="row g-4">
            <div className="col-lg-6">
              <Card className="shadow-sm h-100" style={styles.card}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 style={styles.headingText}>Revenue</h5>
                    <Button 
                      variant={isDarkMode ? "outline-light" : "outline-primary"} 
                      size="sm"
                    >
                      View Report
                    </Button>
                  </div>
                  {loading ? (
                    <>
                      <Skeleton 
                        height={40} 
                        width={200} 
                        className="mb-2" 
                        baseColor={styles.skeletonBaseColor}
                        highlightColor={styles.skeletonHighlightColor}
                      />
                      <Skeleton 
                        height={20} 
                        width={150} 
                        baseColor={styles.skeletonBaseColor}
                        highlightColor={styles.skeletonHighlightColor}
                      />
                      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Skeleton 
                          height={180} 
                          width="100%" 
                          baseColor={styles.skeletonBaseColor}
                          highlightColor={styles.skeletonHighlightColor}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 style={styles.headingText}>PKR {dashboardData.totalRevenue.toLocaleString()}</h2>
                      <small style={styles.mutedText}>
                        Based on completed orders
                      </small>
                      <div style={{ height: '200px' }}>
                        <Line
                          data={{
                            labels: dashboardData.revenueOverview?.labels || [],
                            datasets: dashboardData.revenueOverview?.datasets.map(dataset => ({
                              ...dataset,
                              borderColor: isDarkMode ? '#8bbeff' : dataset.borderColor,
                              backgroundColor: isDarkMode ? 'rgba(139, 190, 255, 0.1)' : dataset.backgroundColor
                            })) || []
                          }}
                          options={{ 
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                labels: {
                                  color: isDarkMode ? '#e9ecef' : '#212529'
                                }
                              }
                            },
                            scales: {
                              x: {
                                ticks: {
                                  color: isDarkMode ? '#adb5bd' : '#666'
                                },
                                grid: {
                                  color: isDarkMode ? '#495057' : '#ddd'
                                }
                              },
                              y: {
                                ticks: {
                                  color: isDarkMode ? '#adb5bd' : '#666'
                                },
                                grid: {
                                  color: isDarkMode ? '#495057' : '#ddd'
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </div>

            <div className="col-lg-6">
              <Card className="shadow-sm h-100" style={styles.card}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 style={styles.headingText}>Order Time</h5>
                    <Button 
                      variant={isDarkMode ? "outline-light" : "outline-primary"} 
                      size="sm"
                    >
                      View Report
                    </Button>
                  </div>
                  {loading ? (
                    <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '240px' }}>
                      <Skeleton 
                        circle 
                        height={200} 
                        width={200} 
                        baseColor={styles.skeletonBaseColor}
                        highlightColor={styles.skeletonHighlightColor}
                      />
                      <Skeleton 
                        height={20} 
                        width={150} 
                        className="mt-3" 
                        baseColor={styles.skeletonBaseColor}
                        highlightColor={styles.skeletonHighlightColor}
                      />
                    </div>
                  ) : (
                    <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '240px' }}>
                      <div className="mb-3" style={{ width: '80%', maxWidth: '240px' }}>
                        <Doughnut
                          data={orderTimeData}
                          options={{ 
                            maintainAspectRatio: true, 
                            responsive: true,
                            plugins: {
                              legend: {
                                labels: {
                                  color: isDarkMode ? '#e9ecef' : '#212529'
                                }
                              }
                            }
                          }}
                        />
                      </div>
                      <p className="text-center" style={styles.headingText}>
                        {orderTimeData.datasets[0].data[1] > 0 && 
                          `Afternoon orders: ${orderTimeData.datasets[0].data[1]}%`}
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>

          {/* Rating and Orders Section */}
          <div className="row g-4 mt-4">
            <div className="col-lg-6">
              <Card className="shadow-sm h-100" style={styles.card}>
                <Card.Body>
                  <h5 style={styles.headingText}>Your Rating</h5>
                  {loading ? (
                    <div className="d-flex flex-column align-items-center mt-3">
                      <div className="d-flex mb-2">
                        <Skeleton 
                          width={180} 
                          height={40} 
                          baseColor={styles.skeletonBaseColor}
                          highlightColor={styles.skeletonHighlightColor}
                        />
                      </div>
                      <Skeleton 
                        width={120} 
                        height={25} 
                        className="mt-2" 
                        baseColor={styles.skeletonBaseColor}
                        highlightColor={styles.skeletonHighlightColor}
                      />
                      <Skeleton 
                        width={150} 
                        height={20} 
                        className="mt-1" 
                        baseColor={styles.skeletonBaseColor}
                        highlightColor={styles.skeletonHighlightColor}
                      />
                    </div>
                  ) : (
                    <div className="d-flex flex-column align-items-center mt-3">
                      <div className="d-flex mb-2">
                        {renderStarRating(dashboardData.ratings?.average || 0)}
                      </div>
                      <p className="mt-2 text-center" style={styles.headingText}>
                        <strong>{dashboardData.ratings?.average?.toFixed(1) || 0}</strong> out of 5
                        <br />
                        <small style={styles.mutedText}>
                          Based on {dashboardData.ratings?.count || 0} review{dashboardData.ratings?.count !== 1 ? 's' : ''}
                        </small>
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>

            <div className="col-lg-6">
              <Card className="shadow-sm h-100" style={styles.card}>
                <Card.Body>
                  <h5 style={styles.headingText}>Orders</h5>
                  {loading ? (
                    <>
                      <Skeleton 
                        width={120} 
                        height={20} 
                        baseColor={styles.skeletonBaseColor}
                        highlightColor={styles.skeletonHighlightColor}
                      />
                      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Skeleton 
                          height={180} 
                          width="100%" 
                          baseColor={styles.skeletonBaseColor}
                          highlightColor={styles.skeletonHighlightColor}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <small style={styles.mutedText}>{dashboardData.orderStats?.total || 0} orders total</small>
                      <div style={{ height: '200px' }}>
                        <Line
                          data={{
                            labels: dashboardData.revenueOverview?.labels || [],
                            datasets: [{
                              label: 'Orders',
                              data: dashboardData.revenueOverview?.datasets[0]?.data?.map(
                                (revenue, index) => revenue > 0 ? 1 : 0
                              ) || [],
                              borderColor: isDarkMode ? '#FF8C94' : '#FF6384',
                              backgroundColor: isDarkMode ? 'rgba(255, 140, 148, 0.1)' : 'rgba(255, 99, 132, 0.1)',
                              fill: false,
                            }],
                          }}
                          options={{ 
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                labels: {
                                  color: isDarkMode ? '#e9ecef' : '#212529'
                                }
                              }
                            },
                            scales: {
                              x: {
                                ticks: {
                                  color: isDarkMode ? '#adb5bd' : '#666'
                                },
                                grid: {
                                  color: isDarkMode ? '#495057' : '#ddd'
                                }
                              },
                              y: {
                                ticks: {
                                  color: isDarkMode ? '#adb5bd' : '#666'
                                },
                                grid: {
                                  color: isDarkMode ? '#495057' : '#ddd'
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>

          {/* Participants and Projects Section */}
          <div className="row g-4 mt-4">
            <div className="col-lg-6">
              {/* Projects */}
              <Card className="projects-card shadow-sm h-100" style={styles.card}>
                <Card.Body>
                  <h5 style={styles.headingText}>Projects</h5>
                  <div className="table-container overflow-auto" style={{ maxHeight: '365px' }}>
                    {loading ? (
                      <Table striped bordered hover size="sm" responsive>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Title</th>
                            <th style={styles.tableHeader}>Budget</th>
                            <th style={styles.tableHeader}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array(5).fill(0).map((_, index) => (
                            <tr key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                              <td>
                                <Skeleton 
                                  width="100%" 
                                  baseColor={styles.skeletonBaseColor}
                                  highlightColor={styles.skeletonHighlightColor}
                                />
                              </td>
                              <td>
                                <Skeleton 
                                  width="100%" 
                                  baseColor={styles.skeletonBaseColor}
                                  highlightColor={styles.skeletonHighlightColor}
                                />
                              </td>
                              <td>
                                <Skeleton 
                                  width="100%" 
                                  baseColor={styles.skeletonBaseColor}
                                  highlightColor={styles.skeletonHighlightColor}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <Table striped bordered hover size="sm" responsive>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Title</th>
                            <th style={styles.tableHeader}>Budget</th>
                            <th style={styles.tableHeader}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projects.length > 0 ? (
                            projects.map((project, index) => (
                              <tr key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                <td style={{ color: isDarkMode ? '#e9ecef' : '#212529' }}>{project.title}</td>
                                <td style={{ color: isDarkMode ? '#e9ecef' : '#212529' }}>{project.budget}</td>
                                <td style={{ color: isDarkMode ? '#e9ecef' : '#212529' }}>{project.status}</td>
                              </tr>
                            ))
                          ) : (
                            <tr style={styles.tableRow}>
                              <td colSpan="3" className="text-center" style={{ color: isDarkMode ? '#e9ecef' : '#212529' }}>
                                No projects found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>

            <div className="col-lg-6">
              {/* Participants (Conversations) */}
              <Card className="participants-card shadow-sm h-100" style={styles.card}>
                <Card.Body>
                  <h5 style={styles.headingText}>Participants</h5>
                  <div className="table-container overflow-auto" style={{ maxHeight: '365px' }}>
                    {loading ? (
                      <Table striped bordered hover size="sm" responsive>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Name</th>
                            <th style={styles.tableHeader}>Message</th>
                            <th style={styles.tableHeader}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array(5).fill(0).map((_, index) => (
                            <tr key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                              <td>
                                <Skeleton 
                                  width="100%" 
                                  baseColor={styles.skeletonBaseColor}
                                  highlightColor={styles.skeletonHighlightColor}
                                />
                              </td>
                              <td>
                                <Skeleton 
                                  width="100%" 
                                  baseColor={styles.skeletonBaseColor}
                                  highlightColor={styles.skeletonHighlightColor}
                                />
                              </td>
                              <td>
                                <Skeleton 
                                  width={60} 
                                  baseColor={styles.skeletonBaseColor}
                                  highlightColor={styles.skeletonHighlightColor}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <Table striped bordered hover size="sm" responsive>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Name</th>
                            <th style={styles.tableHeader}>Message</th>
                            <th style={styles.tableHeader}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {participants.length > 0 ? (
                            participants.map((participant, index) => (
                              <tr key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                <td style={{ color: isDarkMode ? '#e9ecef' : '#212529' }}>{participant.name}</td>
                                <td style={{ color: isDarkMode ? '#e9ecef' : '#212529' }}>{participant.message}</td>
                                <td>
                                  <Button 
                                    variant="link" 
                                    onClick={handleReplyClick}
                                    style={styles.linkButton}
                                  >
                                    {participant.action}
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr style={styles.tableRow}>
                              <td colSpan="3" className="text-center" style={{ color: isDarkMode ? '#e9ecef' : '#212529' }}>
                                No conversations found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      {/* Header */}

      <div className="d-flex" style={styles.container}>
        {/* Sidebar */}

        {/* Main Content */}
        <div className="container mt-4" style={{ 
          marginLeft: '10px', 
          flexGrow: 1, 
          paddingBottom: '50px',
          backgroundColor: isDarkMode ? '#212529' : 'inherit',
          color: isDarkMode ? '#e9ecef' : 'inherit'
        }}>
          {renderContent()}
        </div>
      </div>

      {/* Help Button */}
      <HelpButton isDarkMode={isDarkMode} />
    </>
  );
};

export default DeveloperDashboard;