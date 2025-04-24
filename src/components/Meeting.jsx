import React, { useState } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { FaVideo } from "react-icons/fa";

const Meeting = ({ onGenerateLink, isDarkMode }) => {
  const [roomId, setRoomId] = useState("");

  // Generate a random room ID
  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now().toString();
    const newRoomId = randomId + timestamp;
    setRoomId(newRoomId);
    return newRoomId;
  };

  const generateVideoCallLink = () => {
    const roomId = generateRoomId();
    const appID = 1656790169; // Directly use the appID as a number
    const serverSecret = "d81b77add0da495231c39ae42cb753e7"; // Directly use the serverSecret
  
    console.log("App ID:", appID, typeof appID); // Debugging
    console.log("Server Secret:", serverSecret);
  
    // Get user information if available
    const userId = localStorage.getItem('userId') || Date.now().toString();
    const userName = localStorage.getItem('username') || "User";
  
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomId,
      userId,
      userName
    );
  
    console.log("Generated Token:", kitToken);
  
    // Get the current host and protocol dynamically
    const frontendURL = window.location.origin; // This will get your current domain
  
    console.log("Frontend:", frontendURL);
  
    const callLink = `${frontendURL}/room/${roomId}?type=one-on-one`;
  
    console.log("Video Call Link:", callLink);
  
    onGenerateLink(callLink);
  };
  
  return (
    <button 
      className={`btn ${isDarkMode ? 'btn-dark' : 'btn-light'} ms-2`}
      onClick={generateVideoCallLink} 
    >
      <FaVideo />
    </button>
  );
};

export default Meeting;