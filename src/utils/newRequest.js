import axios from "axios";

// Get the backend URL from environment variables or default to localhost
const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const newRequests = axios.create({
  baseURL: `${backendURL}/api/`,
  withCredentials: true,
});

// Add an interceptor to include the authentication token in all requests
newRequests.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem("token");
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default newRequests;
