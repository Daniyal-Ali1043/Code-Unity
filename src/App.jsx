import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout'; // Ensure the path is correct
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';
import ApplyDeveloper from './pages/ApplyDeveloper';
import StudentDashboard from './pages/StudentDashboard';
import DiscussionForum from './pages/DiscussionForum';
import ProfileCompleteness from './pages/ProfileCompleteness';
import Pay from './pages/Pay';
import OtpVerify from './pages/OtpVerify';
import AskQuestion from './components/Askquestion';
import MyAnswers from './components/Myanswers';
import AlreadyApplied from './components/AlreadyApplied';
import MessagePage from './pages/Messages';
import AvailableDevelopers from './components/AvailableDevelopers';
import Notifications from './components/Notifications';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import SubscriptionCancel from './pages/SubscriptionCancel';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import StudentDashboardContent from './components/StudentDashboardContent';
import Settings from './components/Settings';
import ErrorBoundary from './ErrorBoundary'; // Ensure the path is correct
// Import the video call room component
import VideoRoom from './pages/VideoRoom'; // You'll need to create this component
// Import the question view component
import QuestionView from './components/QuestionView'; // Import the new component
import CodeUnityPro from './pages/CodeUnityPro';
import OrderPage from './pages/OrderPage';
// Import the order listing pages - you'll need to create these components
import StudentOrders from './components/StudentOrders';
import DeveloperOrders from './components/DeveloperOrders';
import Complaint from './pages/Complaint'; // Import the Complaint page
import Faq from './pages/Faq'; // Import the FAQ page
import SetProStatus from './pages/SetProStatus';

import './App.css';
import './styles.css';

// Create a QueryClient instance
const queryClient = new QueryClient();

// Private Route Wrapper (Ensures Authentication)
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Layout Wrapper for Private Routes
const LayoutWrapper = () => {
  return (
    <Layout>
      <Outlet /> {/* This will render the nested routes */}
    </Layout>
  );
};

const App = () => {
  return (
    <ErrorBoundary> {/* Wrap the entire app with ErrorBoundary */}
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Public Routes (without Layout) */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgotpass" element={<ForgotPassword />} />
            <Route path="/verify" element={<OtpVerify />} />
            <Route path="/admindashboard" element={<AdminDashboard />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/set-pro-status" element={<SetProStatus />} />

            {/* Video Call Room Route */}
            <Route path="/room/:roomId" element={<PrivateRoute><VideoRoom /></PrivateRoute>} />

            {/* Private Routes (with Layout) */}
            <Route element={<PrivateRoute><LayoutWrapper /></PrivateRoute>}>
              <Route path="/codeunitypro" element={<CodeUnityPro />} />
              <Route path="/developerdashboard" element={<DeveloperDashboard />} />
              <Route path="/applydeveloper" element={<ApplyDeveloper />} />
              <Route path="/studentdashboard" element={<StudentDashboard />} />
              <Route path="/studentdashboardcontent" element={<StudentDashboardContent />} />
              <Route path="/developers" element={<AvailableDevelopers />} />
              <Route path="/discussionforum" element={<DiscussionForum />} />
              <Route path="/question/:questionId" element={<QuestionView />} />
              <Route path="/ask" element={<AskQuestion />} />
              <Route path="/myqna" element={<MyAnswers />} />
              <Route path="/profilecompleteness" element={<ProfileCompleteness />} />
              <Route path="/pay" element={<Pay />} />
              <Route path="/success" element={<Success />} />
              <Route path="/cancel" element={<Cancel />} />
              <Route path="/track" element={<AlreadyApplied />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/messages/:userId" element={<MessagePage />} />
              <Route path="/inbox" element={<MessagePage />} />
              <Route path="/complaint" element={<Complaint />} />
              <Route path="/faq" element={<Faq />} />
              
              {/* Order routes */}
              <Route path="/studentorders" element={<StudentOrders />} />
              <Route path="/developerorders" element={<DeveloperOrders />} />
              <Route path="/studentorders/:orderId" element={<OrderPage />} />
              <Route path="/developerorders/:orderId" element={<OrderPage />} />
            </Route>

            {/* Catch-All Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;