import React, { useState, useEffect } from "react"; 
import { Card, Table, Button, Row, Col, Container, Modal, Form, Dropdown, Toast, Spinner, Alert, ButtonGroup } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faEllipsisV, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"; 
import Cards from "react-credit-cards-2";
import "react-credit-cards-2/dist/es/styles-compiled.css";
import ComHeader from "../components/ComHeader";
import ComSidebar from "../components/ComSidebar";
import Skeleton from "react-loading-skeleton"; 
import "react-loading-skeleton/dist/skeleton.css"; 

// Import Chart.js components - fixing the Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Retrieve the base URL from environment variables
const baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const StudentDashboardContent = ({ isDarkMode }) => {
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [spendingOverview, setSpendingOverview] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [{
      label: 'Monthly Spending',
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1
    }]
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
    focus: "",
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAddCard, setLoadingAddCard] = useState(false);
  const [error, setError] = useState(null);
  const [visibleCards, setVisibleCards] = useState({});
  
  // New state variables for spending overview
  const [totalSpending, setTotalSpending] = useState(0);
  const [currentMonthSpending, setCurrentMonthSpending] = useState(0);
  
  // Dark mode state - use prop if available, otherwise check localStorage
  const [darkMode, setDarkMode] = useState(
    isDarkMode !== undefined ? isDarkMode : 
    localStorage.getItem("theme") === "dark" || 
    localStorage.getItem("darkMode") === "true"
  );
  
  // Update dark mode state when prop changes
  useEffect(() => {
    if (isDarkMode !== undefined) {
      setDarkMode(isDarkMode);
    }
  }, [isDarkMode]);
  
  // Configure Skeleton theme for dark mode
  useEffect(() => {
    // Set Skeleton theme colors
    if (darkMode) {
      document.documentElement.style.setProperty('--skeleton-base-color', '#333');
      document.documentElement.style.setProperty('--skeleton-highlight-color', '#444');
    } else {
      document.documentElement.style.setProperty('--skeleton-base-color', '#ebebeb');
      document.documentElement.style.setProperty('--skeleton-highlight-color', '#f5f5f5');
    }
  }, [darkMode]);

  // Update chart styles based on dark mode
  useEffect(() => {
    if (darkMode) {
      // Create a deep copy of the spending overview
      const updatedSpendingOverview = {
        ...spendingOverview,
        datasets: spendingOverview.datasets.map(dataset => ({
          ...dataset,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)'
        }))
      };
      setSpendingOverview(updatedSpendingOverview);
    }
  }, [darkMode]);

  // Toggle visibility of card details
  const toggleCardVisibility = (index) => {
    setVisibleCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Fetch dashboard data from the backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching dashboard data from:", `${baseURL}/api/students/dashboarddata`);
        const token = localStorage.getItem("token");
        
        if (!token) {
          throw new Error("No authentication token found");
        }
        
        console.log("Token:", token);

        const response = await fetch(`${baseURL}/api/students/dashboarddata`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown error occurred" }));
          throw new Error(errorData.message || `HTTP error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Dashboard data received:", data);

        // Process the data - handle potential missing data gracefully
        setProjects(data.projects || []);
        setInvoices(data.invoices || []);
        
        // Set spending overview data from backend
        if (data.spendingOverview && 
            data.spendingOverview.labels && 
            data.spendingOverview.datasets) {
          
          // Apply dark mode styling to the chart data if needed
          const chartData = {
            ...data.spendingOverview,
            datasets: data.spendingOverview.datasets.map(dataset => ({
              ...dataset,
              borderColor: darkMode ? 'rgb(75, 192, 192)' : 'rgb(75, 192, 192)',
              backgroundColor: darkMode ? 'rgba(75, 192, 192, 0.2)' : 'rgba(75, 192, 192, 0.2)',
            }))
          };
          
          setSpendingOverview(chartData);
          
          // Calculate total spending from the dataset values
          if (data.spendingOverview.datasets[0] && Array.isArray(data.spendingOverview.datasets[0].data)) {
            const totalAmount = data.spendingOverview.datasets[0].data.reduce(
              (sum, value) => sum + (typeof value === 'number' ? value : 0), 
              0
            );
            setTotalSpending(totalAmount);
            
            // Set current month spending - get the current month (0-indexed)
            const currentMonth = new Date().getMonth();
            setCurrentMonthSpending(
              data.spendingOverview.datasets[0].data[currentMonth] || 0
            );
          }
        }
        
        setPaymentMethods(data.paymentMethods || []);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
        setError(error.message || "Something went wrong, please try again");
        setLoading(false);
        
        // Set default empty values
        setProjects([]);
        setInvoices([]);
        // Keep default spendingOverview
        setPaymentMethods([]);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle input change for card data
  const handleInputChange = (evt) => {
    const { name, value } = evt.target;
    setCardData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle input focus for card data
  const handleInputFocus = (evt) => {
    setCardData((prev) => ({ ...prev, focus: evt.target.name }));
  };

  const handleAddCard = async () => {
    setLoadingAddCard(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await fetch(`${baseURL}/api/students/add-payment-method`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardType: cardData.number.startsWith("4") ? "Visa" : "MasterCard",
          cardNumber: cardData.number,
          name: cardData.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error occurred" }));
        throw new Error(errorData.message || "Failed to add payment method");
      }

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
      setShowAddCardModal(false);
      setToastMessage("Card added successfully");
      setShowToast(true);
      
      // Reset card form data
      setCardData({
        number: "",
        expiry: "",
        cvc: "",
        name: "",
        focus: "",
      });
    } catch (error) {
      console.error("❌ Error adding payment method:", error);
      setToastMessage(error.message || "Failed to add card");
      setShowToast(true);
    } finally {
      setLoadingAddCard(false);
    }
  };

  // Handle deleting a card
  const handleDeleteCard = async (paymentMethodId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await fetch(`${baseURL}/api/students/delete-payment-method/${paymentMethodId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error occurred" }));
        throw new Error(errorData.message || "Failed to delete payment method");
      }

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
      setToastMessage("Card deleted successfully");
      setShowToast(true);
    } catch (error) {
      console.error("❌ Error deleting payment method:", error);
      setToastMessage(error.message || "Failed to delete card");
      setShowToast(true);
    }
  };

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ur-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Get chart options based on dark mode
  const getChartOptions = () => {
    return {
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: darkMode ? '#adb5bd' : '#666',
          }
        },
        y: {
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: darkMode ? '#adb5bd' : '#666',
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: darkMode ? '#fff' : '#212529',
          }
        },
        tooltip: {
          backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          titleColor: darkMode ? '#fff' : '#000',
          bodyColor: darkMode ? '#fff' : '#000',
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          borderWidth: 1
        }
      }
    };
  };

  // Define the dynamic styles for dark mode
  const styles = {
    card: {
      backgroundColor: darkMode ? '#343a40' : '#fff',
      color: darkMode ? '#fff' : '#212529',
      borderColor: darkMode ? '#495057' : '#dee2e6'
    },
    cardInner: {
      backgroundColor: darkMode ? '#2c3136' : '#f8f9fa',
      borderColor: darkMode ? '#495057' : '#dee2e6'
    },
    text: {
      color: darkMode ? '#fff' : '#212529'
    },
    muted: {
      color: darkMode ? '#adb5bd' : '#6c757d'
    },
    primary: {
      color: darkMode ? '#8bbeff' : '#0d6efd'
    },
    table: {
      color: darkMode ? '#fff' : '#212529',
      borderColor: darkMode ? '#495057' : '#dee2e6'
    },
    tableHeader: {
      backgroundColor: darkMode ? '#2c3136' : '#f8f9fa',
      color: darkMode ? '#fff' : '#212529',
      borderColor: darkMode ? '#495057' : '#dee2e6'
    },
    tableStriped: {
      backgroundColor: darkMode ? '#31373d' : '#f8f9fa'
    },
    modal: {
      backgroundColor: darkMode ? '#343a40' : '#fff',
      color: darkMode ? '#fff' : '#212529',
      borderColor: darkMode ? '#495057' : '#dee2e6'
    },
    input: {
      backgroundColor: darkMode ? '#2c3136' : '#fff',
      color: darkMode ? '#fff' : '#212529',
      borderColor: darkMode ? '#495057' : '#ced4da'
    },
    button: {
      primary: {
        backgroundColor: darkMode ? '#1a6fc9' : '#0d6efd',
        borderColor: darkMode ? '#1a6fc9' : '#0d6efd',
        color: '#fff'
      },
      secondary: {
        backgroundColor: darkMode ? '#5a6268' : '#6c757d',
        borderColor: darkMode ? '#5a6268' : '#6c757d',
        color: '#fff'
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: darkMode ? '#fff' : '#0d6efd',
        color: darkMode ? '#fff' : '#0d6efd'
      }
    }
  };

  return (
    <>
      <div className="d-flex">
        {/* Main Content */}
        <Container fluid className="mt-4 pb-5" style={{ flexGrow: 1 }}>
          <div className="dashboard-content">
            {/* Error Message */}
            {error && (
              <Alert variant={darkMode ? "danger" : "danger"} className="mb-4">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
                <div className="d-flex justify-content-end">
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline-danger"
                  >
                    Try Again
                  </Button>
                </div>
              </Alert>
            )}
            
            {/* Spending Summary Cards */}
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <Card className="shadow-sm" style={styles.card}>
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
                    <h5 className="mb-3" style={styles.text}>Total Spending</h5>
                    {loading ? (
                      <Skeleton height={40} width={150} />
                    ) : (
                      <h2 style={styles.primary}>{formatCurrency(totalSpending)}</h2>
                    )}
                  </Card.Body>
                </Card>
              </div>
              <div className="col-md-6">
                <Card className="shadow-sm" style={styles.card}>
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
                    <h5 className="mb-3" style={styles.text}>Current Month</h5>
                    {loading ? (
                      <Skeleton height={40} width={150} />
                    ) : (
                      <h2 style={styles.primary}>{formatCurrency(currentMonthSpending)}</h2>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </div>
            
            {/* Spending Overview and Projects Section */}
            <div className="row g-4">
              <div className="col-lg-6">
                <Card className="shadow-sm" style={styles.card}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Card.Title className="mb-0" style={styles.text}>Spending Overview</Card.Title>
                    </div>
                    <div style={{ height: "300px" }}>
                      {loading ? (
                        <Skeleton height={300} />
                      ) : (
                        <Line data={spendingOverview} options={getChartOptions()} />
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="col-lg-6">
                <Card className="shadow-sm" style={styles.card}>
                  <Card.Body>
                    <Card.Title className="mb-3" style={styles.text}>Projects</Card.Title>
                    <div
                      style={{
                        height: "300px",
                        overflowY: "auto",
                        border: `1px solid ${darkMode ? '#495057' : '#ddd'}`,
                        borderRadius: "5px",
                      }}
                    >
                      {loading ? (
                        <Skeleton count={5} height={50} />
                      ) : projects.length > 0 ? (
                        <Table responsive style={styles.table} className={darkMode ? "table-dark" : ""}>
                          <thead style={styles.tableHeader}>
                            <tr>
                              <th>Company</th>
                              <th>Budget</th>
                              <th>Status</th>
                              <th>Completion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projects.map((project, index) => (
                              <tr key={index} style={index % 2 === 0 ? styles.tableStriped : {}}>
                                <td>{project.name}</td>
                                <td>{formatCurrency(project.budget)}</td>
                                <td>{project.status}</td>
                                <td>{project.completion}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <div className="d-flex justify-content-center align-items-center h-100">
                          <p style={styles.muted}>No projects available</p>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            {/* Payment Method and Invoice Section */}
            <div className="row g-4 mt-4">
              <div className="col-lg-6">
                <Card className="shadow-sm" style={styles.card}>
                  <Card.Body>
                    <Card.Title style={styles.text}>Payment Method</Card.Title>
                    {loading ? (
                      <Skeleton count={3} height={50} />
                    ) : paymentMethods.length === 0 ? (
                      <p style={styles.text}>No payment method has been added.</p>
                    ) : (
                      paymentMethods.map((method, index) => (
                        <div key={index} className="mb-3">
                          {/* Card Preview Image */}
                          <Cards
                            number={visibleCards[index] ? method.cardNumber : "•••• •••• •••• ••••"}
                            expiry={visibleCards[index] ? "**/**" : "••/••"}
                            cvc={visibleCards[index] ? "***" : "•••"}
                            name={method.name}
                            focused="number"
                          />

                          {/* Box for Card Type and Number */}
                          <Card className="shadow-sm p-3 mt-3" style={styles.cardInner}>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <p className="mb-1" style={styles.text}>
                                  <strong>Card Type:</strong> {method.cardType}
                                </p>
                                <p className="mb-0" style={styles.text}>
                                  <strong>Card Number:</strong>{" "}
                                  {visibleCards[index] ? method.cardNumber : "•••• •••• •••• " + method.cardNumber.slice(-4)}
                                </p>
                              </div>
                              <div className="d-flex align-items-center">
                                <Button
                                  variant={darkMode ? "dark" : "link"}
                                  onClick={() => toggleCardVisibility(index)}
                                  className="me-2"
                                  style={{ color: darkMode ? '#fff' : '#212529' }}
                                >
                                  <FontAwesomeIcon icon={visibleCards[index] ? faEyeSlash : faEye} />
                                </Button>
                                <Dropdown>
                                  <Dropdown.Toggle 
                                    variant={darkMode ? "dark" : "link"} 
                                    id="dropdown-menu"
                                    style={{ color: darkMode ? '#fff' : '#212529' }}
                                  >
                                    <FontAwesomeIcon icon={faEllipsisV} />
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu
                                    style={{
                                      backgroundColor: darkMode ? '#343a40' : '#fff',
                                      borderColor: darkMode ? '#495057' : '#dee2e6'
                                    }}
                                  >
                                    <Dropdown.Item 
                                      onClick={() => handleDeleteCard(method._id)}
                                      style={{ color: darkMode ? '#fff' : '#212529' }}
                                    >
                                      Delete
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))
                    )}
                    {/* Add a New Card Button (Displayed only once) */}
                    {loading ? (
                      <Skeleton height={40} width={150} />
                    ) : (
                      <Button 
                        variant={darkMode ? "outline-light" : "primary"} 
                        onClick={() => setShowAddCardModal(true)}
                      >
                        Add a New Card
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </div>
              <div className="col-lg-6">
                <Card className="shadow-sm" style={styles.card}>
                  <Card.Body style={{ height: "390px", overflowY: "auto" }}>
                    <Card.Title style={styles.text}>Invoices</Card.Title>
                    {loading ? (
                      <Skeleton count={5} height={50} />
                    ) : invoices.length > 0 ? (
                      <Table responsive style={styles.table} className={darkMode ? "table-dark" : ""}>
                        <thead style={styles.tableHeader}>
                          <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>PDF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice, index) => (
                            <tr key={index} style={index % 2 === 0 ? styles.tableStriped : {}}>
                              <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                              <td>{formatCurrency(invoice.amount)}</td>
                              <td>
                                <Button 
                                  variant={darkMode ? "dark" : "link"} 
                                  size="sm" 
                                  disabled={!invoice.pdfLink}
                                  href={invoice.pdfLink}
                                  target="_blank"
                                >
                                  <FontAwesomeIcon icon={faFilePdf} style={{ color: '#dc3545' }} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <p style={styles.muted}>No invoices available</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </div>

            {/* Rating Section */}
            <div className="row g-4 mt-4">
              <div className="col-lg-12">
                <Card className="shadow-sm" style={styles.card}>
                  <Card.Body>
                    <Card.Title style={styles.text}>Rating</Card.Title>
                    {loading ? (
                      <Skeleton height={30} width={150} />
                    ) : (
                      <>
                        <div>
                          <span>⭐⭐⭐⭐⭐</span>
                        </div>
                        <p style={styles.muted} className="mt-2">
                          Want to become a developer? Give necessary information and get started.
                        </p>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Add Card Modal */}
      <Modal 
        show={showAddCardModal} 
        onHide={() => setShowAddCardModal(false)}
        contentClassName={darkMode ? "bg-dark text-light" : ""}
      >
        <Modal.Header 
          closeButton 
          style={{
            backgroundColor: darkMode ? '#343a40' : '#fff',
            borderColor: darkMode ? '#495057' : '#dee2e6'
          }}
        >
          <Modal.Title style={styles.text}>Add a New Card</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{
          backgroundColor: darkMode ? '#343a40' : '#fff',
          color: darkMode ? '#fff' : '#212529'
        }}>
          <Cards
            number={cardData.number}
            expiry={cardData.expiry}
            cvc={cardData.cvc}
            name={cardData.name}
            focused={cardData.focus}
          />
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={styles.text}>Card Number</Form.Label>
              <Form.Control
                type="number"
                name="number"
                placeholder="Card Number"
                value={cardData.number}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                style={styles.input}
                className={darkMode ? "bg-dark text-light border-secondary" : ""}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={styles.text}>Expiry Date</Form.Label>
              <Form.Control
                type="text"
                name="expiry"
                placeholder="MM/YY"
                value={cardData.expiry}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                style={styles.input}
                className={darkMode ? "bg-dark text-light border-secondary" : ""}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={styles.text}>CVC</Form.Label>
              <Form.Control
                type="number"
                name="cvc"
                placeholder="CVC"
                value={cardData.cvc}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                style={styles.input}
                className={darkMode ? "bg-dark text-light border-secondary" : ""}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={styles.text}>Cardholder Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Cardholder Name"
                value={cardData.name}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                style={styles.input}
                className={darkMode ? "bg-dark text-light border-secondary" : ""}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{
          backgroundColor: darkMode ? '#343a40' : '#fff',
          borderColor: darkMode ? '#495057' : '#dee2e6'
        }}>
          <Button 
            variant={darkMode ? "outline-light" : "secondary"} 
            onClick={() => setShowAddCardModal(false)}
          >
            Close
          </Button>
          <Button 
            variant={darkMode ? "outline-primary" : "primary"} 
            onClick={handleAddCard} 
            disabled={loadingAddCard}
          >
            {loadingAddCard ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Adding Card...
              </>
            ) : (
              "Save Card"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
<Toast
  onClose={() => setShowToast(false)}
  show={showToast}
  delay={3000}
  autohide
  style={{
    position: "fixed",
    bottom: 20,
    right: 20,
    backgroundColor: darkMode ? '#343a40' : '#fff',
    borderColor: darkMode ? '#495057' : 'rgba(0,0,0,.1)'
  }}
>
  <Toast.Header style={{
    backgroundColor: darkMode ? '#2c3136' : '#f8f9fa',
    color: darkMode ? '#fff' : '#212529',
    borderColor: darkMode ? '#495057' : 'rgba(0,0,0,.05)'
  }}>
    <strong className="me-auto" style={styles.text}>Notification</strong>
  </Toast.Header>
  <Toast.Body style={{
    color: darkMode ? '#fff' : '#212529'
  }}>
    {toastMessage}
  </Toast.Body>
</Toast>
</>
);
};

export default StudentDashboardContent;