import React from "react";
import phonesImage from "../utils/Group 77.png";
import BlurText from "../utils/BlurText";
import Beams from "../utils/Beams";
import "../App.css";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast, Bounce } from "react-toastify";

export default function LandingPage() {
  const navigate = useNavigate();
  const { authToken } = useAuth();
  console.log(authToken());
  return (
    <div
      className="landingPageContainer"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Beams
          beamWidth={2}
          beamHeight={15}
          beamNumber={12}
          lightColor="#ffffff"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={0}
        />
      </div>

      <div style={{ position: "relative", zIndex: 10 }}>
        {/* Navbar */}
        <nav>
          <div className="navHeader">
            <h1>BlinkCall</h1>
          </div>
          <div className="navlist">
            <h3
              onClick={() => {
                nagivate("/auth");
              }}
              className="pointer"
            >
              Register
            </h3>
            {authToken() ? (
              <button
                onClick={() => {
                  localStorage.removeItem("authToken");
                  toast.info("Logged out!", {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                    transition: Bounce,
                  });

                  navigate("/");
                }}
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  navigate("/auth");
                }}
              >
                Login
              </button>
            )}
          </div>
        </nav>

        {/* Body */}
        <div className="landingPageBody">
          <div className="landingPageLeft">
            <h1>
              <span style={{ color: "#FF8C00" }}>Connect </span>
              with your loved Ones
            </h1>
            <span
              style={{
                color: "#FF8C00",
                opacity: "1",
              }}
            >
              <BlurText
                text="Cover a distance with Blinkcall"
                delay={150}
                animateBy="words"
                direction="top"
                className="text-2xl mb-8"
              />
            </span>
            <div>
              {authToken() ? (
                <p
                  onClick={() => {
                    navigate("/roomcode");
                  }}
                >
                  Join a room
                </p>
              ) : (
                <p
                  onClick={() => {
                    navigate("/auth");
                  }}
                >
                  Get Started
                </p>
              )}
            </div>
          </div>

          {/* Right side image */}
          <div>
            <img
              src={phonesImage}
              alt="Phones"
              style={{ maxWidth: "100%", height: "80%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
