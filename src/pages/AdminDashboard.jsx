import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2"; // Only import Doughnut, removed Bar
import "chart.js/auto";
import ComHeader from "../components/ComHeader"; // Use ComHeader instead of AdminHeader
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios"; // Import axios for API calls
import Skeleton from 'react-loading-skeleton';
import HelpButton from "../components/HelpButton"; // Import the HelpButton component

const AdminDashboard = () => {
  // State variables for dashboard metrics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Removed revenueData state
  const [userData, setUserData] = useState({
    labels: ["Developers", "Students"],
    datasets: [
      {
        label: "User Types",
        backgroundColor: ["#4caf50", "#8e44ad"],
        data: [0, 0],
      },
    ],
  });
  const [pendingDevelopers, setPendingDevelopers] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  
  // State for all users table
  const [allUsers, setAllUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [usersPerPage] = useState(10);

  // Function to fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get access token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Configure headers with token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Fetch all users count
      const usersResponse = await axios.get('/api/admin/users/count', config);
      setTotalUsers(usersResponse.data.count || 0);

      // Fetch user types distribution (developers vs students)
      const userTypesResponse = await axios.get('/api/admin/users/types', config);
      const devCount = userTypesResponse.data.developerCount || 0;
      const studentCount = userTypesResponse.data.studentCount || 0;
      
      setUserData({
        labels: ["Developers", "Students"],
        datasets: [
          {
            label: "User Types",
            backgroundColor: ["#4caf50", "#8e44ad"],
            data: [devCount, studentCount],
          },
        ],
      });

      // Fetch total revenue (sum of all developers' revenue)
      const revenueResponse = await axios.get('/api/admin/revenue/total', config);
      setTotalRevenue(revenueResponse.data.totalRevenue || 0);

      // Removed monthly revenue data fetching

      // Fetch total invoices (all orders since each order has one invoice)
      const invoicesResponse = await axios.get('/api/admin/orders/total', config);
      setTotalInvoices(invoicesResponse.data.totalOrders || 0);

      // Fetch total completed projects
      const projectsResponse = await axios.get('/api/admin/orders/completed', config);
      setTotalProjects(projectsResponse.data.completedOrders || 0);

      // Fetch pending developer applications
      const pendingDevsResponse = await axios.get('/api/admin/developers/pending', config);
      setPendingDevelopers(pendingDevsResponse.data.pendingDevelopers || []);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to fetch dashboard data. Please try again later.");
      setLoading(false);
    }
  };

  // Function to fetch all users with pagination
  const fetchAllUsers = async (page = 1) => {
    setUserLoading(true);
    try {
      // Get access token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Configure headers with token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Fetch users with pagination
      const response = await axios.get(`/api/admin/users?page=${page}&limit=${usersPerPage}`, config);
      
      setAllUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(response.data.pagination.currentPage);
      setUserLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUserError("Failed to fetch users. Please try again later.");
      setUserLoading(false);
    }
  };

  // Accept a developer application
  const handleAccept = async (developerId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Call API to accept developer application
      await axios.put(`/api/admin/developers/${developerId}/accept`, {}, config);
      
      // Refresh the list of pending applications
      const pendingDevsResponse = await axios.get('/api/admin/developers/pending', config);
      setPendingDevelopers(pendingDevsResponse.data.pendingDevelopers || []);
      
      // Also refresh the user distribution chart
      const userTypesResponse = await axios.get('/api/admin/users/types', config);
      const devCount = userTypesResponse.data.developerCount || 0;
      const studentCount = userTypesResponse.data.studentCount || 0;
      
      setUserData({
        labels: ["Developers", "Students"],
        datasets: [
          {
            label: "User Types",
            backgroundColor: ["#4caf50", "#8e44ad"],
            data: [devCount, studentCount],
          },
        ],
      });

      // Also refresh the list of all users
      fetchAllUsers(currentPage);

      setActionLoading(false);
    } catch (error) {
      console.error("Error accepting developer application:", error);
      setActionLoading(false);
      alert("Failed to accept developer application. Please try again.");
    }
  };

  // Reject a developer application
  const handleReject = async (developerId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Call API to reject/delete developer application
      await axios.delete(`/api/admin/developers/${developerId}/reject`, config);
      
      // Refresh the list of pending applications
      const pendingDevsResponse = await axios.get('/api/admin/developers/pending', config);
      setPendingDevelopers(pendingDevsResponse.data.pendingDevelopers || []);

      setActionLoading(false);
    } catch (error) {
      console.error("Error rejecting developer application:", error);
      setActionLoading(false);
      alert("Failed to reject developer application. Please try again.");
    }
  };

  // Fetch detailed developer information when viewing
  const handleView = async (developer) => {
    try {
      // Get access token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Configure headers with token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Get detailed developer information including resume paths
      const response = await axios.get(`/api/admin/developers/${developer._id}/details`, config);
      
      // If successful, set the developer with complete details
      setSelectedDeveloper({
        ...developer,
        ...response.data,
        resumePaths: response.data.resumePaths || []
      });
    } catch (error) {
      console.error("Error fetching developer details:", error);
      // Still show the modal with the data we have
      setSelectedDeveloper(developer);
    }
    
    setShowModal(true);
  };

  // Close the modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDeveloper(null);
  };

  // Navigate to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      fetchAllUsers(currentPage - 1);
    }
  };

  // Navigate to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      fetchAllUsers(currentPage + 1);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchDashboardData();
    fetchAllUsers();
  }, []);

  // Add a delay for loading state
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Format currency for display - Changed to PKR
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <>
      <ComHeader />
      <div className="container-fluid mt-3 pb-5"> {/* Reduced the margin-top */}
        <h1 className="text-center my-3">Admin's Dashboard</h1> {/* Adjusted margin */}
        
        {/* Responsive Cards */}
        <div className="row text-center mb-5">
          <div className="col-sm-6 col-md-3 mb-3">
            <div className="card shadow-sm p-3 mb-3" style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <h5>Total Revenue</h5>
              {loading ? (
                <Skeleton height={30} width={150} />
              ) : (
                <p className="text-primary">
                  {formatCurrency(totalRevenue)}
                </p>
              )}
            </div>
          </div>
          <div className="col-sm-6 col-md-3 mb-3">
            <div className="card shadow-sm p-3">
              <h5>Total Users</h5>
              {loading ? (
                <Skeleton height={30} width={150} />
              ) : (
                <p className="text-primary">
                  {formatNumber(totalUsers)}
                </p>
              )}
            </div>
          </div>
          <div className="col-sm-6 col-md-3 mb-3">
            <div className="card shadow-sm p-3">
              <h5>Total Invoices</h5>
              {loading ? (
                <Skeleton height={30} width={150} />
              ) : (
                <p className="text-primary">
                  {formatNumber(totalInvoices)}
                </p>
              )}
            </div>
          </div>
          <div className="col-sm-6 col-md-3 mb-3">
            <div className="card shadow-sm p-3">
              <h5>Total Projects</h5>
              {loading ? (
                <Skeleton height={30} width={150} />
              ) : (
                <p className="text-primary">
                  {formatNumber(totalProjects)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error message if data fetch fails */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Charts Section - Removed the Revenue chart and kept only Users chart */}
        <div className="row mb-5">
          <div className="col-lg-6 col-12 mb-3 mx-auto">
            <div className="card shadow-sm p-3 h-100" style={{ maxWidth: '100%', overflowX: 'auto' }}>
              <h5>Users</h5>
              {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div style={{ height: "300px" }}>
                  <Doughnut 
                    data={userData} 
                    options={{ 
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Developer Applications Section */}
        <div className="card shadow-sm p-3 mb-4">
          <h5>Pending Developer Applications</h5>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading applications...</p>
            </div>
          ) : pendingDevelopers.length === 0 ? (
            <div className="alert alert-info mt-3">
              No pending developer applications found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Developer Name</th>
                    <th>Email</th>
                    <th>Programming Languages</th>
                    <th>Education</th>
                    <th>Submitted On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDevelopers.map((dev) => (
                    <tr key={dev._id}>
                      <td>{dev.name}</td>
                      <td>{dev.email}</td>
                      <td>
                        {dev.programmingLanguages && dev.programmingLanguages.length > 0 
                          ? dev.programmingLanguages.join(', ') 
                          : "Not specified"}
                      </td>
                      <td>{dev.degree ? `${dev.degree} in ${dev.discipline || 'N/A'}` : "Not specified"}</td>
                      <td>{formatDate(dev.submittedDate)}</td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm me-2" 
                          style={{ transition: 'transform 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          onClick={() => handleView(dev)}
                        >
                          View
                        </button>
                        <button 
                          className="btn btn-success btn-sm me-2" 
                          onClick={() => handleAccept(dev._id)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing...' : 'Accept'}
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleReject(dev._id)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing...' : 'Reject'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Users Table with pagination */}
        <div className="card shadow-sm p-3">
          <h5>All Users</h5>
          {userError && (
            <div className="alert alert-danger" role="alert">
              {userError}
            </div>
          )}
          
          {userLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading users...</p>
            </div>
          ) : allUsers.length === 0 ? (
            <div className="alert alert-info mt-3">
              No users found.
            </div>
          ) : (
            <>
              <div className="table-responsive" style={{ height: "400px", overflowY: "auto" }}>
                <table className="table table-hover">
                  <thead className="sticky-top bg-white">
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.type || user.role || "User"}</td>
                        <td>{user.email}</td>
                        <td>
                          <span
                            className={`badge ${
                              user.status === "Active" ? "bg-success" : "bg-danger"
                            }`}
                          >
                            {user.status || "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination controls */}
              <div className="d-flex justify-content-center mt-3">
                <nav aria-label="User pagination">
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    <li className="page-item active">
                      <span className="page-link">
                        {currentPage} of {totalPages}
                      </span>
                    </li>
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Developer Details Modal */}
      {showModal && selectedDeveloper && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Developer Application Details</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <img 
                      src={selectedDeveloper.profilePicture || 'https://randomuser.me/api/portraits/men/1.jpg'} 
                      alt={selectedDeveloper.name}
                      className="img-fluid rounded"
                      style={{maxHeight: "200px", width: "100%", objectFit: "cover"}}
                    />
                  </div>
                  <div className="col-md-8">
                    <h4>{selectedDeveloper.name}</h4>
                    <p className="text-muted">{selectedDeveloper.email}</p>
                    <p><strong>Status:</strong> Pending</p>
                    <p><strong>Submitted On:</strong> {formatDate(selectedDeveloper.submittedDate)}</p>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header">Education</div>
                      <div className="card-body">
                        <p><strong>Degree:</strong> {selectedDeveloper.degree || "Not specified"}</p>
                        <p><strong>Discipline:</strong> {selectedDeveloper.discipline || "Not specified"}</p>
                        <p><strong>Graduation Year:</strong> {selectedDeveloper.yearOfCompletion || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header">Technical Skills</div>
                      <div className="card-body">
                        <p><strong>Programming Languages:</strong></p>
                        {selectedDeveloper.programmingLanguages && selectedDeveloper.programmingLanguages.length > 0 ? (
                          <ul className="list-group">
                            {selectedDeveloper.programmingLanguages.map((lang, index) => (
                              <li key={index} className="list-group-item">{lang}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No programming languages specified</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">Experience & Projects</div>
                      <div className="card-body">
                        <p><strong>Previous Experiences:</strong></p>
                        {selectedDeveloper.previousExperiences && selectedDeveloper.previousExperiences.length > 0 ? (
                          <ul className="list-group mb-3">
                            {selectedDeveloper.previousExperiences.map((exp, index) => (
                              <li key={index} className="list-group-item">{exp}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No previous experiences listed</p>
                        )}
                        <p><strong>Projects Link:</strong> {selectedDeveloper.projectsLink ? (
                          <a href={selectedDeveloper.projectsLink} target="_blank" rel="noopener noreferrer">
                            {selectedDeveloper.projectsLink}
                          </a>
                        ) : "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Resume Section */}
                <div className="row mt-3">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">Resume</div>
                      <div className="card-body">
                        {selectedDeveloper.resumeUrl ? (
                          <div>
                            <p><strong>Resume:</strong></p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="me-3">
                                {selectedDeveloper.resumeUrl.split('/').pop()}
                              </span>
                              <a 
                                href={selectedDeveloper.resumeUrl} 
                                className="btn btn-sm btn-outline-primary" 
                                download
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <i className="bi bi-download me-1"></i> Download
                              </a>
                            </div>
                          </div>
                        ) : (
                          <p>No resume file uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-success me-2"
                  onClick={() => {
                    handleAccept(selectedDeveloper._id);
                    handleCloseModal();
                  }}
                  disabled={actionLoading}
                >
                  Accept Application
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger me-2"
                  onClick={() => {
                    handleReject(selectedDeveloper._id);
                    handleCloseModal();
                  }}
                  disabled={actionLoading}
                >
                  Reject Application
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Button */}
      <HelpButton />
    </>
  );
};

export default AdminDashboard;