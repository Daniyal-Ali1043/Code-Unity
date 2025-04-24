import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Row, Col, Button, Modal, Form } from "react-bootstrap";
import axios from "axios";
import Pusher from 'pusher-js';

const StudentMessages = () => {
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
  const [showAcceptOfferModal, setShowAcceptOfferModal] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [pusherChannel, setPusherChannel] = useState(null);

  // Initialize Pusher and set up real-time updates
  useEffect(() => {
    if (!senderId || !selectedUser) {
      console.log("⚠️ Waiting for sender ID or selected user before setting up Pusher");
      return;
    }

    console.log("🎯 Setting up Pusher for student:", senderId);
    
    const pusher = new Pusher('c04d171d7e5f8f9fd830', {
      cluster: 'ap2',
      encrypted: true
    });

    const ids = [senderId, selectedUser._id].sort();
    const channelName = `conversation-${ids[0]}-${ids[1]}`;
    console.log("🔌 Student joining Pusher channel:", channelName);
    
    const channel = pusher.subscribe(channelName);
    setPusherChannel(channel);
    
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
      if (pusherChannel) {
        pusherChannel.unsubscribe(channelName);
      }
      pusher.disconnect();
    };
  }, [senderId, selectedUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser || !senderId) return;

    try {
      console.log("📤 Student sending message:", { text: message.trim() });
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/conversations/send`,
        {
          senderId,
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
      if (pusherChannel) {
        pusherChannel.trigger('new-message', newMessage);
      }
      
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

export default StudentMessages; 