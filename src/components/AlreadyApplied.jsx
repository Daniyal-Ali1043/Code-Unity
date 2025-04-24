import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
const baseURL = import.meta.env.VITE_BACKEND_URL;

const AlreadyApplied = () => {
  const [application, setApplication] = useState({
    status: "Pending",
    details: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Unauthorized: No token found. Please log in.");
          return;
        }

        const response = await axios.get(`${baseURL}/api/developers/application-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setApplication({
          status: response.data.status,
          details: response.data.applicationDetails || {},
        });
      } catch (error) {
        console.error("❌ Error fetching application status:", error);

        if (error.response && error.response.status === 404) {
          setError("No application found. Please submit an application.");
        } else {
          setError("Failed to fetch application status. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationStatus();
  }, []);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  // Function to safely render object properties as strings
  const renderDetail = (detail) => {
    if (Array.isArray(detail)) {
      return detail.join(", ");
    }
    if (typeof detail === "object" && detail !== null) {
      return JSON.stringify(detail);
    }
    return detail || "N/A";
  };

  return (
    <>
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="container mt-4 p-4 shadow-sm bg-white rounded" style={{ maxWidth: '600px' }}>
          <h3 className="text-primary mb-4">Track Your Application</h3>

          {/* Show Loading Spinner */}
          {loading && (
            <div className="text-center">
              <Spinner animation="border" role="status" className="text-primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          )}

          {/* Show Error Message */}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Show Application Status */}
          {!loading && !error && (
            <>
              <div className={`alert ${application.status === "Accepted" ? "alert-success" : "alert-warning"} text-center`}>Status: {application.status}</div>
              <Button onClick={handleShow} className="btn btn-info mt-3 w-100">
                View Details
              </Button>
            </>
          )}

          {/* Modal for Application Details */}
          <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
              <Modal.Title>Application Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {application.details ? (
                Object.entries(application.details).map(([key, value]) => (
                  <p key={key} className="mb-2">
                    <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {renderDetail(value)}
                  </p>
                ))
              ) : (
                <p>No details available.</p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose} className="btn-sm">
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default AlreadyApplied;
