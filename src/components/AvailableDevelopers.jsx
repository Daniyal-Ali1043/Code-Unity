import React, { useState, useEffect } from "react";
import { Card, Button, Row, Col, Container, Modal, Form } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaBook, FaEnvelope, FaVideo, FaCreditCard } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const baseURL = import.meta.env.VITE_BACKEND_URL;

const AvailableDevelopers = ({ isDarkMode }) => {
  const [developers, setDevelopers] = useState([]);
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // State for booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [bookingHours, setBookingHours] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/developers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Format the rate to display in PKR and handle junior developers
        const formattedDevelopers = response.data.map(dev => {
          // For junior developers, set rate as "Free"
          if (dev.developerType && dev.developerType.toLowerCase() === "junior") {
            dev.rate = "Free";
            dev.rateValue = "0.00";
            dev.isFree = true;
          } else {
            dev.isFree = false;
            // If the rate is in the format "$X/hour", extract X and convert to "PKR X/hour"
            if (dev.rate && dev.rate.includes('$')) {
              const rateValue = dev.rate.replace('$', '').split('/')[0];
              dev.rate = `PKR ${rateValue}/hour`;
              dev.rateValue = rateValue;
            } else if (dev.rate) {
              // If there's a rate but not in $ format, prepend PKR
              if (!dev.rate.includes('PKR') && !dev.rate.includes('Free')) {
                const rateValue = dev.rate.split('/')[0];
                dev.rate = `PKR ${rateValue}/hour`;
                dev.rateValue = rateValue;
              }
            } else {
              dev.rate = "Not specified";
              dev.rateValue = "0.00";
            }
          }
          return dev;
        });
        
        setDevelopers(formattedDevelopers);
      } catch (error) {
        console.error("Failed to fetch developers:", error);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    };

    fetchDevelopers();
  }, [token]);

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string) => {
    return string && typeof string === 'string' 
      ? string.charAt(0).toUpperCase() + string.slice(1) 
      : 'Unknown';
  };

  // Generate a random offer ID
  const generateOfferId = () => {
    return 'offer_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  const handleMessageClick = async (receiverId) => {
    try {
      if (!userId || !receiverId) {
        console.error(
          "User ID or Receiver ID not found, cannot start or check conversation."
        );
        return;
      }

      let conversationId;

      try {
        const conversationResponse = await axios.get(
          `${baseURL}/api/conversations/check/${userId}/${receiverId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        conversationId = conversationResponse.data.conversationId;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log("No existing conversation found. Creating a new one...");
          const newConversationResponse = await axios.post(
            `${baseURL}/api/conversations/send`,
            { senderId: userId, receiverId: receiverId, text: "Hey" },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          conversationId =
            newConversationResponse.data.newMessage.conversationId;
        } else {
          console.error("Error starting or checking conversation:", error);
          return;
        }
      }

      navigate(`/inbox?user=${receiverId}`);
    } catch (error) {
      console.error("Unhandled error in handleMessageClick:", error);
    }
  };

  const handleMeetClick = async (receiverId) => {
    try {
      if (!userId || !receiverId) {
        console.error(
          "User ID or Receiver ID not found, cannot start or check conversation."
        );
        return;
      }

      const conversationResponse = await axios.get(
        `${baseURL}/api/conversations/check/${userId}/${receiverId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let conversationId = conversationResponse.data.conversationId;

      if (!conversationId) {
        const newConversationResponse = await axios.post(
          `${baseURL}/api/conversations/start`,
          { senderId: userId, receiverId: receiverId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        conversationId = newConversationResponse.data.conversationId;
      }

      await axios.post(
        `${baseURL}/api/conversations/send`,
        {
          conversationId: conversationId,
          senderId: userId,
          receiverId: receiverId,
          text: "Hey, I want to do a Zoom Meeting with you",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/inbox?user=${receiverId}`);
    } catch (error) {
      console.error("Error starting or checking conversation:", error);
    }
  };

  // Create an offer for booking the developer
  const createOffer = async (developer, hours, totalAmount) => {
    try {
      // First create the conversation if it doesn't exist
      let conversationId;
      try {
        const conversationResponse = await axios.get(
          `${baseURL}/api/conversations/check/${userId}/${developer.userId || developer._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        conversationId = conversationResponse.data.conversationId;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log("No existing conversation found. Creating a new one...");
          const newConversationResponse = await axios.post(
            `${baseURL}/api/conversations/start`,
            { 
              senderId: userId, 
              receiverId: developer.userId || developer._id 
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          conversationId = newConversationResponse.data.conversationId;
        } else {
          console.error("Error starting or checking conversation:", error);
          throw new Error("Failed to create conversation");
        }
      }

      // Generate a new offer ID
      const offerId = generateOfferId();
      
      // Create the offer
      const offerResponse = await axios.post(
        `${baseURL}/api/offers/create`,
        {
          conversationId: conversationId,
          senderId: userId,
          receiverId: developer.userId || developer._id,
          title: `Development services by ${developer.name}`,
          description: `${hours} hour${hours > 1 ? 's' : ''} of development work`,
          amount: totalAmount.toString(),
          offerId: offerId,
          developerType: developer.developerType || "unknown"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Offer created:", offerResponse.data);
      return offerId;
    } catch (error) {
      console.error("Failed to create offer:", error);
      // Return a generated ID even if offer creation fails so we can proceed
      return generateOfferId();
    }
  };

  const handleBooking = (dev) => {
    setSelectedDeveloper(dev);
    setBookingHours(1);
    
    // Calculate initial total price (1 hour)
    const hourlyRate = dev.isFree ? 0 : parseFloat(dev.rateValue || 0);
    setTotalPrice(hourlyRate);
    
    setShowBookingModal(true);
  };

  const handleHoursChange = (e) => {
    const hours = parseInt(e.target.value, 10);
    setBookingHours(hours);
    
    // Calculate total price based on hours
    const hourlyRate = selectedDeveloper.isFree ? 0 : parseFloat(selectedDeveloper.rateValue || 0);
    setTotalPrice(hours * hourlyRate);
  };

  const handleProceedToPayment = async () => {
    // Close the modal
    setShowBookingModal(false);
    
    // Create an offer first to get a valid offer ID
    const offerId = await createOffer(selectedDeveloper, bookingHours, totalPrice);
    
    // Navigate to payment page with necessary details
    navigate("/pay", { 
      state: { 
        developerId: selectedDeveloper._id,
        title: `Development services by ${selectedDeveloper.name}`,
        description: `${bookingHours} hour${bookingHours > 1 ? 's' : ''} of development work`,
        amount: totalPrice.toString(),
        rate: totalPrice.toString(),
        deliveryTime: bookingHours > 8 ? Math.ceil(bookingHours / 8) : 1, // Convert hours to days
        revisions: 0,
        meetingIncluded: false,
        offerId: offerId, // Use the offer ID from the backend
        isFree: selectedDeveloper.isFree,
        hours: bookingHours
      } 
    });
  };

  return (
    <>
      <Container fluid className="mt-4 pb-5">
        <h3 className={isDarkMode ? "text-light" : "text-dark"}>
          Available Developers
        </h3>
        <Row className="g-4 pb-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Col key={index} lg={4} md={6}>
                <Card className={`shadow-sm ${isDarkMode ? "bg-dark text-light" : ""}`}>
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <Skeleton circle width={60} height={60} />
                      <div className="ms-3">
                        <Skeleton width={150} height={20} />
                        <Skeleton width={200} height={15} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Skeleton width={200} height={15} />
                      <Skeleton width={200} height={15} />
                      <Skeleton width={200} height={15} />
                      <div className="mt-3 d-flex justify-content-between">
                        <Skeleton width={80} height={30} />
                        <Skeleton width={80} height={30} />
                        <Skeleton width={80} height={30} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : developers.length > 0 ? (
            developers.map((dev) => (
              <Col key={dev._id} lg={4} md={6}>
                <Card className={`shadow-sm ${isDarkMode ? "bg-dark text-light" : ""}`}>
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <img
                        src={
                          dev.profilePicture ||
                          "https://randomuser.me/api/portraits/men/1.jpg"
                        }
                        alt={dev.name}
                        className="rounded-circle me-3"
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                        }}
                      />
                      <div>
                        <h5 className={isDarkMode ? "text-light" : "text-dark"}>
                          {dev.name}
                        </h5>
                        <p className={isDarkMode ? "text-light" : "text-dark"}>
                          <strong>Type:</strong> {capitalizeFirstLetter(dev.developerType) || "Developer"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className={isDarkMode ? "text-light" : "text-dark"}>
                        <strong>Languages:</strong>{" "}
                        {dev.languages || "Not specified"}
                      </p>
                      <p className={isDarkMode ? "text-light" : "text-dark"}>
                        <strong>Experience:</strong>{" "}
                        {dev.experience || "Not specified"}
                      </p>
                      <p className={isDarkMode ? "text-light" : "text-dark"}>
                        <strong>Rate:</strong> {dev.rate || "Not specified"}
                      </p>
                      <div className="mt-3 d-flex justify-content-between">
                        <Button
                          variant={isDarkMode ? "outline-light" : "danger"}
                          size="sm"
                          className="flex-grow-1 mx-1"
                          onClick={() => handleBooking(dev)}
                          style={{
                            minWidth: "30%",
                            fontSize: "1.0rem",
                            padding: "0.5rem 0.75rem",
                          }}
                        >
                          <FaCreditCard
                            style={{ fontSize: "1.2rem" }}
                            className="me-2"
                          />
                          Book
                        </Button>
                        <Button
                          variant={isDarkMode ? "outline-light" : "success"}
                          size="sm"
                          className="flex-grow-1 mx-1"
                          onClick={() => handleMessageClick(dev.userId || dev._id)}
                          style={{
                            minWidth: "30%",
                            fontSize: "1.0rem",
                            padding: "0.5rem 0.75rem",
                          }}
                        >
                          <FaEnvelope
                            style={{ fontSize: "1.2rem" }}
                            className="me-2"
                          />
                          Message
                        </Button>
                        <Button
                          variant={isDarkMode ? "outline-light" : "primary"}
                          size="sm"
                          className="flex-grow-1 mx-1"
                          onClick={() => handleMeetClick(dev.userId || dev._id)}
                          style={{
                            minWidth: "30%",
                            fontSize: "1.0rem",
                            padding: "0.5rem 0.75rem",
                          }}
                        >
                          <FaVideo
                            style={{ fontSize: "1.0rem" }}
                            className="me-2"
                          />
                          Meet
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <p className={`text-center mt-5 ${isDarkMode ? "text-light" : "text-muted"}`}>
              No developers available.
            </p>
          )}
        </Row>
      </Container>

      {/* Booking Modal */}
      <Modal 
        show={showBookingModal} 
        onHide={() => setShowBookingModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className={isDarkMode ? "bg-dark text-light" : ""}>
          <Modal.Title>Book Developer</Modal.Title>
        </Modal.Header>
        <Modal.Body className={isDarkMode ? "bg-dark text-light" : ""}>
          {selectedDeveloper && (
            <>
              <p className="mb-4">
                You are booking <strong>{selectedDeveloper.name}</strong> 
                ({capitalizeFirstLetter(selectedDeveloper.developerType)})
              </p>

              <Form.Group className="mb-4">
                <Form.Label>How many hours do you want to book?</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="40"
                  value={bookingHours}
                  onChange={handleHoursChange}
                  className={isDarkMode ? "bg-secondary text-light" : ""}
                />
                <Form.Text className={isDarkMode ? "text-light" : "text-muted"}>
                  Please select between 1-40 hours
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <p className="mb-0"><strong>Hourly Rate:</strong></p>
                <p className="mb-0">
                  {selectedDeveloper.isFree 
                    ? "Free" 
                    : `PKR ${selectedDeveloper.rateValue || "0.00"}`}
                </p>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><strong>Total Price:</strong></h5>
                <h5 className="mb-0">
                  {totalPrice === 0 
                    ? "Free" 
                    : `PKR ${totalPrice.toFixed(2)}`}
                </h5>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className={isDarkMode ? "bg-dark text-light" : ""}>
          <Button 
            variant="secondary" 
            onClick={() => setShowBookingModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleProceedToPayment}
          >
            {selectedDeveloper && selectedDeveloper.isFree ? "Book Now" : "Proceed to Payment"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AvailableDevelopers;