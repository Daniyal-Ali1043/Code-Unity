
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Row, Col, Button, Modal, Form, Toast } from "react-bootstrap";
import Pusher from 'pusher-js';
import axios from "axios";
import userAvatar from "../assets/user-avatar.png";
import { FaPaperPlane, FaPlus, FaPaperclip, FaTrash, FaVideo, FaFileInvoiceDollar } from "react-icons/fa";
import CodeUnityLogo from "../assets/CodeUnity.png";
import Skeleton from "react-loading-skeleton"; 
import "react-loading-skeleton/dist/skeleton.css"; 
import Meeting from "./Meeting"; // Import the Meeting component correctly

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

// Retrieve the base URL from environment variables
const baseURL = import.meta.env.VITE_BACKEND_URL;

// Initialize Pusher with your app key
const pusher = new Pusher('c04d171d7e5f8f9fd830', {
  cluster: 'ap2',
  encrypted: true,
  authEndpoint: `${import.meta.env.VITE_BACKEND_URL}/pusher/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }
});

const DeveloperMessages = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [file, setFile] = useState(null);
  const [developerId, setDeveloperId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelNotification, setShowCancelNotification] = useState(false);
  // New state for the offer modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerDetails, setOfferDetails] = useState({
    description: "",
    revisions: 1,
    deliveryTime: 1,
    price: "",
    meetingIncluded: false,
    requirements: []
  });
  // Pusher channel state
  const [pusherChannel, setPusherChannel] = useState(null);
  // Toast notification for offer status updates
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const userId = localStorage.getItem("userId");

  // 🔍 Fetch Developer ID & Conversations
  useEffect(() => {
    if (!userId) return;

    axios
      .get(`${baseURL}/api/developers/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        if (res.data && res.data._id) {
          setDeveloperId(res.data._id);
          fetchConversations(res.data._id);
        }
      })
      .catch((err) => console.error("❌ Error fetching developer profile:", err));

    // Simulate a 2-second delay before hiding the skeleton loading
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, [userId]);

  // ✅ Fetch Conversations
  const fetchConversations = async (devId) => {
    try {
      const convRes = await axios.get(`${baseURL}/api/conversations/receiver/${devId}`);
      setConversations(convRes.data);
    } catch (err) {
      console.error("❌ Error fetching conversations:", err);
    }
  };

  // Setup Pusher channel subscription
  useEffect(() => {
    if (!developerId || !selectedUser) {
      console.log("⚠️ Waiting for developer ID or selected user");
      return;
    }

    console.log("🎯 Setting up Pusher for developer:", developerId);
    
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
    const ids = [developerId, selectedUser._id].sort();
    const channelName = `private-conversation-${ids[0]}-${ids[1]}`;
    console.log("🔌 Developer joining Pusher channel:", channelName);
    
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
          if (conv.sender?._id === selectedUser?._id || conv.sender?._id === data.msgByUserId) {
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
  }, [developerId, selectedUser]);

  // Fetch messages for the selected user
  useEffect(() => {
    if (!developerId || !selectedUser) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/conversations/${developerId}/${selectedUser._id}`);
        setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [selectedUser, developerId]);

  // Show cancel notification temporarily
  const displayCancelNotification = () => {
    setShowCancelNotification(true);
    setTimeout(() => {
      setShowCancelNotification(false);
    }, 3000);
  };

  // Display toast notification
  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // ✅ Send Message with File
  const sendMessage = async (text, fileUrl = null, isHTML = false) => {
    if (!text && !fileUrl && !file) return;

    console.log("📤 Developer sending message:", { text, fileUrl, isHTML });

    const formData = new FormData();
    formData.append("senderId", developerId);
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
          if (conv.sender?._id === selectedUser?._id) {
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

  // ✅ Format Timestamp
  const formatTimestamp = (timestamp) => {
    const messageDate = new Date(timestamp);
    return `Sent ${messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}`;
  };

  // ✅ Handle Video Call Link Generation
  const handleVideoCallLink = (callLink) => {
    // Create a proper HTML message for video call invitations
    // In the developer view, we need buttons that can be modified when cancelled
    const messageText = `
      <div class="video-call-invitation" style="border: 1px solid ${isDarkMode ? '#495057' : '#e0e0e0'}; border-radius: 10px; padding: 15px; background-color: ${isDarkMode ? '#343a40' : '#f9f9f9'}; max-width: 100%;" data-meeting-link="${callLink}" data-sender="developer" id="meeting-${Date.now()}">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="background-color: #4a86e8; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
              <path d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"/>
            </svg>
          </div>
          <div>
            <h5 style="margin: 0; font-weight: bold; color: ${isDarkMode ? '#e9ecef' : '#333'};" class="meeting-title">Let's meet up for a video call</h5>
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <p style="margin: 0; color: ${isDarkMode ? '#e9ecef' : '#333'};" class="meeting-description">Click the Join button to start the video call.</p>
        </div>
        <div style="display: flex; justify-content: flex-end;" class="meeting-buttons">
          <button onclick="cancelMeeting(this.parentElement.parentElement); return false;" style="padding: 8px 16px; background-color: ${isDarkMode ? '#495057' : 'white'}; color: ${isDarkMode ? '#e9ecef' : '#333'}; border: 1px solid ${isDarkMode ? '#6c757d' : '#ddd'}; border-radius: 5px; cursor: pointer; margin-right: 10px;" class="cancel-btn">Cancel</button>
          <a href="${callLink}" target="_blank" style="text-decoration: none;" class="join-link">
            <button style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; display: inline-block;" class="join-btn">Join</button>
          </a>
        </div>
      </div>
    `;

    // Send the HTML message
    sendMessage(messageText, null, true);

    // Add a global function to handle cancelling the meeting
    // This needs to be attached to the window object so it can be called from the HTML
    window.cancelMeeting = (meetingElement) => {
      if (!meetingElement) return;
      
      // Display the cancel notification banner
      displayCancelNotification();
      
      // Change the title to "Meeting has been cancelled"
      const titleElement = meetingElement.querySelector('.meeting-title');
      if (titleElement) {
        titleElement.textContent = "Meeting has been cancelled";
        titleElement.style.color = "#cc0000";
      }
      
      // Remove the description
      const descriptionElement = meetingElement.querySelector('.meeting-description');
      if (descriptionElement) {
        descriptionElement.style.display = "none";
      }
      
      // Disable the buttons
      const buttonsContainer = meetingElement.querySelector('.meeting-buttons');
      if (buttonsContainer) {
        buttonsContainer.innerHTML = `
          <span style="padding: 8px 16px; background-color: ${isDarkMode ? '#6c757d' : '#e0e0e0'}; border: 1px solid ${isDarkMode ? '#6c757d' : '#ccc'}; color: ${isDarkMode ? '#adb5bd' : '#888'}; border-radius: 5px; cursor: not-allowed; margin-right: 10px;">Cancel</span>
          <span style="padding: 8px 16px; background-color: ${isDarkMode ? '#6c757d' : '#e0e0e0'}; color: ${isDarkMode ? '#adb5bd' : '#888'}; border: none; border-radius: 5px; cursor: not-allowed; display: inline-block;">Join</span>
        `;
      }
      
      // Change the background color to indicate cancellation
      meetingElement.style.backgroundColor = isDarkMode ? "#3a2a2a" : "#ffeeee";
      
      // Mark as cancelled
      meetingElement.setAttribute('data-cancelled', 'true');
      
      // Send a silent message to update the other user
      const meetingId = meetingElement.id;
      const cancelNotification = `<div data-cancelled-meeting="${meetingId}" style="display:none;"></div>`;
      sendMessage(cancelNotification, null, true);
    };
  };

  // ✅ Create and send an offer message
  const handleSendOffer = () => {
    const { description, revisions, deliveryTime, price, meetingIncluded, requirements } = offerDetails;
    
    // Format requirements as a list if any are selected
    let requirementsHtml = '';
    if (requirements.length > 0) {
      requirementsHtml = `
        <div style="margin-top: 10px; margin-bottom: 10px;">
          <p style="font-weight: bold; margin-bottom: 5px; color: ${isDarkMode ? '#e9ecef' : '#333'};">Requirements:</p>
          <ul style="margin: 0; padding-left: 20px; color: ${isDarkMode ? '#e9ecef' : '#333'};">
            ${requirements.map(req => `<li>${req}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    // Create an HTML offer message
    const offerId = `offer-${Date.now()}`;
    const offerMessage = `
      <div class="offer-container" style="border: 1px solid ${isDarkMode ? '#495057' : '#e0e0e0'}; border-radius: 10px; padding: 15px; background-color: ${isDarkMode ? '#343a40' : '#f9f9f9'}; max-width: 100%;" data-offer-id="${offerId}" id="${offerId}" data-accepted="false">
        <div style="border-bottom: 1px solid ${isDarkMode ? '#495057' : '#e0e0e0'}; padding-bottom: 10px; margin-bottom: 10px;">
          <h5 style="margin: 0; font-weight: bold; color: ${isDarkMode ? '#e9ecef' : '#333'};">Here's your offer</h5>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p style="margin-bottom: 10px; font-weight: bold; color: ${isDarkMode ? '#e9ecef' : '#333'};">I will help you in c, cpp, c sharp projects and programming</p>
          <p style="margin-bottom: 10px; color: ${isDarkMode ? '#e9ecef' : '#333'};">${description}</p>
          
          <div style="margin-top: 15px;">
            <p style="font-weight: bold; margin-bottom: 5px; color: ${isDarkMode ? '#e9ecef' : '#333'};">Your offer includes:</p>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <span style="display: inline-block; margin-right: 8px;">⏱️</span>
              <span style="color: ${isDarkMode ? '#e9ecef' : '#333'};">${deliveryTime} Day${deliveryTime > 1 ? 's' : ''} Delivery</span>
            </div>
            ${revisions > 0 ? `
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <span style="display: inline-block; margin-right: 8px;">🔄</span>
              <span style="color: ${isDarkMode ? '#e9ecef' : '#333'};">${revisions} Revision${revisions > 1 ? 's' : ''}</span>
            </div>` : ''}
            ${meetingIncluded ? `
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <span style="display: inline-block; margin-right: 8px;">🎥</span>
              <span style="color: ${isDarkMode ? '#e9ecef' : '#333'};">Video meeting included</span>
            </div>` : ''}
          </div>
          
          ${requirementsHtml}
        </div>
        
        <div style="background-color: ${isDarkMode ? '#2c3034' : '#f0f0f0'}; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: ${isDarkMode ? '#e9ecef' : '#333'};">Total</span>
            <span style="font-weight: bold; font-size: 1.2rem; color: ${isDarkMode ? '#8bbeff' : '#333'};">PKR ${price}</span>
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end;" class="offer-buttons">
          <button onclick="withdrawOffer(this.parentElement.parentElement); return false;" style="padding: 8px 16px; background-color: ${isDarkMode ? '#495057' : 'white'}; color: ${isDarkMode ? '#e9ecef' : '#333'}; border: 1px solid ${isDarkMode ? '#6c757d' : '#ddd'}; border-radius: 5px; cursor: pointer; margin-right: 10px;" class="withdraw-btn">Withdraw offer</button>
        </div>
      </div>
    `;
    
    // Send the HTML message
    sendMessage(offerMessage, null, true);
    
    // Close the modal and reset the form
    setShowOfferModal(false);
    setOfferDetails({
      description: "",
      revisions: 1,
      deliveryTime: 1,
      price: "",
      meetingIncluded: false,
      requirements: []
    });
    
    // Add a global function to handle withdrawing the offer
    window.withdrawOffer = (offerElement) => {
      if (!offerElement) return;
      
      // Change the status text
      const titleElement = offerElement.querySelector('h5');
      if (titleElement) {
        titleElement.textContent = "Offer withdrawn";
        titleElement.style.color = "#cc0000";
      }
      
      // Disable the buttons
      const buttonsContainer = offerElement.querySelector('.offer-buttons');
      if (buttonsContainer) {
        buttonsContainer.innerHTML = `
          <span style="padding: 8px 16px; background-color: ${isDarkMode ? '#6c757d' : '#e0e0e0'}; border: 1px solid ${isDarkMode ? '#6c757d' : '#ccc'}; color: ${isDarkMode ? '#adb5bd' : '#888'}; border-radius: 5px; cursor: not-allowed;">Offer withdrawn</span>
        `;
      }
      
      // Change the background color to indicate withdrawal
      offerElement.style.backgroundColor = isDarkMode ? "#3a2a2a" : "#ffeeee";
      
      // Mark as withdrawn
      offerElement.setAttribute('data-withdrawn', 'true');
      
      // Send a silent message to update the other user
      const offerId = offerElement.id;
      const withdrawalNotification = `<div data-withdrawn-offer="${offerId}" style="display:none;"></div>`;
      sendMessage(withdrawalNotification, null, true);
      
      // Show toast notification
      displayToast("Offer has been withdrawn");
    };
  };

  // Add this function to handle requirements selection
  const handleRequirementChange = (requirement) => {
    setOfferDetails(prev => {
      const requirements = [...prev.requirements];
      const index = requirements.indexOf(requirement);
      
      if (index === -1) {
        requirements.push(requirement);
      } else {
        requirements.splice(index, 1);
      }
      
      return { ...prev, requirements };
    });
  };

  // Update the message rendering logic
  const renderMessage = (msg) => {
    // Check if message contains HTML and is a withdrawn offer
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
                <span style="padding: 8px 16px; background-color: ${isDarkMode ? '#6c757d' : '#e0e0e0'}; border: 1px solid ${isDarkMode ? '#6c757d' : '#ccc'}; color: ${isDarkMode ? '#adb5bd' : '#888'}; border-radius: 5px; cursor: not-allowed;">Offer withdrawn</span>
              `;
            }
            
            // Change the background color to indicate withdrawal
            offerElement.style.backgroundColor = isDarkMode ? "#3a2a2a" : "#ffeeee";
            
            // Mark as withdrawn
            offerElement.setAttribute('data-withdrawn', 'true');
          }
        }, 100);
        
        return null;
      }
    }

    // Check if message contains HTML and is an accepted offer notification
    if (msg.isHTML && msg.text && msg.text.includes('data-accepted-offer=')) {
      const offerIdMatch = msg.text.match(/data-accepted-offer="([^"]+)"/);
      const offerId = offerIdMatch ? offerIdMatch[1] : null;
      
      if (offerId) {
        setTimeout(() => {
          const offerElement = document.getElementById(offerId);
          if (offerElement) {
            // Change the title to "Offer accepted"
            const titleElement = offerElement.querySelector('h5');
            if (titleElement) {
              titleElement.textContent = "Offer accepted";
              titleElement.style.color = "#4CAF50";
            }
            
            // Disable the buttons
            const buttonsContainer = offerElement.querySelector('.offer-buttons');
            if (buttonsContainer) {
              buttonsContainer.innerHTML = `
                <span style="padding: 8px 16px; background-color: ${isDarkMode ? '#6c757d' : '#e0e0e0'}; border: 1px solid ${isDarkMode ? '#6c757d' : '#ccc'}; color: ${isDarkMode ? '#adb5bd' : '#888'}; border-radius: 5px; cursor: not-allowed;">Offer accepted</span>
              `;
            }
            
            // Change the background color to indicate acceptance
            offerElement.style.backgroundColor = isDarkMode ? "#294029" : "#f0fff0";
            
            // Mark as accepted
            offerElement.setAttribute('data-accepted', 'true');
            
            // Show toast notification
            displayToast("Your offer has been accepted and payment completed!");
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
      // For developer-sent offers, add a "Withdraw Offer" button
      if (msg.msgByUserId === developerId) {
        // Only process if it's from the developer and not already modified
        if (!msg.text.includes('data-withdrawn="true"') && !msg.text.includes('data-accepted="true"')) {
          // Add Withdraw offer button for developers
          let modifiedHtml = msg.text.replace(
            /<div style="display: flex; justify-content: flex-end;" class="offer-buttons">(.*?)<\/div>/s,
            `<div style="display: flex; justify-content: flex-end;" class="offer-buttons">
              <button onclick="withdrawOffer(this.parentElement.parentElement); return false;" style="padding: 8px 16px; background-color: ${isDarkMode ? '#495057' : 'white'}; color: ${isDarkMode ? '#e9ecef' : '#333'}; border: 1px solid ${isDarkMode ? '#6c757d' : '#ddd'}; border-radius: 5px; cursor: pointer; margin-right: 10px;" class="withdraw-btn">Withdraw offer</button>
            </div>`
          );
          
          return <div dangerouslySetInnerHTML={{ __html: modifiedHtml }} />;
        }
      }
      
      return <div dangerouslySetInnerHTML={{ __html: msg.text }} />;
    }

    // For standard text messages
    return <p className="mb-1">{msg.text}</p>;
  };

  // Function to delete a conversation
  const deleteConversation = async (conversationId) => {
    try {
      await axios.delete(`${baseURL}/api/conversations/${conversationId}`);
      // Remove the deleted conversation from the state
      setConversations(conversations.filter(conv => conv._id !== conversationId));
      // If the deleted conversation was selected, clear the selection
      if (selectedUser && deletingConversationId === conversationId) {
        setSelectedUser(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  useEffect(() => {
    if (!developerId) return;

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
              .replace(/<button onclick="withdrawOffer[^>]*>Withdraw offer<\/button>/, 
                `<span style="padding: 8px 16px; background-color: ${isDarkMode ? '#6c757d' : '#e0e0e0'}; border: 1px solid ${isDarkMode ? '#6c757d' : '#ccc'}; color: ${isDarkMode ? '#adb5bd' : '#888'}; border-radius: 5px; cursor: not-allowed;">Offer accepted</span>`)
              .replace(/data-accepted="false"/, 'data-accepted="true"');
            
            return { ...msg, text: updatedHtml };
          }
          return msg;
        })
      );
    };

    window.addEventListener('offerAccepted', handleOfferAccepted);
    return () => window.removeEventListener('offerAccepted', handleOfferAccepted);
  }, [developerId, isDarkMode]);

  return (
    <>
      {/* Cancellation Notification Banner */}
      {showCancelNotification && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: isDarkMode ? "#343a40" : "#f8f9fa",
          border: isDarkMode ? "1px solid #495057" : "1px solid #dee2e6",
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

      {/* Toast for offer status updates */}
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={3000}
        autohide
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1050,
          minWidth: '250px'
        }}
      >
        <Toast.Header>
          <strong className="me-auto">Notification</strong>
        </Toast.Header>
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>

      <div className="d-flex">
        <Container fluid className="mt-4 pb-5">
          <Row>
            <Col>
              <h3 style={{ textAlign: "center" }}>Messages</h3>
              <Row className="w-100 h-100 justify-content-center">
                {/* Sidebar with Conversations */}
                <Col
                  md={4}
                  lg={4}
                  className="d-flex flex-column border-end p-3 shadow-sm"
                  style={{
                    background: "#ffffff",
                    height: "80vh", // Fixed height
                    overflowY: "auto", // Enable vertical scrolling
                    borderRadius: "10px 0 0 10px",
                    border: "1px solid #ddd",
                    marginLeft: "auto",
                    marginRight: "0px",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-primary">Inbox</h5>
                  </div>
                  <Form.Control
                    type="text"
                    placeholder="Search for conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-3"
                  />
                  <ul className="list-unstyled" style={{ overflowY: "auto", maxHeight: "70vh" }}>
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
                    ) : (
                      conversations.map((conv) => (
                        <li
                          key={conv._id}
                          className="d-flex align-items-center p-2 mb-2 rounded shadow-sm"
                          style={{
                            cursor: "pointer",
                            background: "#fff",
                            transition: "0.3s",
                          }}
                          onClick={() => {
                            setSelectedUser(conv.sender);
                            setMessages([]);
                          }}
                        >
                          <img
                            src={conv.sender?.profilePicture || userAvatar}
                            alt={conv.sender?.username}
                            className="rounded-circle me-2"
                            style={{ width: "40px", height: "40px", border: "2px solid #0078d4" }}
                          />
                          <div className="flex-grow-1">
                            <strong>{conv.sender?.username}</strong>
                            <p className="mb-0 text-muted">
                              {conv.messages?.[0]?.text
                                ? conv.messages[0].isHTML 
                                  ? "Video call invitation"
                                  : conv.messages[0].text
                                : conv.messages?.[0]?.fileUrl
                                ? "1 File"
                                : "No messages yet"}
                            </p>
                          </div>
                          <FaTrash
                            className="text-danger"
                            style={{ cursor: "pointer", fontSize: "18px" }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent the conversation from being selected
                              setDeletingConversationId(conv._id);
                              setShowConfirmModal(true);
                            }}
                          />
                        </li>
                      ))
                    )}
                  </ul>
                </Col>

                {/* Chat Section */}
                <Col
                  md={6}
                  lg={6}
                  className="d-flex flex-column p-3 shadow-sm"
                  style={{
                    background: "#ffffff",
                    height: "80vh", // Fixed height
                    borderRadius: "0 10px 10px 0",
                    border: "1px solid #ddd",
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
                      <h5 className="fw-bold">Chat with {selectedUser.username}</h5>

                      <div
                        className="flex-grow-1 overflow-auto p-3"
                        style={{ background: "#f4f8fb", maxHeight: "65vh" }}
                      >
                        {messages.map((msg, index) => (
                          <div
                            key={index}
                            className={`d-flex flex-column ${
                              msg.msgByUserId === developerId ? "align-self-end" : "align-self-start"
                            } mb-3`}
                          >
                            <div
                              className="p-2 rounded shadow-sm"
                              style={{
                                maxWidth: "80%", // Increased from 60% to accommodate the video call UI
                                borderRadius: "15px",
                                padding: "10px 15px",
                                alignSelf: msg.msgByUserId === developerId ? "flex-end" : "flex-start",
                                background: msg.msgByUserId === developerId ? "#c2f0c2" : "#ffffff",
                              }}
                            >
                              {msg.text && renderMessage(msg)}
                              {msg.fileUrl && (
                                <div className="d-flex align-items-center">
                                  <FaPaperclip className="me-1" />
                                  <a
                                    href={`${baseURL}${msg.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary small fw-bold text-truncate d-inline-block"
                                    style={{ maxWidth: "100%" }}
                                  >
                                    {msg.fileUrl.split("/").pop()}
                                  </a>
                                </div>
                              )}
                              <span className="d-block text-muted small">{formatTimestamp(msg.createdAt)}</span>
                              </div>
                          </div>
                        ))}
                      </div>

                      <div className="d-flex p-3 border-top">
                        {/* File Input */}
                        <input
                          type="file"
                          id="fileInput"
                          className="d-none"
                          onChange={(e) => setFile(e.target.files[0])}
                        />

                        {/* File Upload Button */}
                        <Button variant="light" onClick={() => document.getElementById("fileInput").click()}>
                          <FaPlus />
                        </Button>

                        {/* Video Call Button - Using the Meeting component */}
                        <Meeting onGenerateLink={handleVideoCallLink} />
                        
                        {/* Create an Offer Button */}
                        <Button 
                          variant="light" 
                          className="ms-1" 
                          onClick={() => setShowOfferModal(true)}
                          title="Create an Offer"
                        >
                          <FaFileInvoiceDollar />
                        </Button>

                        {/* Message Input */}
                        <Form.Control
                          type="text"
                          placeholder="Type your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="mx-2 flex-grow-1"
                        />

                        {/* Send Button */}
                        <Button variant="primary" onClick={() => sendMessage(message)}>
                          <FaPaperPlane />
                        </Button>
                      </div>

                      {/* Display Selected File */}
                      {file && (
                        <div className="text-muted small mt-2">
                          <span>{file.name}</span>
                          <Button variant="danger" size="sm" onClick={() => setFile(null)}>
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
                      <h4 className="text-muted">Select a conversation to start the chat</h4>
                    </div>
                  )}
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this conversation? This action cannot be undone.
          <div className="text-danger mt-2">Warning: Deleting will completely remove the chat.</div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
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

      {/* Create Offer Modal */}
      <Modal
        show={showOfferModal}
        onHide={() => setShowOfferModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create an Offer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe what you will do for the client..."
                value={offerDetails.description}
                onChange={(e) => setOfferDetails({ ...offerDetails, description: e.target.value })}
              />
            </Form.Group>
            
            <div className="d-flex gap-3 mb-3">
              <Form.Group className="flex-grow-1">
                <Form.Label>Number of Revisions</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={offerDetails.revisions}
                  onChange={(e) => setOfferDetails({ ...offerDetails, revisions: parseInt(e.target.value) || 0 })}
                />
              </Form.Group>
              
              <Form.Group className="flex-grow-1">
                <Form.Label>Delivery Time (Days)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={offerDetails.deliveryTime}
                  onChange={(e) => setOfferDetails({ ...offerDetails, deliveryTime: parseInt(e.target.value) || 1 })}
                />
              </Form.Group>
              
              <Form.Group className="flex-grow-1">
                <Form.Label>Price (PKR)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  placeholder="0"
                  value={offerDetails.price}
                  onChange={(e) => setOfferDetails({ ...offerDetails, price: e.target.value })}
                />
              </Form.Group>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Include video meeting"
                checked={offerDetails.meetingIncluded}
                onChange={(e) => setOfferDetails({ ...offerDetails, meetingIncluded: e.target.checked })}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Requirements (Optional)</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {['Specifications document', 'Source code', 'Dependencies list', 'Project access'].map((req) => (
                  <Form.Check
                    key={req}
                    inline
                    type="checkbox"
                    label={req}
                    id={`requirement-${req.replace(/\s+/g, '-').toLowerCase()}`}
                    checked={offerDetails.requirements.includes(req)}
                    onChange={() => handleRequirementChange(req)}
                    className="me-3"
                  />
                ))}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOfferModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSendOffer}
            disabled={!offerDetails.description || !offerDetails.price}
          >
            Send Offer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DeveloperMessages;