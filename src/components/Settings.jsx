import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  Divider,
  Modal,
} from "@mui/material";
import { Container } from "react-bootstrap";
import { CheckCircleOutline } from "@mui/icons-material"; // Import an icon for the pop-up

const Settings = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State for logout modal

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/students/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }

        const data = await response.json();
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
      } catch (error) {
        setError("Failed to load profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      setError(
        "Password must be 8 characters or longer, and include uppercase, lowercase letters, and numbers."
      );
      return;
    }

    try {
      const response = await fetch("/api/students/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update password");
      }

      setSuccess("Password updated successfully!");
      setError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError("Failed to update password. Please check your current password and try again.");
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    setShowLogoutModal(true); // Show the logout modal
    localStorage.removeItem("token"); // Remove the token
  };

  // Handle closing the logout modal
  const handleCloseLogoutModal = () => {
    setShowLogoutModal(false);
    window.location.href = "/login"; // Redirect to login page
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        const response = await fetch("/api/students/delete-account", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete account");
        }

        localStorage.removeItem("token");
        window.location.href = "/login"; // Redirect to login page
      } catch (error) {
        setError("Failed to delete account. Please try again.");
      }
    }
  };

  return (
    <>
      {/* Main Layout */}
      <div className="d-flex">
        {/* Settings Content */}
        <Container fluid className="mt-4 pb-5" style={{ flexGrow: 1 }}>
          <Card sx={{ maxWidth: 600, margin: "auto", p: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Settings
              </Typography>

              {/* Display error or success messages */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              {/* Profile Information */}
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              <Box component="form" noValidate sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={firstName}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={lastName}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={email}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ mb: 2 }}
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Change Password Section */}
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Password must be 8 characters or longer. Combine uppercase, lowercase letters, and numbers.
                </Typography>
                <Button type="submit" variant="contained" fullWidth>
                  Save Changes
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Sign Out and Account Deletion Buttons */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                <Button variant="outlined" color="error" onClick={handleSignOut}>
                  Sign Out
                </Button>
                <Button variant="outlined" color="error" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </div>

      {/* Logout Modal */}
      <Modal
        open={showLogoutModal}
        onClose={handleCloseLogoutModal}
        aria-labelledby="logout-modal-title"
        aria-describedby="logout-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            textAlign: "center",
          }}
        >
          <CheckCircleOutline sx={{ fontSize: 60, color: "green", mb: 2 }} /> {/* Icon */}
          <Typography id="logout-modal-title" variant="h6" component="h2">
            You have been logged out
          </Typography>
          <Typography id="logout-modal-description" sx={{ mt: 2, mb: 3 }}>
            Please log back in to continue.
          </Typography>
          <Button variant="contained" onClick={handleCloseLogoutModal}>
            OK
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default Settings;