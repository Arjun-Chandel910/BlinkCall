// frontend/context/AuthContext.js

import axios from "axios";
import { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Bounce } from "react-toastify";

const AuthContext = createContext();

const client = axios.create({
  baseURL: "https://blinkcall.onrender.com/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const handleRegister = async (name, email, password) => {
    try {
      const response = await client.post("/register", {
        name,
        email,
        password,
      });

      if (response.status === 201) {
        toast.success("Registered successfully", {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
          theme: "dark",
          transition: Bounce,
        });

        localStorage.setItem("authToken", response.data.token);
        navigate("/");
      }
    } catch (e) {
      toast.error(
        e.response?.data?.message || e.message || "Something went wrong",
        {
          position: "top-center",
          autoClose: 5000,
          theme: "light",
          transition: Bounce,
        }
      );
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await client.post("/login", { email, password });

      if (response.status === 200) {
        toast.success(response.data.message, {
          position: "top-center",
          autoClose: 2000,
          theme: "dark",
          transition: Bounce,
        });

        localStorage.setItem("authToken", response.data.token);
        navigate("/");
      }
    } catch (e) {
      toast.error(
        e.response?.data?.message || e.message || "Something went wrong",
        {
          position: "top-center",
          autoClose: 5000,
          theme: "light",
          transition: Bounce,
        }
      );
    }
  };

  const authToken = () => {
    return localStorage.getItem("authToken");
  };

  const data = {
    handleRegister,
    handleLogin,
    authToken,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
