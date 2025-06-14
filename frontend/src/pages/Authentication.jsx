import React, { useState } from "react";
import {
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Authentication = () => {
  const { handleRegister, handleLogin } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await handleRegister(name, email, password);
        navigate("/");
      } else {
        await handleLogin(email, password);
        navigate("/");
      }
    } catch (error) {
      console.error("Auth failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <div
        className="hidden md:block md:w-2/3 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1547394765-185e1e68f34e?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0')",
        }}
      ></div>

      <div className="w-full md:w-1/3 flex items-center justify-center bg-white py-12 px-8">
        <div className="w-full max-w-md">
          <div className="flex justify-center my-8">
            <div className="bg-purple-600 p-6 rounded-full">
              <AccountCircle style={{ color: "white", fontSize: 40 }} />
            </div>
          </div>

          <div className="flex justify-center space-x-6 mb-8 mt-8">
            <Button
              onClick={() => setMode("signin")}
              variant={mode === "signin" ? "contained" : "outlined"}
              color="primary"
              fullWidth
            >
              Sign In
            </Button>
            <Button
              onClick={() => setMode("signup")}
              variant={mode === "signup" ? "contained" : "outlined"}
              color="primary"
              fullWidth
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleForm}>
            {mode === "signup" && (
              <TextField
                required
                fullWidth
                label="Name"
                type="text"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mt: 2 }}
              />
            )}

            <TextField
              fullWidth
              required
              label="Email Address"
              type="email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ my: 2 }}
            />

            <TextField
              required
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between mb-6 mt-2">
              <FormControlLabel
                control={<Checkbox color="primary" />}
                label="Remember me"
              />
            </div>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ mt: 4 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Authentication;
