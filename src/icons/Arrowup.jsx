import axios from "axios";
import React from "react";
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const Arrowup = ({ id }) => {
  const token = localStorage.getItem("token"); // Get token from localStorage

  const handleClick = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `/api/discussion/upvote/${id}`, // Replacing process.env with direct localhost
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, // Send token for authentication
          },
        }
      );

      if (res.status === 200) {
        alert("Upvoted successfully");
      } else {
        alert("You have already upvoted");
      }
    } catch (err) {
      console.log(err);
      alert("You have already upvoted or an error occurred.");
    }
  };

  return (
    <svg
      onClick={handleClick}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4 md:w-5 md:h-5 cursor-pointer dark:text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75"
      />
    </svg>
  );
};

export default Arrowup;
