import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/videoComponent.css";

export default function VideoMeet() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const videoRef = useRef(null);

  const [permissions, setPermissions] = useState({
    mic: false,
    cam: false,
  });

  const [username, setUsername] = useState("");

  const checkPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const audioAllowed = stream.getAudioTracks().length > 0;
      const videoAllowed = stream.getVideoTracks().length > 0;

      setPermissions({
        mic: audioAllowed,
        cam: videoAllowed,
      });

      if (stream && videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      console.error("Permission error:", e);
    }
  };

  const connectToRoom = () => {
    if (!username.trim()) {
      alert("Enter your damn username!");
      return;
    }

    navigate(`/room/${state}`, { state: { roomId: state, name: username } });
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return (
    <div className="prejoin-container">
      <div className="prejoin-card">
        <h1 className="heading">Join the Room</h1>
        <video ref={videoRef} muted autoPlay className="preview-video" />
        <input
          type="text"
          placeholder="Enter your name"
          className="name-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={connectToRoom} className="connect-btn">
          Connect
        </button>
      </div>
    </div>
  );
}
