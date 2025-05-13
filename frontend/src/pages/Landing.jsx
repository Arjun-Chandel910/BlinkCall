import React from "react";
import phonesImage from "../utils/Group 77.png";
import "../App.css";
import { Link } from "react-router-dom";
export default function LandingPage() {
  return (
    <div className="landingPageContainer">
      {/* navbar */}
      <nav>
        <div className="navHeader">
          <h1>BlinkCall</h1>
        </div>
        <div className="navlist">
          <h3>Join as Guest</h3>
          <h3>Register</h3>

          <button>Login</button>
        </div>
      </nav>

      {/* body */}
      <div className="landingPageBody">
        <div className="landingPageLeft">
          <h1>
            <span style={{ color: "#FF8C00" }}>Connect </span>
            with your loved Ones
          </h1>
          <p>
            Cover a distance by{" "}
            <span
              style={{
                color: "#FF8C00",
                opacity: "1",
              }}
            >
              BlinkCall
            </span>
          </p>
          <div>
            <Link
              to={"/home"}
              style={{
                color: "black",
                textDecoration: "none",
                paddingInline: "3px",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
        <div>
          <img src={phonesImage} alt="" />
        </div>
      </div>
    </div>
  );
}
