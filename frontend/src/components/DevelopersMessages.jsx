import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Row, Col, Button, Modal, Form } from "react-bootstrap";
import axios from "axios";
import Pusher from 'pusher-js';

const DevelopersMessages = () => {
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
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerDetails, setOfferDetails] = useState({
    description: "",
    revisions: 1,
    deliveryTime: 1,
    price: "",
    meetingIncluded: false,
    requirements: []
  });

  // Initialize Pusher and set up real-time updates
  useEffect(() => {
    if (!developerId || !selectedUser) {
      console.log("⚠️ Waiting for developer ID or selected user before setting up Pusher");
      return;
    }

    console.log("🎯 Setting up Pusher for developer:", developerId);
    
    const pusher = new Pusher('c04d171d7e5f8f9fd830', {
      cluster: 'ap2',
      encrypted: true
    });

    const ids = [developerId, selectedUser._id].sort();
    const channelName = `conversation-${ids[0]}-${ids[1]}`;
    console.log("🔌 Developer joining Pusher channel:", channelName);
    
    const channel = pusher.subscribe(channelName);
    
    // Listen for new messages
    channel.bind('new-message', (data) => {
      console.log('📥 New message received:', data);
      setMessages(prevMessages => [...prevMessages, data]);
    });

    // Listen for message updates
    channel.bind('message-update', (data) => {
      console.log('🔄 Message updated:', data);
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === data._id ? data : msg
        )
      );
    });

    return () => {
      console.log("🧹 Cleaning up Pusher connection");
      pusher.disconnect();
    };
  }, [developerId, selectedUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser || !developerId) return;

    try {
      console.log("📤 Developer sending message:", { text: message.trim() });
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/conversations/send`,
        {
          senderId: developerId,
          receiverId: selectedUser._id,
          message: message.trim(),
        },
        { withCredentials: true }
      );

      const newMessage = response.data;
      console.log("✅ Message sent successfully:", newMessage);
      
      // Update local state
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setMessage("");
      
      // Trigger Pusher event
      const ids = [developerId, selectedUser._id].sort();
      const channelName = `conversation-${ids[0]}-${ids[1]}`;
      const pusher = new Pusher('c04d171d7e5f8f9fd830', {
        cluster: 'ap2',
        encrypted: true
      });
      pusher.trigger(channelName, 'new-message', newMessage);
      
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  };

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default DevelopersMessages; 