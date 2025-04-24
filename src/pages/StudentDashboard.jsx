import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Messages from '../components/ComMessages';
import DiscussionForum from '../pages/DiscussionForum';
import AvailableDevelopers from '../components/AvailableDevelopers';
import HelpButton from '../components/HelpButton';

const StudentDashboard = () => {
  const [selectedPage, setSelectedPage] = useState('home');
  const navigate = useNavigate();

  const handleSidebarSelection = (page) => {
    setSelectedPage(page);
  };

  const renderContent = () => {
    switch (selectedPage) {
      case 'home':
        return <AvailableDevelopers />;
      case 'messages':
        return <Messages />;
      case 'notifications':
        return <Messages />;
      case 'forum':
        return <DiscussionForum />;
      default:
        return <AvailableDevelopers />;
    }
  };

  return (
    <>
      {/* Dynamic Page Content */}
      <div className="container mt-4" style={{ flexGrow: 1, paddingBottom: '100px' }}>
        {renderContent()}
      </div>

      {/* Help Button */}
      <HelpButton />
    </>
  );
};

export default StudentDashboard;