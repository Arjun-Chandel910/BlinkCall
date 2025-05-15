import React, { useContext, useState } from "react";
import { TextField, Button, FormControlLabel, Checkbox } from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

const Authentication = () => {
  const { handleRegister, handleLogin } = useAuth();

  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleForm = async (e) => {
    e.preventDefault();
    if (mode == "signup") {
      await handleRegister(name, email, password);
    } else if (mode == "signin") {
      await handleLogin(email, password);
    }
  };

  return (
    <div className="flex h-screen">
      <div
        className="hidden md:block md:w-2/3 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1541359927273-d76820fc43f9?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      ></div>

      <div className="w-full md:w-1/3 flex items-center justify-center bg-white py-12 px-8">
        <div className="w-full max-w-md">
          <div className="flex justify-center my-8 ">
            <div className="bg-purple-600 p-6 rounded-full">
              <AccountCircle style={{ color: "white", fontSize: 40 }} />
            </div>
          </div>
          <br />

          <div className="flex justify-center space-x-6 mb-8 mt-8 ">
            <Button
              onClick={() => setMode("signin")}
              variant={mode === "signin" ? "contained" : "outlined"}
              color="primary"
              className="w-full"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setMode("signup")}
              variant={mode === "signup" ? "contained" : "outlined"}
              color="primary"
              className="w-full"
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleForm}>
            {mode == "signup" && (
              <div>
                <TextField
                  required
                  fullWidth
                  label="name"
                  type="text"
                  variant="outlined"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  sx={{
                    mt: 2,
                  }}
                />
              </div>
            )}
            <div>
              <TextField
                fullWidth
                required
                label="Email Address"
                type="email"
                variant="outlined"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                sx={{
                  my: 2,
                }}
              />
            </div>
            <div>
              <TextField
                required
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </div>
            <div className="flex items-center justify-between mb-6">
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
              sx={{
                mt: 4,
              }}
            >
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Authentication;
