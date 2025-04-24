import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import BackgroundLogin from "../components/BackgroundLogin";
import OtpImage from "../assets/otp.png";
import "bootstrap/dist/css/bootstrap.min.css";

// Set the base URL for Axios requests
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const OtpVerify = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]); // OTP input fields
    const [message, setMessage] = useState(""); // For displaying messages
    const [isResending, setIsResending] = useState(false); // Resend OTP loading state
    const [canResend, setCanResend] = useState(false); // Resend OTP availability
    const [timer, setTimer] = useState(30); // Resend OTP timer
    const navigate = useNavigate();
    const location = useLocation();

    // Extract userId from URL or localStorage
    const userId = new URLSearchParams(location.search).get("userId") || localStorage.getItem("userId");

    useEffect(() => {
        if (!userId) {
            setMessage("User ID is missing. Please try logging in again.");
            return;
        }

        // Start the resend OTP timer
        const timerId = setTimeout(() => {
            setCanResend(true);
            setTimer(0);
        }, 30000);

        return () => clearTimeout(timerId);
    }, [userId]);

    useEffect(() => {
        if (!canResend) {
            const intervalId = setInterval(() => {
                setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
            }, 1000);

            return () => clearInterval(intervalId);
        }
    }, [canResend]);

    // Handle OTP input change
    const handleChange = (e, index) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Auto-focus the next input field
            if (value && index < otp.length - 1) {
                document.getElementById(`otp-${index + 1}`).focus();
            }
        }
    };

    // Handle backspace key in OTP input
    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && otp[index] === "") {
            if (index > 0) {
                document.getElementById(`otp-${index - 1}`).focus();
            }
        }
    };

    // Handle OTP confirmation
    const handleConfirm = async () => {
        const enteredOtp = otp.join("");
        if (enteredOtp.length !== 6) {
            setMessage("Please enter a 6-digit OTP.");
            return;
        }

        try {
            const response = await axios.post("/api/users/verifyOtp", {
                userId, // Use the correct userId
                otp: enteredOtp,
            });

            setMessage(response.data.message);
            const { token, role } = response.data;

            // Store the token in localStorage
            if (token) {
                localStorage.setItem("token", token);
            }

            // Redirect based on the user's role
            if (role === "student") navigate("/studentdashboard");
            else if (role === "admin") navigate("/admindashboard");
            else if (role === "developer") navigate("/developerdashboard");
            else setMessage("Unknown role. Contact support.");
        } catch (error) {
            setMessage(error.response?.data?.message || "Invalid OTP. Please try again.");
        }
    };

    // Handle OTP resend
    // Handle OTP resend
const handleResend = async () => {
    if (!canResend) return;
    setIsResending(true);

    try {
        await axios.post("/api/users/resendOtp", { userId });
        setMessage("A new OTP has been sent to your email.");
        setOtp(["", "", "", "", "", ""]); // Reset OTP fields to empty
        setCanResend(false);
        setTimer(30);

        // Reset the resend availability after 30 seconds
        setTimeout(() => {
            setCanResend(true);
        }, 30000);
    } catch (error) {
        setMessage("Failed to resend OTP. Please try again.");
    }

    setIsResending(false);
};

    return (
        <div className="d-flex flex-column flex-md-row vh-100">
            <BackgroundLogin />

            <div className="col-12 col-md-6 d-flex justify-content-center align-items-center vh-100 px-3 px-md-0">
                <div className="p-4 text-center shadow rounded bg-white w-100" style={{ maxWidth: "400px" }}>
                    <img src={OtpImage} alt="OTP Verification" className="mb-3" style={{ width: "70px" }} />
                    <h4>Verification Code</h4>
                    <p>Please enter the OTP sent to your email</p>

                    {/* OTP Input Fields */}
                    <div className="d-flex justify-content-center mb-3">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="form-control mx-1 text-center"
                                style={{
                                    width: "40px",
                                    height: "50px",
                                    fontSize: "20px",
                                    borderRadius: "5px",
                                }}
                            />
                        ))}
                    </div>

                    {/* Resend OTP Timer */}
                    {timer > 0 && !canResend && (
                        <p className="text-muted">New OTP can be resent in {timer < 10 ? `00:0${timer}` : `00:${timer}`}</p>
                    )}

                    {/* Resend and Confirm Buttons */}
                    <div className="d-flex justify-content-between mt-3">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={handleResend}
                            disabled={!canResend}
                        >
                            {isResending ? "Resending..." : "Resend"}
                        </button>
                        <button className="btn btn-primary" onClick={handleConfirm}>
                            Confirm
                        </button>
                    </div>

                    {/* Display Messages */}
                    {message && <div className="alert alert-info mt-3">{message}</div>}
                </div>
            </div>
        </div>
    );
};

export default OtpVerify;