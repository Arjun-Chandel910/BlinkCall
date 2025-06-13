import axios from "axios";
import status from "http-status";
import { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Bounce } from "react-toastify";

const AuthContext = createContext();

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const handleRegister = async (name, email, password) => {
    try {
      const request = await client.post("/register", {
        name: name,
        email: email,
        password: password,
      });
      if (request.status === status.CREATED) {
        toast.success("Registered successfully", {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Bounce,
        });
        console.log(request.data.token);
        localStorage.setItem("authToken", request.data.token);
        navigate("/");
      }
    } catch (e) {
      toast.error(
        e.response?.data?.message || e.message || "Something went wrong",
        {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        }
      );
    }
  };
  const handleLogin = async (email, password) => {
    try {
      const request = await client.post("/login", {
        email: email,
        password: password,
      });
      if (request.status === 200) {
        toast.success(request.data.message, {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Bounce,
        });
      }
      console.log(request.data.token);
      localStorage.setItem("authToken", request.data.token);
      navigate("/");
    } catch (e) {
      toast.error(
        e.response?.data?.message || e.message || "Something went wrong",
        {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
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
  const context = useContext(AuthContext);
  return context;
};
