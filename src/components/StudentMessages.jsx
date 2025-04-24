import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Row, Col, Button, Modal, Form, Toast } from "react-bootstrap";
import Pusher from 'pusher-js';
import axios from "axios";
import userAvatar from "../assets/user-avatar.png";
import { FaPaperPlane, FaPlus, FaTrash } from "react-icons/fa";
import CodeUnityLogo from "../assets/CodeUnity.png";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

// Retrieve the base URL from environment variables
const baseURL = import.meta.env.VITE_BACKEND_URL;

// Initialize Pusher with your app key
const pusher = new Pusher('c04d171d7e5f8f9fd830', {
  cluster: 'ap2',
  encrypted: true
});

const StudentMessages = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [isFromNewChat, setIsFromNewChat] = useState(false);
  const [file, setFile] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState(null);
  const [senderId, setSenderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelNotification, setShowCancelNotification] = useState(false);
  // State for the order acceptance modal
  const [showAcceptOfferModal, setShowAcceptOfferModal] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  // Pusher channel state
  const [pusherChannel, setPusherChannel] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Fetch the current user's profile to get the correct userId
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${baseURL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      const data = await response.json();
      setSenderId(data._id);
      localStorage.setItem("userId", data._id);
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    fetchUserProfile();

    // Simulate a 2-second delay before hiding the skeleton loading
    setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Listen for offer accepted event
    const handleOfferAccepted = (event) => {
      const { offerId } = event.detail;
      console.log('🎯 Offer accepted event received:', offerId);
      
      // Update the messages to show offer accepted
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg.isHTML && msg.text && msg.text.includes(offerId)) {
            // Update the HTML to show offer accepted
            const updatedHtml = msg.text
              .replace(/<button onclick="acceptOffer[^>]*>Accept offer<\/button>/, 
                '<span style="padding: 8px 16px; background-color: #e0e0e0; border: 1px solid #ccc; color: #888; border-radius: 5px; cursor: not-allowed;">Offer accepted</span>')
              .replace(/data-accepted="false"/, 'data-accepted="true"');
            
            return { ...msg, text: updatedHtml };
          }
          return msg;
        })
      );
    };

    window.addEventListener('offerAccepted', handleOfferAccepted);
    return () => window.removeEventListener('offerAccepted', handleOfferAccepted);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to extract meeting link from HTML
  const extractMeetingLink = (htmlContent) => {
    // Try to extract from data attribute first
    const dataMatch = htmlContent.match(/data-meeting-link="([^"]+)"/);
    if (dataMatch && dataMatch[1]) {
      return dataMatch[1];
    }
    
    // Fallback to extracting from onclick or href attributes
    const onclickMatch = htmlContent.match(/onclick="window\.location\.href='([^']+)'"/);
    if (onclickMatch && onclickMatch[1]) {
      return onclickMatch[1];
    }
    
    const onclickMatch2 = htmlContent.match(/onclick="window\.open\('([^']+)', '_blank'\)"/);
    if (onclickMatch2 && onclickMatch2[1]) {
      return onclickMatch2[1];
    }
    
    const hrefMatch = htmlContent.match(/href="([^"]+)"/);
    if (hrefMatch && hrefMatch[1]) {
      return hrefMatch[1];
    }
    
    // Handle the format in the screenshot
    const joinCallMatch = htmlContent.match(/leJoinCall\("([^"]+)"\)/);
    if (joinCallMatch && joinCallMatch[1]) {
      return joinCallMatch[1];
    }
    
    return null;
  };

  // Function to extract offer details from HTML for accepting
  const extractOfferDetails = (htmlContent) => {
    try {
      // Extract offer ID
      const offerIdMatch = htmlContent.match(/data-offer-id="([^"]+)"/);
      const offerId = offerIdMatch ? offerIdMatch[1] : null;
      
      // Extract description
      const descriptionMatch = htmlContent.match(/<p style="margin-bottom: 10px;">(.*?)<\/p>/);
      const description = descriptionMatch ? descriptionMatch[1] : "";
      
      // Extract price - modify this to handle different price formats
      const priceMatch = htmlContent.match(/PKR ([\d,]+(?:\.\d{1,2})?)/);
      const price = priceMatch 
        ? priceMatch[1].replace(/,/g, '') // Remove commas
        : "0";
      
      // Extract delivery time
      const deliveryTimeMatch = htmlContent.match(/(\d+) Day[s]? Delivery/);
      const deliveryTime = deliveryTimeMatch ? parseInt(deliveryTimeMatch[1]) : 1;
      
      // Check if meeting is included
      const meetingIncluded = htmlContent.includes("Video meeting included");
      
      // Extract revisions if any
      const revisionsMatch = htmlContent.match(/(\d+) Revision[s]?/);
      const revisions = revisionsMatch ? parseInt(revisionsMatch[1]) : 0;
      
      return {
        offerId,
        description,
        price,
        deliveryTime,
        revisions,
        meetingIncluded
      };
    } catch (error) {
      console.error("Error extracting offer details:", error);
      return null;
    }
  };

  // Show cancel notification temporarily
  const displayCancelNotification = () => {
    setShowCancelNotification(true);
    setTimeout(() => {
      setShowCancelNotification(false);
    }, 3000);
  };

  const renderMessageContent = (msg) => {
    // Check for cancellation notification messages
    if (msg.isHTML && msg.text && msg.text.includes('data-cancelled-meeting=')) {
      const meetingIdMatch = msg.text.match(/data-cancelled-meeting="([^"]+)"/);
      const meetingId = meetingIdMatch ? meetingIdMatch[1] : null;
      
      if (meetingId) {
        setTimeout(() => {
          const meetingElement = document.getElementById(meetingId);
          if (meetingElement) {
            const titleElement = meetingElement.querySelector('.meeting-title');
            if (titleElement) {
              titleElement.textContent = "Meeting has been cancelled";
              titleElement.style.color = "#cc0000";
            }
            
            const descriptionElement = meetingElement.querySelector('.meeting-description');
            if (descriptionElement) {
              descriptionElement.style.display = "none";
            }
            
            const buttonsContainer = meetingElement.querySelector('.meeting-buttons');
            if (buttonsContainer) {
              buttonsContainer.innerHTML = `
                <span style="padding: 8px 16px; background-color: #e0e0e0; border: 1px solid #ccc; color: #888; border-radius: 5px; cursor: not-allowed; margin-right: 10px;">Cancel</span>
                <span style="padding: 8px 16px; background-color: #e0e0e0; color: #888; border: none; border-radius: 5px; cursor: not-allowed; display: inline-block;">Join</span>
              `;
            }
            
            meetingElement.style.backgroundColor = "#ffeeee";
            meetingElement.setAttribute('data-cancelled', 'true');
          }
        }, 100);
        
        return null;
      }
    }
    
    // Check for withdrawal notification messages
    if (msg.isHTML && msg.text && msg.text.includes('data-withdrawn-offer=')) {
      const offerIdMatch = msg.text.match(/data-withdrawn-offer="([^"]+)"/);
      const offerId = offerIdMatch ? offerIdMatch[1] : null;
      
      if (offerId) {
        setTimeout(() => {
          const offerElement = document.getElementById(offerId);
          if (offerElement) {
            // Change the title to "Offer withdrawn"
            const titleElement = offerElement.querySelector('h5');
            if (titleElement) {
              titleElement.textContent = "Offer withdrawn";
              titleElement.style.color = "#cc0000";
            }
            
            // Disable the buttons
            const buttonsContainer = offerElement.querySelector('.offer-buttons');
            if (buttonsContainer) {
              buttonsContainer.innerHTML = `
                <span style="padding: 8px 16px; background-color: #e0e0e0; border: 1px solid #ccc; color: #888; border-radius: 5px; cursor: not-allowed;">Offer withdrawn</span>
              `;
            }
            
            // Change the background color to indicate withdrawal
            offerElement.style.backgroundColor = "#ffeeee";
            
            // Mark as withdrawn
            offerElement.setAttribute('data-withdrawn', 'true');
          }
        }, 100);
        
        return null;
      }
    }

    // Check if message contains HTML and is a video call invitation
    if (msg.isHTML && msg.text && (msg.text.includes('video-call-invitation') || msg.text.includes('Let\'s meet up for a video call'))) {
      return <div dangerouslySetInnerHTML={{ __html: msg.text }} />;
    }
    
    // Check if message contains HTML and is an offer
    if (msg.isHTML && msg.text && msg.text.includes('offer-container')) {
      // For developer-sent offers, add an "Accept Offer" button for the student
      if (msg.msgByUserId !== senderId) {
        // Only process if it's from the developer and not already modified
        if (!msg.text.includes('Accept offer') && !msg.text.includes('data-accepted="true"') && !msg.text.includes('data-withdrawn="true"')) {
          // Extract the offer details for the acceptance modal
          const offerDetails = extractOfferDetails(msg.text);
          
          // Add Accept offer button for students
          let modifiedHtml = msg.text.replace(
            /<div style="display: flex; justify-content: flex-end;" class="offer-buttons">(.*?)<\/div>/s,
            `<div style="display: flex; justify-content: flex-end;" class="offer-buttons">
              <button onclick="acceptOffer('${offerDetails?.offerId}', '${offerDetails?.price}', '${offerDetails?.description}', ${offerDetails?.deliveryTime}, ${offerDetails?.revisions}, ${offerDetails?.meetingIncluded}); return false;" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; display: inline-block;" class="accept-btn">Accept offer</button>
            </div>`
          );
          
          // Add global function to handle accepting offers
          window.acceptOffer = (offerId, price, description, deliveryTime, revisions, meetingIncluded) => {
            // Set the current offer for the modal
            setCurrentOffer({
              offerId,
              price,
              description,
              deliveryTime,
              revisions,
              meetingIncluded: meetingIncluded === 'true'
            });
            
            // Show the accept offer modal
            setShowAcceptOfferModal(true);
          };
          
          return <div dangerouslySetInnerHTML={{ __html: modifiedHtml }} />;
        }
      }
      
      return <div dangerouslySetInnerHTML={{ __html: msg.text }} />;
    }

    // For standard text messages
    return <p className="mb-1">{msg.text}</p>;
  };
  
  // Function to accept an offer and create an order
  const acceptOffer = async () => {
    if (!currentOffer || !selectedUser || !senderId) return;
    
    try {
      // Navigate to the payment page with order details
      navigate('/pay', {
        state: {
          developerId: selectedUser._id,
          title: `Project: ${currentOffer.description.substring(0, 30)}...`,
          description: currentOffer.description,
          amount: currentOffer.price, // Ensure this is the correct price from the offer
          rate: currentOffer.price,   // Add rate as well
          deliveryTime: currentOffer.deliveryTime,
          revisions: currentOffer.revisions,
          meetingIncluded: currentOffer.meetingIncluded,
          offerId: currentOffer.offerId,
          hours: 1 // You can adjust this if needed
        }
      });
      
      // Close the modal
      setShowAcceptOfferModal(false);
      setCurrentOffer(null);
      
    } catch (error) {
      console.error("❌ Error accepting offer:", error);
      alert("There was an error processing your request. Please try again.");
    }
  };
  // Add these handler functions in your component
  const handleJoinCall = (url) => {
    if (url) {
      // Open in a new tab
      window.open(url, '_blank');
    } else {
      console.error("No valid join URL provided");
    }
  };
  
  const fetchConversations = async () => {
    if (!senderId) {
      console.log("⚠️ No sender ID available");
      return;
    }

    try {
      console.log("🔄 Fetching conversations for sender:", senderId);
      const response = await axios.get(`/api/conversations/user/${senderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        console.log("✅ Conversations fetched successfully:", response.data.length);
        setConversations(response.data);
      } else {
        console.log("⚠️ No conversations found or invalid response format");
        setConversations([]);
      }
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
      setConversations([]);
    }
  };

  // Add useEffect to fetch conversations when senderId changes
  useEffect(() => {
    if (senderId) {
      console.log("🎯 Fetching conversations for sender:", senderId);
      fetchConversations();
    }
  }, [senderId]);

  // Setup Pusher channel subscription
  useEffect(() => {
    if (!senderId || !selectedUser) {
      console.log("⚠️ Waiting for sender ID or selected user before setting up Pusher");
      return;
    }

    console.log("🎯 Setting up Pusher for student:", senderId);
    
    // Create a single Pusher instance
    const pusherInstance = new Pusher('c04d171d7e5f8f9fd830', {
      cluster: 'ap2',
      encrypted: true,
      authEndpoint: `${import.meta.env.VITE_BACKEND_URL}/pusher/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    });

    // Create a consistent channel name by sorting IDs
    const ids = [senderId, selectedUser._id].sort();
    const channelName = `private-conversation-${ids[0]}-${ids[1]}`;
    console.log("🔌 Student joining Pusher channel:", channelName);
    
    // Subscribe to the channel
    const channel = pusherInstance.subscribe(channelName);
    setPusherChannel(channel);
    
    // Add connection event handlers
    pusherInstance.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully');
    });
    
    pusherInstance.connection.bind('error', (err) => {
      console.error('❌ Pusher connection error:', err);
    });
    
    // Listen for new messages
    channel.bind('new-message', (data) => {
      console.log('📥 New message received:', data);
      // Update messages in chat window
      setMessages(prevMessages => {
        // Check if message already exists
        const messageExists = prevMessages.some(msg => msg._id === data._id);
        if (messageExists) return prevMessages;
        return [...prevMessages, data];
      });

      // Update the conversations list to show new last message
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.receiver?._id === selectedUser?._id || conv.receiver?._id === data.msgByUserId) {
            return {
              ...conv,
              messages: [data] // Update with the latest message
            };
          }
          return conv;
        });
      });
    });

    return () => {
      console.log("🧹 Cleaning up Pusher connection");
      channel.unbind_all();
      pusherInstance.unsubscribe(channelName);
      pusherInstance.disconnect();
    };
  }, [senderId, selectedUser]);

  // Fetch messages for the selected user
  useEffect(() => {
    if (!senderId || !selectedUser) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/conversations/${senderId}/${selectedUser._id}`);
        setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [selectedUser, senderId]);

  // Fetch developers list
  useEffect(() => {
    axios
      .get("/api/developers", {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setDevelopers(res.data))
      .catch((err) => console.error("❌ Error fetching developers:", err));
  }, []);

  // Handle URL changes and set selectedUser
  useEffect(() => {
    const userIdFromUrl = searchParams.get("user");
    if (userIdFromUrl) {
      const user = developers.find((dev) => dev._id === userIdFromUrl);
      if (user) {
        setSelectedUser(user);
        setIsFromNewChat(false);
      }
    }
  }, [searchParams, developers]);

  const startNewConversation = async (dev) => {
    setSelectedUser(dev);
    setIsFromNewChat(true);
    setShowNewChat(false);
    navigate(`/inbox?user=${dev._id}`);

    try {
      const response = await axios.get(
        `/api/conversations/${senderId}/${dev._id}`
      );
      if (response.data) {
        setMessages(response.data.messages || []);
      } else {
        const newConversation = await axios.post("/api/conversations/start", {
          senderId,
          receiverId: dev._id,
        });
        setMessages(newConversation.data.messages || []);
      }
    } catch (error) {
      console.error("❌ Error fetching or starting conversation:", error);
    }
  };

  const sendMessage = async (text, fileUrl = null, isHTML = false) => {
    if (!text && !fileUrl && !file) return;

    console.log("📤 Student sending message:", { text, fileUrl, isHTML });

    const formData = new FormData();
    formData.append("senderId", senderId);
    formData.append("receiverId", selectedUser._id);
    
    if (text) {
      formData.append("text", text);
      if (isHTML) {
        formData.append("isHTML", "true");
      }
    }
    
    if (file) {
      formData.append("file", file);
    } else if (fileUrl) {
      formData.append("fileUrl", fileUrl);
    }

    try {
      console.log("📡 Sending message to server");
      const response = await axios.post("/api/conversations/send", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const newMessage = response.data.newMessage;
      console.log("✅ Message sent successfully:", newMessage);
      
      // Immediately update the sender's UI with the new message
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // Update conversations list with new last message
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.receiver?._id === selectedUser?._id) {
            return {
              ...conv,
              messages: [newMessage] // Update with the latest message
            };
          }
          return conv;
        });
      });

      console.log("🔄 Sender UI updated successfully with new message");
      
      setFile(null);
      setMessage("");
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const messageDate = new Date(timestamp);
    return `Sent ${messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`;
  };

  // Function to get the last message or file count
  const getLastMessageText = (messages) => {
    if (!messages || messages.length === 0) return "No messages yet";

    const lastMessage = messages[messages.length - 1];
    
    // Check if the message is a cancellation message
    if (lastMessage.text === "Meeting has been cancelled.") {
      return "Meeting cancelled";
    }
    
    // Check if the message is a video call invitation
    if (lastMessage.isHTML && lastMessage.text && 
        (lastMessage.text.includes('video-call-invitation') || 
         lastMessage.text.includes('Let\'s meet up for a video call') ||
         lastMessage.text.includes('leJoinCall'))) {
      return "Video call invitation";
    }
    // Check if the message is an offer
    else if (lastMessage.isHTML && lastMessage.text && 
        lastMessage.text.includes('offer-container')) {
      return "New offer received";
    }
    else if (lastMessage.text) {
      return lastMessage.text;
    } else if (lastMessage.fileUrl) {
      const fileCount = messages.filter((msg) => msg.fileUrl).length;
      return `${fileCount} file${fileCount > 1 ? "s" : ""}`;
    }
    
    return "No messages yet";
  };

  // Function to delete a conversation
  const deleteConversation = async (conversationId) => {
    try {
      await axios.delete(`/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Remove the deleted conversation from the state
      setConversations((prev) =>
        prev.filter((conv) => conv._id !== conversationId)
      );

      // If the deleted conversation is currently selected, clear the selected user and messages
      if (
        selectedUser &&
        conversations.find((conv) => conv._id === conversationId)
      ) {
        setSelectedUser(null);
        setMessages([]);
      }

      console.log("✅ Conversation deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting conversation:", error);
    }
  };

  // Function to update offer status after successful payment
  const updateOfferStatus = (offerId) => {
    // Find the offer message in the messages array
    const updatedMessages = messages.map(msg => {
      if (msg.isHTML && msg.text && msg.text.includes(offerId)) {
        // Update the HTML to show offer accepted
        const updatedHtml = msg.text
          .replace(/<button onclick="acceptOffer[^>]*>Accept offer<\/button>/, 
            '<span style="padding: 8px 16px; background-color: #e0e0e0; border: 1px solid #ccc; color: #888; border-radius: 5px; cursor: not-allowed;">Offer accepted</span>')
          .replace(/data-accepted="false"/, 'data-accepted="true"');
        
        return { ...msg, text: updatedHtml };
      }
      return msg;
    });
    
    setMessages(updatedMessages);
  };

  // Function to handle successful payment
  const handlePaymentSuccess = async (orderId) => {
    try {
      // Update the offer status in the UI
      updateOfferStatus(orderId);
      
      // Send a silent message to update the developer's view
      const acceptanceNotification = `<div data-accepted-offer="${orderId}" style="display:none;"></div>`;
      sendMessage(acceptanceNotification, null, true);
      
      // Show success notification
      setToastMessage("Payment successful! Order has been placed.");
      setShowToast(true);
    } catch (error) {
      console.error("Error handling payment success:", error);
      setToastMessage("Error updating offer status");
      setShowToast(true);
    }
  };

  // Add useEffect to handle payment success
  useEffect(() => {
    const handlePaymentSuccessEvent = (event) => {
      if (event.detail && event.detail.orderId) {
        handlePaymentSuccess(event.detail.orderId);
      }
    };

    window.addEventListener('paymentSuccess', handlePaymentSuccessEvent);
    return () => window.removeEventListener('paymentSuccess', handlePaymentSuccessEvent);
  }, [messages]);

  return (
    <>
      {/* Cancellation Notification Banner */}
      {showCancelNotification && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#f8f9fa",
          border: "1px solid #dee2e6",
          borderRadius: "10px",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          zIndex: 1050
        }}>
          <div style={{
            backgroundColor: "#6c757d",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16">
              <path d="M11 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-5z"/>
              <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2zm13 2v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z"/>
            </svg>
          </div>
          <span style={{ fontWeight: "500", color: "#495057" }}>You canceled the video call</span>
        </div>
      )}
      
      {/* Toast notification */}
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={3000}
        autohide
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
        }}
        className={isDarkMode ? "bg-dark text-light" : ""}
      >
        <Toast.Header className={isDarkMode ? "bg-secondary text-light" : ""}>
          <strong className="me-auto">Notification</strong>
        </Toast.Header>
        <Toast.Body className={isDarkMode ? "text-light" : ""}>{toastMessage}</Toast.Body>
      </Toast>
      
      <div className="d-flex">
        <Container fluid className="mt-4 pb-5">
          <Row>
            <Col>
              <h3 style={{ textAlign: "center" }} className={isDarkMode ? "text-light" : "text-dark"}>
                Messages
              </h3>
              <Row className="w-100 h-100 justify-content-center">
                {/* Message Sidebar */}
                <Col
                  md={4}
                  lg={4}
                  className="d-flex flex-column border-end p-3 shadow-sm"
                  style={{
                    background: isDarkMode ? "#2a2a2a" : "#ffffff",
                    height: "80vh",
                    overflowY: "auto",
                    borderRadius: "10px 0 0 10px",
                    border: isDarkMode ? "1px solid #444" : "1px solid #ddd",
                    marginLeft: "auto",
                    marginRight: "0px",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className={`fw-bold ${isDarkMode ? "text-light" : "text-primary"}`}>Inbox</h5>
                    <FaPlus
                      className={isDarkMode ? "text-light" : "text-primary"}
                      style={{ cursor: "pointer", fontSize: "20px" }}
                      onClick={() => setShowNewChat(true)}
                    />
                  </div>
                  <Form.Control
                    type="text"
                    placeholder="Search for conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-3"
                    style={{
                      backgroundColor: isDarkMode ? "#444" : "",
                      color: isDarkMode ? "#fff" : "",
                      border: isDarkMode ? "1px solid #555" : ""
                    }}
                  />
                  <ul
                    className="list-unstyled"
                    style={{ overflowY: "auto", maxHeight: "70vh" }}
                  >
                    {loading ? (
                      // Skeleton Loading Placeholder for Conversations
                      Array.from({ length: 5 }).map((_, index) => (
                        <li
                          key={index}
                          className="d-flex align-items-center p-2 mb-2 rounded shadow-sm"
                          >
                          <Skeleton circle width={40} height={40} className="me-2" />
                          <div className="flex-grow-1">
                            <Skeleton width={150} height={20} className="mb-1" />
                            <Skeleton width={100} height={15} />
                          </div>
                        </li>
                      ))
                    ) : conversations.length === 0 ? (
                      <div className="text-center p-3">
                        <p className={isDarkMode ? "text-light" : "text-muted"}>No conversations yet</p>
                        <Button
                          variant={isDarkMode ? "outline-light" : "primary"}
                          onClick={() => setShowNewChat(true)}
                        >
                          Start a New Chat
                        </Button>
                      </div>
                    ) : (
                      conversations
                        .filter((conv) => {
                          const searchLower = searchTerm.toLowerCase();
                          const userName = `${conv.receiver?.firstName || ""} ${
                            conv.receiver?.lastName || ""
                          }`.toLowerCase();
                          return userName.includes(searchLower);
                        })
                        .map((conv) => (
                          <li
                            key={conv._id}
                            className={`d-flex align-items-center p-2 mb-2 rounded shadow-sm ${
                              selectedUser?._id === conv.receiver?._id
                                ? isDarkMode ? "bg-secondary" : "bg-light"
                                : ""
                            }`}
                            style={{
                              cursor: "pointer",
                              background: isDarkMode ? "#343a40" : "#fff",
                              transition: "0.3s",
                            }}
                            onClick={() => {
                              setSelectedUser(conv.receiver);
                              setIsFromNewChat(false);
                              navigate(`/inbox?user=${conv.receiver._id}`);
                            }}
                          >
                            <img
                              src={conv.receiver?.profilePicture || userAvatar}
                              alt={`${conv.receiver?.firstName} ${conv.receiver?.lastName}`}
                              className="rounded-circle me-2"
                              style={{
                                width: "40px",
                                height: "40px",
                                border: isDarkMode ? "2px solid #6c757d" : "2px solid #0078d4",
                              }}
                            />
                            <div className="flex-grow-1">
                              <strong className={isDarkMode ? "text-light" : ""}>{`${conv.receiver?.firstName} ${conv.receiver?.lastName}`}</strong>
                              <p
                                className={`mb-0 ${isDarkMode ? "text-light" : "text-muted"}`}
                                style={{ fontSize: "14px" }}
                              >
                                {getLastMessageText(conv.messages)}
                              </p>
                            </div>
                            <FaTrash
                              className="text-danger"
                              style={{ cursor: "pointer", fontSize: "18px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingConversationId(conv._id);
                                setShowConfirmModal(true);
                              }}
                            />
                          </li>
                        ))
                    )}
                  </ul>
                </Col>
    
                {/* Conversation Box */}
                <Col
                  md={6}
                  lg={6}
                  className="d-flex flex-column p-3 shadow-sm"
                  style={{
                    background: isDarkMode ? "#2a2a2a" : "#ffffff",
                    height: "80vh", // Fixed height
                    borderRadius: "0 10px 10px 0",
                    border: isDarkMode ? "1px solid #444" : "1px solid #ddd",
                    marginLeft: "0px",
                    marginRight: "auto",
                  }}
                >
                  {loading ? (
                    // Skeleton Loading Placeholder for Chat
                    <div className="flex-grow-1 overflow-auto p-3">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={index}
                          className="d-flex flex-column mb-3"
                          style={{
                            alignSelf: index % 2 === 0 ? "flex-start" : "flex-end",
                          }}
                        >
                          <Skeleton
                            width={Math.random() * 200 + 100}
                            height={50}
                            style={{ borderRadius: "15px" }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : selectedUser ? (
                    <>
                      <div className="text-center mb-3">
                        <h5 className={`fw-bold ${isDarkMode ? "text-light" : ""}`}>
                          Chat with{" "}
                          {isFromNewChat
                            ? selectedUser.name
                            : `${selectedUser.name}`}
                        </h5>
                      </div>
                      <div
                        className="flex-grow-1 overflow-auto p-3"
                        style={{ 
                          background: isDarkMode ? "#343a40" : "#f4f8fb", 
                          maxHeight: "65vh" 
                        }} // Enable scrolling
                      >
                        {messages.length === 0 ? (
                          <p className={isDarkMode ? "text-light text-center" : "text-muted text-center"}>
                            No messages yet
                          </p>
                        ) : (
                          messages.map((msg, index) => (
                            <div
                              key={index}
                              className={`d-flex flex-column ${
                                msg.msgByUserId === senderId
                                  ? "align-self-end"
                                  : "align-self-start"
                              } mb-3`}
                            >
                              <div
                                className="p-2 rounded shadow-sm"
                                style={{
                                  maxWidth: "80%", // Increased from 60% to accommodate video call UI
                                  borderRadius: "15px",
                                  padding: "10px 15px",
                                  alignSelf:
                                    msg.msgByUserId === senderId
                                      ? "flex-end"
                                      : "flex-start",
                                  background:
                                    msg.msgByUserId === senderId
                                      ? isDarkMode ? "#4e9a4e" : "#c2f0c2"
                                      : isDarkMode ? "#495057" : "#ffffff",
                                  color: isDarkMode ? "#fff" : "#000",
                                }}
                              >
                                {msg.text && renderMessageContent(msg)}
                                {msg.fileUrl && (
                                  <div className="d-flex align-items-center">
                                    <span className="me-1">📎</span>
                                    <a
                                      href={`${baseURL}${msg.fileUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      className="d-block text-primary text-truncate small fw-bold"
                                      style={{
                                        maxWidth: "100%",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        color: isDarkMode ? "#8bb9fe" : undefined
                                      }}
                                    >
                                      {msg.fileUrl
                                        ? msg.fileUrl.split("/").pop()
                                        : "Attachment"}
                                    </a>
                                  </div>
                                )}
                                <span
                                  className={`d-block ${isDarkMode ? "text-light" : "text-muted"}`}
                                  style={{ fontSize: "12px", opacity: isDarkMode ? 0.8 : 1 }}
                                >
                                  {formatTimestamp(msg.createdAt)}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="d-flex p-3 border-top" style={{ borderColor: isDarkMode ? "#555" : "" }}>
                        <input
                          type="file"
                          id="fileInput"
                          className="d-none"
                          onChange={(e) => setFile(e.target.files[0])}
                        />
                        <Button
                          variant={isDarkMode ? "dark" : "light"}
                          onClick={() =>
                            document.getElementById("fileInput").click()
                          }
                        >
                          <FaPlus />
                        </Button>
                        <Form.Control
                          type="text"
                          placeholder="Type your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="me-2 ms-2 flex-grow-1"
                          style={{
                            backgroundColor: isDarkMode ? "#444" : "",
                            color: isDarkMode ? "#fff" : "",
                            border: isDarkMode ? "1px solid #555" : ""
                          }}
                        />
                        <Button variant={isDarkMode ? "outline-light" : "primary"} onClick={() => sendMessage(message)}>
                          <FaPaperPlane />
                        </Button>
                      </div>
                      {file && (
                        <div className={`small mt-2 ${isDarkMode ? "text-light" : "text-muted"}`}>
                          <span>{file.name}</span>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setFile(null)}
                          >
                            ✖
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100">
                      <img
                        src={CodeUnityLogo}
                        alt="Select a conversation"
                        style={{ maxWidth: "50%" }}
                      />
                      <h4 className={isDarkMode ? "text-light" : "text-muted"}>
                        Select a conversation to start the chat
                      </h4>
                    </div>
                  )}
                </Col>
                </Row>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
        className={isDarkMode ? "text-light" : ""}
      >
        <Modal.Header closeButton className={isDarkMode ? "bg-dark text-light" : ""}>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body className={isDarkMode ? "bg-dark text-light" : ""}>
          Are you sure you want to delete this chat? This action cannot be undone.
          <div className="text-danger mt-2">
            Warning: Deleting will completely remove the chat.
          </div>
        </Modal.Body>
        <Modal.Footer className={isDarkMode ? "bg-dark text-light" : ""}>
          <Button
            variant={isDarkMode ? "outline-light" : "secondary"}
            onClick={() => setShowConfirmModal(false)}
          >
            No
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              deleteConversation(deletingConversationId);
              setShowConfirmModal(false);
            }}
          >
            Yes, Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* New Chat Modal */}
      <Modal 
        show={showNewChat} 
        onHide={() => setShowNewChat(false)} 
        centered
        className={isDarkMode ? "text-light" : ""}
      >
        <Modal.Header closeButton className={isDarkMode ? "bg-dark text-light" : ""}>
          <Modal.Title>Select a Developer to Chat</Modal.Title>
        </Modal.Header>
        <Modal.Body className={isDarkMode ? "bg-dark text-light" : ""}>
          <div className={`list-group ${isDarkMode ? "bg-dark" : ""}`}>
            {developers.map((dev) => (
              <button
                key={dev._id}
                className={`list-group-item list-group-item-action d-flex align-items-center ${
                  isDarkMode ? "bg-secondary text-light" : ""
                }`}
                onClick={() => startNewConversation(dev)}
              >
                <img
                  src={dev.profilePicture || userAvatar}
                  alt="Avatar"
                  className="rounded-circle me-3"
                  style={{ width: "40px", height: "40px" }}
                />
                <span>{dev.name}</span>
              </button>
            ))}
          </div>
        </Modal.Body>
      </Modal>
      
      {/* Accept Offer Modal */}
      <Modal
        show={showAcceptOfferModal}
        onHide={() => setShowAcceptOfferModal(false)}
        centered
        className={isDarkMode ? "text-light" : ""}
      >
        <Modal.Header closeButton className={isDarkMode ? "bg-dark text-light" : ""}>
          <Modal.Title>Confirm Order</Modal.Title>
        </Modal.Header>
        <Modal.Body className={isDarkMode ? "bg-dark text-light" : ""}>
          <p>Are you sure you want to accept this offer and place an order?</p>
          
          {currentOffer && (
            <div className={`${isDarkMode ? "bg-secondary" : "bg-light"} p-3 rounded mb-3`}>
              <h6 className="fw-bold">Offer Summary</h6>
              <p className="mb-1"><strong>Description:</strong> {currentOffer.description}</p>
              <p className="mb-1"><strong>Price:</strong> PKR {currentOffer.price}</p>
              <p className="mb-1"><strong>Delivery Time:</strong> {currentOffer.deliveryTime} day(s)</p>
              {currentOffer.revisions > 0 && (
                <p className="mb-1"><strong>Revisions:</strong> {currentOffer.revisions}</p>
              )}
              {currentOffer.meetingIncluded && (
                <p className="mb-1"><strong>Includes:</strong> Video meeting</p>
              )}
            </div>
          )}
          
          <div className={`alert ${isDarkMode ? "alert-secondary" : "alert-info"}`}>
            <small>By accepting this offer, you agree to the payment terms and conditions.</small>
          </div>
        </Modal.Body>
        <Modal.Footer className={isDarkMode ? "bg-dark text-light" : ""}>
          <Button
            variant={isDarkMode ? "outline-light" : "secondary"}
            onClick={() => setShowAcceptOfferModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={acceptOffer}
          >
            Accept & Place Order
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StudentMessages;