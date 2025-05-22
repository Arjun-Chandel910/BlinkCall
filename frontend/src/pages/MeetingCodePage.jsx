import React, { useState } from "react";
import "../styles/MeetingCodePage.css";
import { useNavigate } from "react-router-dom";

const MeetingCodePage = () => {
  const [meetingCode, setMeetingCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!meetingCode.trim()) {
      alert("Enter a damn meeting code!");
      return;
    }
    navigate(`/room/${meetingCode.trim()}`);
  };

  return (
    <div className="meeting-container">
      <h1 className="meeting-title">Join a Meeting</h1>
      <input
        type="text"
        className="meeting-input"
        placeholder="Enter meeting code"
        value={meetingCode}
        onChange={(e) => setMeetingCode(e.target.value)}
      />
      <button className="meeting-button" onClick={handleJoin}>
        Join
      </button>
    </div>
  );
};

export default MeetingCodePage;
