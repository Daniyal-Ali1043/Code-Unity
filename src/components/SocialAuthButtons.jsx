import React from "react";
import GoogleLogo from "../assets/icons8-google.svg";
import GitHubLogo from "../assets/github.png";
import LinkedInLogo from "../assets/linkedin.png";

const SocialAuthButtons = () => {
  const handleSocialLogin = (provider) => {
    // Retrieve the base URL from environment variables
    const backendURL = import.meta.env.VITE_BACKEND_URL + '/auth';

    // Redirect to backend OAuth route with provider
    window.location.href = `${backendURL}/${provider}`;
};


  return (
    <div className="d-flex flex-column gap-2">
      {/* Google Login Button */}
      <button
        className="btn btn-outline-dark d-flex align-items-center justify-content-center"
        onClick={() => handleSocialLogin("google")}
      >
        <img
          src={GoogleLogo}
          alt="Google"
          style={{ width: "20px", marginRight: "8px" }}
        />
        Sign in with Google
      </button>

      {/* GitHub Login Button */}
      <button
        className="btn btn-outline-dark d-flex align-items-center justify-content-center"
        onClick={() => handleSocialLogin("github")}
      >
        <img
          src={GitHubLogo}
          alt="GitHub"
          style={{ width: "20px", marginRight: "8px" }}
        />
        Sign in with GitHub
      </button>

      {/* LinkedIn Login Button */}
      <button
        className="btn btn-outline-dark d-flex align-items-center justify-content-center"
        onClick={() => handleSocialLogin("linkedin")}
      >
        <img
          src={LinkedInLogo}
          alt="LinkedIn"
          style={{ width: "20px", marginRight: "8px" }}
        />
        Sign in with LinkedIn
      </button>
    </div>
  );
};

export default SocialAuthButtons;
