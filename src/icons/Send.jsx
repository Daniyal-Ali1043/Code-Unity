import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast"; // For notifications
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const Send = ({ answer, questionId, setAnswer, className }) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["new-answer"],
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      console.log("Token from localStorage:", token); // ✅ Debugging
  
      if (!answer.trim()) {
        toast.error("Reply cannot be empty!");
        return;
      }
  
      try {
        const response = await axios.post(
          `/api/discussion/questions/${id}/answers`,
          { reply: answer },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
  
        return response.data;
      } catch (error) {
        console.error("Error sending reply:", error.response?.data);
        throw new Error(error.response?.data?.message || "Failed to send reply.");
      }
    },
    onSuccess: () => {
      toast.success("Reply added successfully!");
      queryClient.invalidateQueries(["getAllQuestions"]);
      setAnswer("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <button
      onClick={() => mutation.mutate(questionId)}
      className={`btn btn-primary ${className}`}
      disabled={mutation.isLoading} // Disable while sending
    >
      {mutation.isLoading ? "Sending..." : "Send"}
    </button>
  );
};

export default Send;
