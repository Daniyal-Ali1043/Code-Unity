import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const ProfileCompleteness = () => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    degree: "",
    discipline: "",
    degreeStartDate: "",
    degreeEndDate: "",
    profilePicture: "",
  });

  const [errors, setErrors] = useState({});
  const [completeness, setCompleteness] = useState(0);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s'-]+$/;
    return nameRegex.test(name) && name.trim().length > 1;
  };

  const validateDiscipline = (discipline) => {
    const disciplineRegex = /^[A-Za-z\s()&.-]+$/;
    return disciplineRegex.test(discipline) && discipline.trim().length > 1;
  };

  const validateDateOfBirth = (dob) => {
    if (!dob) return false;
    const selectedDate = new Date(dob);
    const currentDate = new Date();
    const minAge = new Date(currentDate.getFullYear() - 16, currentDate.getMonth(), currentDate.getDate());
    const maxAge = new Date(currentDate.getFullYear() - 80, currentDate.getMonth(), currentDate.getDate());
    return selectedDate <= minAge && selectedDate >= maxAge;
  };

  const validateDegreeDate = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end > start;
  };

  // Validation handler
  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        return validateName(value) ? '' : 'First name must contain only letters and be at least 2 characters long';
      case 'lastName':
        return value ? (validateName(value) ? '' : 'Last name must contain only letters') : '';
      case 'discipline':
        return value ? (validateDiscipline(value) ? '' : 'Discipline contains invalid characters') : '';
      case 'dateOfBirth':
        return validateDateOfBirth(value) ? '' : 'You must be between 16 and 80 years old';
      case 'degreeStartDate':
        return value ? '' : 'Degree start date is required';
      case 'degreeEndDate':
        return validateDegreeDate(profile.degreeStartDate, value) 
          ? '' 
          : 'End date must be after start date';
      case 'degree':
        return value ? '' : 'Please select a degree';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const {
          firstName,
          lastName,
          email,
          dateOfBirth,
          degree,
          discipline,
          degreeStartDate,
          degreeEndDate,
          profilePicture,
        } = response.data;

        setProfile({
          firstName: firstName || "",
          lastName: lastName || "",
          email: email || "",
          dateOfBirth: formatISODate(dateOfBirth) || "",
          degree: degree || "",
          discipline: discipline || "",
          degreeStartDate: formatISODate(degreeStartDate) || "",
          degreeEndDate: formatISODate(degreeEndDate) || "",
          profilePicture: profilePicture || "",
        });

        setPreviewImage(profilePicture || "");
        calculateCompleteness(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  const formatISODate = (isoDate) => {
    if (!isoDate) return "";
    return new Date(isoDate).toISOString().split("T")[0]; // yyyy-MM-dd
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate and set errors
    const errorMessage = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: errorMessage,
    }));
  };

  const handleSaveProfile = async () => {
    // Validate all fields before submission
    const newErrors = {};
    Object.keys(profile).forEach(key => {
      if (key !== 'email' && key !== 'profilePicture') {
        const errorMessage = validateField(key, profile[key]);
        if (errorMessage) {
          newErrors[key] = errorMessage;
        }
      }
    });

    // If there are any errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please correct the errors before saving.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put("/api/users/profile", profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Profile updated successfully!");
      calculateCompleteness(profile);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile.");
    }
  };

  const calculateCompleteness = (data) => {
    const fields = Object.values(data);
    const filledFields = fields.filter((field) => field?.trim() !== "").length;
    const totalFields = fields.length;
    setCompleteness(Math.round((filledFields / totalFields) * 100));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate image file
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validImageTypes.includes(file.type)) {
        toast.error("Only JPEG, PNG, and GIF images are allowed.");
        return;
      }

      if (file.size > maxSize) {
        toast.error("Image must be less than 5MB.");
        return;
      }

      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", selectedImage);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("/api/users/upload-profile-picture", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        setProfile((prev) => ({
          ...prev,
          profilePicture: response.data.profilePicture,
        }));
        setPreviewImage(response.data.profilePicture);
        setShowModal(false);
        toast.success("Profile picture updated successfully!");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Failed to update profile picture.");
    }
  };

  return (
    <>
      <div className="d-flex">
        <div className="container mt-4">
          <h1 className="text-center mb-4">Profile Completeness</h1>

          <div className="progress mb-4" style={{ height: "20px" }}>
            <div
              className={`progress-bar ${
                completeness === 100 ? "bg-success" : "bg-primary"
              }`}
              role="progressbar"
              style={{ width: `${completeness}%` }}
            >
              {completeness}%
            </div>
          </div>

          {/* Profile Picture Section */}
          <div className="text-center mb-4">
            <div
              className="d-inline-block position-relative"
              style={{ width: "150px", height: "150px" }}
            >
              <img
                src={previewImage || "https://via.placeholder.com/150"}
                alt="Profile"
                className="rounded-circle w-100 h-100"
                style={{ objectFit: "cover" }}
              />
              <button
                className="btn btn-primary rounded-circle position-absolute d-flex align-items-center justify-content-center"
                style={{
                  width: "30px",
                  height: "30px",
                  bottom: "3px",
                  right: "3px",
                  fontSize: "0.8rem",
                }}
                onClick={() => setShowModal(true)}
              >
                <i className="fas fa-camera"></i>
              </button>
            </div>
          </div>

          {/* Success/Error Message */}
          {message && <div className="alert alert-info">{message}</div>}

          {/* Profile Form */}
          <form>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                  value={profile.firstName}
                  onChange={handleInputChange}
                />
                {errors.firstName && (
                  <div className="invalid-feedback">{errors.firstName}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                  value={profile.lastName}
                  onChange={handleInputChange}
                />
                {errors.lastName && (
                  <div className="invalid-feedback">{errors.lastName}</div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={profile.email}
                readOnly
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`}
                value={profile.dateOfBirth}
                onChange={handleInputChange}
              />
              {errors.dateOfBirth && (
                <div className="invalid-feedback">{errors.dateOfBirth}</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Degree</label>
              <select
                name="degree"
                className={`form-select ${errors.degree ? 'is-invalid' : ''}`}
                value={profile.degree}
                onChange={handleInputChange}
              >
                <option value="">Select Degree</option>
                <option value="Bachelor's">Bachelor's</option>
                <option value="Master's">Master's</option>
                <option value="PhD">PhD</option>
              </select>
              {errors.degree && (
                <div className="invalid-feedback">{errors.degree}</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Discipline of Degree</label>
              <input
                type="text"
                name="discipline"
                className={`form-control ${errors.discipline ? 'is-invalid' : ''}`}
                value={profile.discipline}
                onChange={handleInputChange}
              />
              {errors.discipline && (
                <div className="invalid-feedback">{errors.discipline}</div>
              )}
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Degree Start Date</label>
                <input
                  type="date"
                  name="degreeStartDate"
                  className={`form-control ${errors.degreeStartDate ? 'is-invalid' : ''}`}
                  value={profile.degreeStartDate}
                  onChange={handleInputChange}
                />
                {errors.degreeStartDate && (
                  <div className="invalid-feedback">{errors.degreeStartDate}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Degree End Date</label>
                <input
                  type="date"
                  name="degreeEndDate"
                  className={`form-control ${errors.degreeEndDate ? 'is-invalid' : ''}`}
                  value={profile.degreeEndDate}
                  onChange={handleInputChange}
                />
                {errors.degreeEndDate && (
                  <div className="invalid-feedback">{errors.degreeEndDate}</div>
                )}
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveProfile}
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Profile Picture Upload Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Profile Picture</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={previewImage || "https://via.placeholder.com/150"}
            alt="Profile Preview"
            className="rounded-circle mb-3 mx-auto d-block"
            style={{ width: "150px", height: "150px", objectFit: "cover" }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="form-control mb-3"
          />
          <Button variant="primary" onClick={handleUpload}>
            Upload
          </Button>
        </Modal.Body>
      </Modal>

      <ToastContainer />
    </>
  );
};

export default ProfileCompleteness;