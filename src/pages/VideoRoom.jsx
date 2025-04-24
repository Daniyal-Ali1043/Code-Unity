import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Container, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';

const VideoRoom = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const callType = searchParams.get('type') || 'default';

  useEffect(() => {
    const initCall = async () => {
      try {
        const appID = 841785649;
        const serverSecret = "ba4cf1da160020f5216661a319b9e636";
        
        // Get user information from localStorage if available
        const userId = localStorage.getItem('userId') || Date.now().toString();
        const userName = localStorage.getItem('username') || 'User';

        // Create instance
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomId,
          userId,
          userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);

        // Start the call with appropriate mode
        if (callType === 'one-on-one') {
          zp.joinRoom({
            container: document.querySelector('#video-container'),
            scenario: {
              mode: ZegoUIKitPrebuilt.OneONoneCall,
            },
            showPreJoinView: true,
            showLeavingView: true,
            onLeaveRoom: () => {
              // Navigate back to previous page when user leaves the room
              navigate(-1);
            }
          });
        } else {
          // For group calls or other types
          zp.joinRoom({
            container: document.querySelector('#video-container'),
            scenario: {
              mode: ZegoUIKitPrebuilt.GroupCall,
            },
            showPreJoinView: true,
            showLeavingView: true,
            onLeaveRoom: () => {
              navigate(-1);
            }
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing video call:", error);
        setLoading(false);
      }
    };

    initCall();
  }, [roomId, callType, navigate]);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container fluid className="p-0 m-0" style={{ height: '100vh', position: 'relative' }}>
      {/* Back button */}
      <Button 
        variant="light" 
        className="position-absolute m-3" 
        style={{ top: 0, left: 0, zIndex: 1000 }}
        onClick={handleGoBack}
      >
        <FaArrowLeft /> Back
      </Button>
      
      {loading && (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      
      <div id="video-container" style={{ height: '100%', width: '100%' }} />
    </Container>
  );
};

export default VideoRoom;